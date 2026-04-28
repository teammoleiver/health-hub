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
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!lovableKey) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, serviceKey);

    // Find self profile and pull recent posts
    const { data: self } = await admin.from("social_profiles").select("id").eq("user_id", user.id).eq("is_self", true).maybeSingle();
    if (!self?.id) return new Response(JSON.stringify({ error: "No self profile yet — run 'Analyze my LinkedIn' first." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: posts } = await admin.from("social_posts")
      .select("post_text, likes, comments, shares, posted_at")
      .eq("user_id", user.id).eq("profile_id", self.id)
      .order("posted_at", { ascending: false })
      .limit(50);

    const usable = (posts ?? []).filter((p: any) => (p.post_text ?? "").trim().length > 30);
    if (usable.length === 0) {
      return new Response(JSON.stringify({ error: "No posts available yet — run 'Scrape my last 50 posts' first." }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load existing settings so we MERGE rather than overwrite
    const { data: settings } = await admin.from("social_writer_settings").select("*").eq("user_id", user.id).maybeSingle();

    const sample = usable.slice(0, 25).map((p: any, i: number) =>
      `--- Post ${i + 1} (likes:${p.likes ?? 0} comments:${p.comments ?? 0}) ---\n${(p.post_text ?? "").slice(0, 1200)}`
    ).join("\n\n");

    const prompt = `You will refine a LinkedIn author's "voice profile" using ONLY the posts below — never invent.

Existing voice (may be empty):
${JSON.stringify({
  about_me: settings?.about_me ?? "",
  career_summary: settings?.career_summary ?? "",
  expertise: settings?.expertise ?? "",
  target_audience: settings?.target_audience ?? "",
}, null, 2)}

Real posts (most recent first):
${sample.slice(0, 16000)}

Return JSON with keys:
- about_me: 2-3 first-person sentences. Keep it grounded in topics the author ACTUALLY talks about in the posts. If existing about_me already fits, return it unchanged.
- career_summary: one short paragraph in first person. Only mention companies/roles if they appear in the posts. Otherwise, return existing value or empty string.
- expertise: comma-separated topics ACTUALLY discussed across posts (max 12). Empty if unclear.
- target_audience: who the posts seem to address (e.g. "founders", "data engineers"). Empty if unclear.
- voice_traits: comma-separated style descriptors observed in posts (e.g. "short punchy lines, frequent questions, uses emojis sparingly").
- writing_samples: pick 3 of the highest-engagement posts verbatim joined by "\n\n---\n\n".

Rules: no generic filler ("versatile skill set", "passionate professional", "exploring opportunities"). If a key cannot be supported by the posts, return empty string.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI ${aiRes.status}: ${t.slice(0, 300)}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await aiRes.json();
    const parsed = JSON.parse(j?.choices?.[0]?.message?.content ?? "{}");

    const updates: Record<string, any> = { user_id: user.id, last_voice_enriched_at: new Date().toISOString() };
    if (typeof parsed.about_me === "string" && parsed.about_me.trim()) updates.about_me = parsed.about_me.trim();
    if (typeof parsed.career_summary === "string" && parsed.career_summary.trim()) updates.career_summary = parsed.career_summary.trim();
    if (typeof parsed.expertise === "string" && parsed.expertise.trim()) updates.expertise = parsed.expertise.trim();
    if (typeof parsed.target_audience === "string" && parsed.target_audience.trim()) updates.target_audience = parsed.target_audience.trim();
    if (typeof parsed.writing_samples === "string" && parsed.writing_samples.trim()) updates.writing_samples = parsed.writing_samples.trim();

    if (settings) await admin.from("social_writer_settings").update(updates).eq("user_id", user.id);
    else await admin.from("social_writer_settings").insert(updates);

    return new Response(JSON.stringify({ ok: true, used_posts: usable.length, summary: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});