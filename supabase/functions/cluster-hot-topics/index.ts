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
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: settings } = await admin.from("social_writer_settings").select("*").eq("user_id", user.id).maybeSingle();

    const { data: posts } = await admin.from("social_posts")
      .select("id,author,company,post_text,likes,comments,shares,posted_at,profile_id")
      .eq("user_id", user.id)
      .not("post_text", "is", null)
      .order("posted_at", { ascending: false })
      .limit(150);

    if (!posts?.length) {
      return new Response(JSON.stringify({ error: "No posts to cluster. Scrape some profiles first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const postsForPrompt = posts.map((p, i) => `[${i}] (${p.likes}L/${p.comments}C) ${p.author}@${p.company || "—"}: ${(p.post_text || "").slice(0, 400)}`).join("\n");

    const systemPrompt = "You are a B2B content strategist clustering LinkedIn posts into trending topics for a marketing automation specialist.";
    const userPrompt = `Cluster the posts below into 8-12 distinct hot topics. For each topic return:
- title (5-8 words, specific, not "AI" alone)
- description (1-2 sentences explaining the trend)
- score (0-100 based on volume + engagement)
- timeframe ("Ongoing", "Q1 2025", etc.)
- post_indices (array of [n] indices that belong to this topic)

Return JSON: {"topics":[{...}]}

POSTS:
${postsForPrompt}`;

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const provider = settings?.preferred_provider || "lovable";

    const tryOrder = provider === "anthropic" ? ["anthropic", "openai", "lovable"]
      : provider === "openai" ? ["openai", "anthropic", "lovable"]
      : ["lovable", "anthropic", "openai"];

    let resultText = "";
    let usedProvider = "";
    let lastErr: any = null;

    for (const p of tryOrder) {
      try {
        if (p === "anthropic" && anthropicKey) {
          const r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST", headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
            body: JSON.stringify({ model: settings?.anthropic_model || "claude-sonnet-4-20250514", max_tokens: 4096, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(JSON.stringify(d));
          resultText = d.content?.[0]?.text ?? ""; usedProvider = p; break;
        }
        if (p === "openai" && openaiKey) {
          const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST", headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: settings?.openai_model || "gpt-5-mini", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], response_format: { type: "json_object" } }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(JSON.stringify(d));
          resultText = d.choices?.[0]?.message?.content ?? ""; usedProvider = p; break;
        }
        if (p === "lovable" && lovableKey) {
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST", headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: settings?.lovable_model || "google/gemini-3-flash-preview", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], response_format: { type: "json_object" } }),
          });
          if (r.status === 429) throw new Error("rate_limited");
          if (r.status === 402) throw new Error("payment_required");
          const d = await r.json();
          if (!r.ok) throw new Error(JSON.stringify(d));
          resultText = d.choices?.[0]?.message?.content ?? ""; usedProvider = p; break;
        }
      } catch (e) { lastErr = e; }
    }
    if (!resultText) throw lastErr ?? new Error("no_provider_succeeded");

    const match = resultText.match(/\{[\s\S]*\}/);
    let parsed: { topics?: any[] } = {};
    try { parsed = JSON.parse(match?.[0] ?? resultText); } catch { /* ignore */ }
    const topics = parsed.topics ?? [];

    // Wipe & insert
    await admin.from("social_hot_topics").delete().eq("user_id", user.id);
    const profileIdsByPost = new Map(posts.map(p => [String(posts.indexOf(p)), p.profile_id]));
    const inserts = topics.map((t: any) => {
      const indices: number[] = (t.post_indices || []).map((n: any) => Number(n)).filter((n: number) => !Number.isNaN(n));
      const relatedIds = indices.map(i => posts[i]?.id).filter(Boolean);
      const profSet = new Set(indices.map(i => profileIdsByPost.get(String(i))).filter(Boolean));
      return {
        user_id: user.id, title: t.title, description: t.description, score: Number(t.score) || 0,
        timeframe: t.timeframe || null, post_count: indices.length, profile_count: profSet.size, related_post_ids: relatedIds,
      };
    }).filter((t: any) => t.title);
    if (inserts.length) await admin.from("social_hot_topics").insert(inserts);

    return new Response(JSON.stringify({ topics: inserts.length, provider: usedProvider }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("cluster-hot-topics:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
