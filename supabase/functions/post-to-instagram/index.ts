import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH = "https://graph.facebook.com/v21.0";

/**
 * Publish a single image to Instagram Business via the 2-step container flow:
 *   1. POST /{ig_id}/media with image_url + caption  → returns container id
 *   2. POST /{ig_id}/media_publish with creation_id   → publishes
 *
 * Instagram requires an image — text-only posts are not allowed by the API.
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
    if (!conn) return json({ error: "Instagram (Meta) not connected" }, 400);

    const igId: string | undefined = conn.raw_profile?.primary_page?.instagram_business_account?.id;
    const pageToken: string | undefined = conn.raw_profile?.primary_page?.access_token;
    if (!igId || !pageToken) {
      return json({ error: "No Instagram Business account is linked to your Page. Switch your IG account to Business/Creator and link it to your Page, then reconnect." }, 400);
    }

    let entry: any = null;
    if (planId) {
      const { data } = await admin.from("social_content_plan").select("*")
        .eq("id", planId).eq("user_id", user.id).maybeSingle();
      if (!data) return json({ error: "Plan entry not found" }, 404);
      entry = data;
    }

    const caption: string = (overrideText ?? composePostText(entry?.hook, entry?.body)).trim();
    const imageUrl: string | null = overrideImageUrl ?? entry?.image_url ?? null;
    if (!imageUrl) return json({ error: "Instagram requires an image. Add an image to the post first." }, 400);

    // Safety guard: 30s minimum gap between successful Instagram posts
    {
      const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
      const { data: recent } = await admin.from("webhook_logs")
        .select("attempted_at, ok").eq("user_id", user.id).eq("platform", "instagram")
        .gte("attempted_at", since).order("attempted_at", { ascending: false }).limit(20);
      const successes = (recent ?? []).filter((r: any) => r.ok);
      const last = successes[0] ? new Date(successes[0].attempted_at).getTime() : 0;
      if (last && Date.now() - last < 30_000) {
        const wait = Math.ceil((30_000 - (Date.now() - last)) / 1000);
        return json({ error: `Slow down — wait ${wait}s before posting again to avoid Instagram rate limits.` }, 429);
      }
      // Instagram caps ~25 posts/24h per account. Soft-cap at 20.
      if (successes.length >= 20) {
        return json({ error: "Daily Instagram limit reached (20 posts/24h)." }, 429);
      }
    }

    const startedAt = Date.now();

    // Step 1: create container
    const createUrl = `${GRAPH}/${igId}/media`;
    const createBody = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: pageToken,
    });
    const createRes = await fetch(createUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: createBody.toString(),
    });
    const createText = await createRes.text();
    let createJson: any;
    try { createJson = createText ? JSON.parse(createText) : null; } catch { createJson = null; }
    if (!createRes.ok || !createJson?.id) {
      await admin.from("webhook_logs").insert({
        user_id: user.id, plan_id: planId ?? null, platform: "instagram",
        webhook_url: createUrl,
        request_payload: { image_url: imageUrl, caption, access_token: "[redacted]" },
        status_code: createRes.status, ok: false,
        response_body: createText.slice(0, 4000),
        error: createJson?.error?.message ?? `Container creation failed (HTTP ${createRes.status})`,
        duration_ms: Date.now() - startedAt,
        trigger_kind: "manual",
      });
      return json({ error: createJson?.error?.message ?? `Container creation failed: ${createText.slice(0, 300)}` }, 500);
    }
    const containerId: string = createJson.id;

    // Step 2: publish
    const publishUrl = `${GRAPH}/${igId}/media_publish`;
    const publishBody = new URLSearchParams({ creation_id: containerId, access_token: pageToken });
    const publishRes = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishBody.toString(),
    });
    const publishText = await publishRes.text();
    let publishJson: any;
    try { publishJson = publishText ? JSON.parse(publishText) : null; } catch { publishJson = null; }
    const ok = publishRes.ok && !publishJson?.error;
    const mediaId: string | null = publishJson?.id ?? null;
    const errorMsg: string | null = publishJson?.error?.message ?? (ok ? null : `HTTP ${publishRes.status}`);

    await admin.from("webhook_logs").insert({
      user_id: user.id, plan_id: planId ?? null, platform: "instagram",
      webhook_url: publishUrl,
      request_payload: { creation_id: containerId, _image_url: imageUrl, _caption: caption.slice(0, 500) },
      status_code: publishRes.status,
      ok,
      response_body: publishText.slice(0, 4000),
      error: ok ? null : errorMsg,
      duration_ms: Date.now() - startedAt,
      trigger_kind: "manual",
    });

    if (planId) {
      await admin.from("social_content_plan").update({
        status: ok ? "posted" : "failed",
        webhook_status: ok ? "ok" : "error",
        webhook_sent_at: new Date().toISOString(),
        webhook_response: [{ platform: "instagram", status: publishRes.status, ok, media_id: mediaId, container_id: containerId }],
        webhook_error: ok ? null : errorMsg,
        posted_at: ok ? new Date().toISOString() : null,
      }).eq("id", planId);
    }

    if (!ok) return json({ error: errorMsg, raw: publishJson, status: publishRes.status }, 500);
    return json({ ok: true, media_id: mediaId, container_id: containerId, status: publishRes.status });
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
