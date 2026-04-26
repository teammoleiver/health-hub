// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeActorId(input?: string | null): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    const actorIndex = parts.indexOf("actors");
    if (actorIndex >= 0 && parts[actorIndex + 1]) return parts[actorIndex + 1];
    const storeIndex = parts.indexOf("store");
    if (storeIndex >= 0 && parts[storeIndex + 1] && parts[storeIndex + 2]) return `${parts[storeIndex + 1]}~${parts[storeIndex + 2]}`;
    if (parts.length >= 2 && url.hostname.includes("apify.com")) return `${parts[0]}~${parts[1]}`;
  } catch { /* raw id */ }
  const cleaned = raw.replace(/^\/+/, "").replace(/\/+$/, "");
  if (cleaned.startsWith("actors/")) return cleaned.split("/")[1] ?? "";
  return cleaned.replace("/", "~");
}

function linkedinInput(profileUrl: string, limit = 1) {
  const url = profileUrl || "https://www.linkedin.com/in/williamhgates/";
  return {
    url,
    urls: [url],
    profileUrls: [url],
    startUrls: [{ url }],
    limit,
    maxItems: limit,
    maxPosts: limit,
    postsLimit: limit,
  };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { account_id, mode = "run", profile_url } = await req.json();
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: acc, error } = await admin.from("social_apify_accounts").select("*").eq("id", account_id).eq("user_id", user.id).single();
    if (error || !acc) throw new Error("Account not found");

    // 1) Auth check
    const meRes = await fetch(`https://api.apify.com/v2/users/me?token=${acc.api_token}`);
    if (!meRes.ok) {
      const txt = await meRes.text();
      await admin.from("social_apify_accounts").update({
        last_test_status: `auth error ${meRes.status}`, last_test_at: new Date().toISOString(),
      }).eq("id", account_id);
      return new Response(JSON.stringify({ ok: false, status: `auth error ${meRes.status}`, info: txt }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const meJson = await meRes.json();

    if (mode === "health") {
      await admin.from("social_apify_accounts").update({
        last_test_status: "health ok", last_test_at: new Date().toISOString(),
      }).eq("id", account_id);
      return new Response(JSON.stringify({
        ok: true,
        status: "health ok",
        info: { username: meJson?.data?.username, plan: meJson?.data?.plan },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2) Trigger a tiny real actor run and wait for the final status, so "ok" means it really produced data.
    const actorId = normalizeActorId(acc.actor_id || Deno.env.get("APIFY_LINKEDIN_ACTOR_ID") || "94SdiE9JwTx0RNyfS");
    const actorPath = encodeURIComponent(actorId);
    const runRes = await fetch(`https://api.apify.com/v2/acts/${actorPath}/runs?token=${acc.api_token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(linkedinInput(profile_url || "https://www.linkedin.com/in/williamhgates/", 1)),
    });
    const runText = await runRes.text();
    let runInfo: any = null;
    try { runInfo = JSON.parse(runText); } catch { /* ignore */ }
    if (!runRes.ok || !runInfo?.data?.id) {
      const status = `run error ${runRes.status}`;
      await admin.from("social_apify_accounts").update({ last_test_status: status, last_test_at: new Date().toISOString() }).eq("id", account_id);
      return new Response(JSON.stringify({ ok: false, status, info: { actor_id: actorId, raw: runText.slice(0, 700) } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let finalRun = runInfo.data;
    for (let i = 0; i < 24; i++) {
      const status = finalRun?.status;
      if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) break;
      await wait(2000);
      const pollRes = await fetch(`https://api.apify.com/v2/actor-runs/${runInfo.data.id}?token=${acc.api_token}`);
      const pollJson = await pollRes.json().catch(() => null);
      if (pollJson?.data) finalRun = pollJson.data;
    }

    let itemCount = 0;
    if (finalRun?.defaultDatasetId) {
      const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${finalRun.defaultDatasetId}/items?token=${acc.api_token}&clean=true&limit=1`);
      const items = await itemsRes.json().catch(() => []);
      itemCount = Array.isArray(items) ? items.length : 0;
    }

    const finished = finalRun?.status === "SUCCEEDED";
    const runOk = finished && itemCount > 0;
    const status = runOk ? "ok" : finished ? "no results" : String(finalRun?.status ?? "running").toLowerCase();
    await admin.from("social_apify_accounts").update({
      last_test_status: status, last_test_at: new Date().toISOString(),
    }).eq("id", account_id);

    return new Response(JSON.stringify({
      ok: runOk, status,
      info: { username: meJson?.data?.username, plan: meJson?.data?.plan,
              run_id: runInfo?.data?.id, run_url: runInfo?.data?.id ? `https://console.apify.com/actors/${actorId}/runs/${runInfo.data.id}` : null,
              actor_id: actorId, run_status: finalRun?.status, item_count: itemCount,
              raw: runOk ? undefined : runText.slice(0, 700) },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
