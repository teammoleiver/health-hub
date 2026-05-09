import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH = "https://graph.facebook.com/v21.0";

/**
 * Publish to a Facebook Page using the page access token stored in the
 * meta connection row. Same dual-caller pattern as post-to-linkedin —
 * end-user JWT for "Post now", service role + x-impersonate-user for cron.
 *
 * Body: { plan_id?: string, text?: string, image_url?: string }
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE);

    let user: { id: string } | null = null;
    const bearer = auth.replace(/^Bearer\s+/i, "");
    if (bearer === SERVICE) {
      const u = req.headers.get("x-impersonate-user");
      if (!u) return json({ error: "x-impersonate-user header required for service-role calls" }, 400);
      user = { id: u };
    } else {
      const { data: ur } = await admin.auth.getUser(bearer);
      if (ur?.user) user = { id: ur.user.id };
    }
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const planId: string | undefined = body?.plan_id;
    const overrideText: string | undefined = body?.text;
    const overrideImageUrl: string | undefined = body?.image_url;

    const { data: conn } = await admin.from("social_oauth_connections")
      .select("*").eq("user_id", user.id).eq("provider", "meta").maybeSingle();
    if (!conn) return json({ error: "Facebook (Meta) not connected" }, 400);

    const page = conn.raw_profile?.primary_page;
    if (!page?.id || !page?.access_token) return json({ error: "No Facebook Page on this connection. Reconnect after creating a Page." }, 400);
    const pageId: string = page.id;
    const pageToken: string = page.access_token;

    let entry: any = null;
    if (planId) {
      const { data } = await admin.from("social_content_plan").select("*")
        .eq("id", planId).eq("user_id", user.id).maybeSingle();
      if (!data) return json({ error: "Plan entry not found" }, 404);
      entry = data;
    }

    const text: string = (overrideText ?? composePostText(entry?.hook, entry?.body)).trim();
    if (!text && !(overrideImageUrl ?? entry?.image_url)) {
      return json({ error: "Post text or image_url is required" }, 400);
    }
    const imageUrl: string | null = overrideImageUrl ?? entry?.image_url ?? null;

    // Safety guard: 30s minimum gap between successful Facebook posts
    {
      const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
      const { data: recent } = await admin.from("webhook_logs")
        .select("attempted_at, ok").eq("user_id", user.id).eq("platform", "facebook")
        .gte("attempted_at", since).order("attempted_at", { ascending: false }).limit(20);
      const successes = (recent ?? []).filter((r: any) => r.ok);
      const last = successes[0] ? new Date(successes[0].attempted_at).getTime() : 0;
      if (last && Date.now() - last < 30_000) {
        const wait = Math.ceil((30_000 - (Date.now() - last)) / 1000);
        return json({ error: `Slow down — wait ${wait}s before posting again to avoid Facebook rate limits.` }, 429);
      }
    }

    const startedAt = Date.now();
    let postUrl: string;
    let postBody: URLSearchParams;
    if (imageUrl) {
      // Photo post: /{page_id}/photos with url + caption
      postUrl = `${GRAPH}/${pageId}/photos`;
      postBody = new URLSearchParams({
        url: imageUrl,
        caption: text || "",
        access_token: pageToken,
        published: "true",
      });
    } else {
      // Text-only feed post
      postUrl = `${GRAPH}/${pageId}/feed`;
      postBody = new URLSearchParams({
        message: text,
        access_token: pageToken,
      });
    }

    const postRes = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: postBody.toString(),
    });
    const respText = await postRes.text();
    let respJson: any;
    try { respJson = respText ? JSON.parse(respText) : null; } catch { respJson = null; }
    const ok = postRes.ok && !respJson?.error;
    const postId: string | null = respJson?.id ?? respJson?.post_id ?? null;
    const errorMsg: string | null = respJson?.error?.message ?? (ok ? null : `HTTP ${postRes.status}`);

    await admin.from("webhook_logs").insert({
      user_id: user.id, plan_id: planId ?? null, platform: "facebook",
      webhook_url: postUrl,
      request_payload: { ...Object.fromEntries(postBody), access_token: "[redacted]", _image_url: imageUrl, _has_image: !!imageUrl },
      status_code: postRes.status,
      ok,
      response_body: respText.slice(0, 4000),
      error: ok ? null : errorMsg,
      duration_ms: Date.now() - startedAt,
      trigger_kind: "manual",
    });

    if (planId) {
      await admin.from("social_content_plan").update({
        status: ok ? "posted" : "failed",
        webhook_status: ok ? "ok" : "error",
        webhook_sent_at: new Date().toISOString(),
        webhook_response: [{ platform: "facebook", status: postRes.status, ok, post_id: postId }],
        webhook_error: ok ? null : errorMsg,
        posted_at: ok ? new Date().toISOString() : null,
      }).eq("id", planId);
    }

    if (!ok) return json({ error: errorMsg, raw: respJson, status: postRes.status }, 500);
    return json({ ok: true, post_id: postId, status: postRes.status });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function composePostText(hook: string | null | undefined, body: string | null | undefined): string {
  const h = (hook ?? "").trim();
  const b = (body ?? "").trim();
  if (!b) return h;
  if (!h) return b;
  const firstLine = b.split(/\r?\n/).find((l) => l.trim().length > 0)?.trim() ?? "";
  if (norm(firstLine) === norm(h)) return b;
  return `${h}\n\n${b}`;
}
function norm(s: string): string {
  return s.toLowerCase().replace(/[\s.,!?:;"'`’]+/g, " ").trim();
}

function json(o: any, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
