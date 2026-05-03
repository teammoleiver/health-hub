import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function renderTemplate(tpl: any, ctx: Record<string, any>): any {
  if (tpl == null) return tpl;
  if (typeof tpl === "string") {
    return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
      const v = key.split(".").reduce((acc: any, k: string) => (acc == null ? acc : acc[k]), ctx);
      return v == null ? "" : String(v);
    });
  }
  if (Array.isArray(tpl)) return tpl.map((t) => renderTemplate(t, ctx));
  if (typeof tpl === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(tpl)) out[k] = renderTemplate(v, ctx);
    return out;
  }
  return tpl;
}

function defaultPayload(platform: string, ctx: Record<string, any>) {
  return { platform, hook: ctx.hook, body: ctx.body, image_url: ctx.image_url, scheduled_at: ctx.scheduled_at, plan_id: ctx.plan_id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  let bodyJson: any = {};
  try { bodyJson = await req.json(); } catch { /* GET / cron */ }
  const single_plan_id: string | undefined = bodyJson?.plan_id;

  // For single push: validate caller owns it
  let userScope: string | null = null;
  if (single_plan_id) {
    const auth = req.headers.get("Authorization") || "";
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    userScope = user.id;
  }

  // Find candidate posts
  let q = admin.from("social_content_plan").select("*");
  if (single_plan_id) {
    q = q.eq("id", single_plan_id).eq("user_id", userScope!);
  } else {
    // cron mode: scheduled posts whose date+time <= now
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hhmm = now.toISOString().slice(11, 19);
    q = q.eq("status", "scheduled").lte("scheduled_date", today);
  }
  const { data: posts, error } = await q;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const results: any[] = [];
  for (const post of posts ?? []) {
    // Cron-only time filter
    if (!single_plan_id && post.scheduled_time) {
      const now = new Date();
      const [h, m] = String(post.scheduled_time).split(":").map(Number);
      const due = new Date(`${post.scheduled_date}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00Z`);
      if (due.getTime() > now.getTime()) continue;
    }

    const platforms: string[] = (post.platforms?.length ? post.platforms : (post.platforms ?? [])) as string[];
    if (!platforms.length) {
      results.push({ id: post.id, skipped: "no_platforms" });
      continue;
    }

    const ctx = {
      hook: post.hook, body: post.body, image_url: post.image_url,
      scheduled_at: post.scheduled_date && post.scheduled_time ? `${post.scheduled_date}T${post.scheduled_time}` : post.scheduled_date,
      plan_id: post.id,
    };

    const perPlatform: any[] = [];
    let anyError = false;
    for (const platform of platforms) {
      const { data: cfg } = await admin.from("social_webhook_settings").select("*")
        .eq("user_id", post.user_id).eq("platform", platform).maybeSingle();
      if (!cfg?.webhook_url || !cfg.active) {
        perPlatform.push({ platform, error: "no_webhook_configured" });
        anyError = true;
        continue;
      }
      const payload = cfg.json_template && Object.keys(cfg.json_template).length
        ? renderTemplate(cfg.json_template, { ...ctx, platform })
        : defaultPayload(platform, ctx);
      try {
        const resp = await fetch(cfg.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const text = await resp.text();
        perPlatform.push({ platform, status: resp.status, ok: resp.ok, body: text.slice(0, 500) });
        if (!resp.ok) anyError = true;
      } catch (e: any) {
        perPlatform.push({ platform, error: String(e?.message ?? e) });
        anyError = true;
      }
    }

    const newStatus = anyError ? "failed" : "posted";
    await admin.from("social_content_plan").update({
      status: newStatus,
      webhook_status: anyError ? "error" : "ok",
      webhook_sent_at: new Date().toISOString(),
      webhook_response: perPlatform,
      webhook_error: anyError ? perPlatform.filter((r) => r.error || !r.ok).map((r) => `${r.platform}: ${r.error ?? r.status}`).join("; ") : null,
      posted_at: anyError ? null : new Date().toISOString(),
    }).eq("id", post.id);

    results.push({ id: post.id, status: newStatus, perPlatform });
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});