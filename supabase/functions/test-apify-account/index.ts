// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { account_id } = await req.json();
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

    // 2) Trigger a tiny real actor run so it shows up in the user's Apify console
    const actorId = acc.actor_id || Deno.env.get("APIFY_LINKEDIN_ACTOR_ID") || "94SdiE9JwTx0RNyfS";
    const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${acc.api_token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Minimal input — most LinkedIn actors accept a urls array. Limit=1 keeps cost ~$0.05.
        urls: ["https://www.linkedin.com/in/williamhgates/"],
        startUrls: [{ url: "https://www.linkedin.com/in/williamhgates/" }],
        profileUrls: ["https://www.linkedin.com/in/williamhgates/"],
        limit: 1, maxItems: 1, maxPosts: 1, postsLimit: 1,
      }),
    });
    const runText = await runRes.text();
    let runInfo: any = null;
    try { runInfo = JSON.parse(runText); } catch { /* ignore */ }

    const runOk = runRes.ok;
    const status = runOk ? "ok" : `run error ${runRes.status}`;
    await admin.from("social_apify_accounts").update({
      last_test_status: status, last_test_at: new Date().toISOString(),
    }).eq("id", account_id);

    return new Response(JSON.stringify({
      ok: runOk, status,
      info: { username: meJson?.data?.username, plan: meJson?.data?.plan,
              run_id: runInfo?.data?.id, run_url: runInfo?.data?.id ? `https://console.apify.com/actors/${actorId}/runs/${runInfo.data.id}` : null,
              actor_id: actorId, raw: runOk ? undefined : runText.slice(0, 500) },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
