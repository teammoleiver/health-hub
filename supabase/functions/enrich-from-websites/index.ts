// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jr(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function linkupSearch(apiKey: string, query: string, depth: "standard" | "deep" = "deep") {
  const r = await fetch("https://api.linkup.so/v1/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ q: query, depth, outputType: "sourcedAnswer", includeImages: false }),
  });
  const text = await r.text();
  let json: any = null; try { json = JSON.parse(text); } catch { /* */ }
  if (!r.ok) throw new Error(`Linkup ${r.status}: ${text.slice(0, 300)}`);
  return {
    answer: (json?.answer ?? json?.sourcedAnswer ?? "").toString(),
    sources: Array.isArray(json?.sources) ? json.sources.slice(0, 8) : [],
  };
}

function normalizeUrl(u: string): string | null {
  const s = (u || "").trim();
  if (!s) return null;
  try { return new URL(s.startsWith("http") ? s : `https://${s}`).toString(); } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const linkupKey = Deno.env.get("LINKUP_API_KEY");

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes.user;
    if (!user) return jr({ error: "Unauthorized" }, 401);
    if (!linkupKey) return jr({ error: "LINKUP_API_KEY not configured" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const { websites } = (body ?? {}) as { websites?: string[] };

    const { data: settings } = await admin.from("social_writer_settings").select("*").eq("user_id", user.id).maybeSingle();

    // Persist provided list (if any)
    let list: string[] = Array.isArray(websites)
      ? websites
      : (Array.isArray((settings as any)?.reference_websites) ? (settings as any).reference_websites : []);
    list = Array.from(new Set(list.map(normalizeUrl).filter(Boolean) as string[])).slice(0, 100);

    if (Array.isArray(websites)) {
      const persistPatch = { user_id: user.id, reference_websites: list } as Record<string, any>;
      if (settings) await admin.from("social_writer_settings").update(persistPatch).eq("user_id", user.id);
      else await admin.from("social_writer_settings").insert(persistPatch);
    }

    if (!list.length) return jr({ error: "Add at least one website URL first." }, 400);

    // Build persona context to make queries relevant
    const persona = [
      settings?.about_me, settings?.expertise, settings?.target_audience, settings?.goals,
    ].filter(Boolean).join(" | ").slice(0, 600);

    // Per-site Linkup search — run in parallel with a per-call timeout to stay
    // within the 150s edge-function idle limit. Use "standard" depth (deep can
    // take 30-60s+ per site and serially blows the budget).
    const PER_CALL_MS = 35_000;
    const withTimeout = <T,>(p: Promise<T>, ms: number) =>
      Promise.race<T>([
        p,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout after ${ms}ms`)), ms)),
      ]);

    const perSite = await Promise.all(list.map(async (site) => {
      try {
        const host = new URL(site).host;
        const q = `From the website ${site} (site:${host}) — summarize what this brand/competitor publishes that is most relevant to: ${persona || "B2B operator audience"}. Include positioning, recurring topics, hooks, frameworks, and any notable post excerpts. Quote short verbatim snippets when helpful.`;
        const r = await withTimeout(linkupSearch(linkupKey, q, "standard"), PER_CALL_MS);
        return { url: site, answer: r.answer, sources: r.sources };
      } catch (e: any) {
        return { url: site, answer: `(failed: ${e?.message ?? e})`, sources: [] as any[] };
      }
    }));

    const usable = perSite.filter((s) => s.answer && s.answer.length > 60 && !s.answer.startsWith("(failed"));
    if (!usable.length) return jr({ error: "Linkup returned no usable data for those websites." }, 422);

    // AI distillation -> reference_web_context
    let reference_web_context = "";
    if (lovableKey) {
      const corpus = usable.map((s, i) => `### Site ${i + 1}: ${s.url}\n${s.answer.slice(0, 3500)}`).join("\n\n");
      const prompt = `You are building a COMPETITIVE / TOPICAL CONTEXT block that will be appended to a LinkedIn writer's system prompt to make their posts more informed about their space.

AUTHOR PERSONA (for relevance filtering): ${persona || "(none provided)"}

SOURCES (Linkup deep web search per website):
${corpus.slice(0, 14000)}

Produce a tight context block (max ~450 words) with these sections:
1. LANDSCAPE — 2-3 sentences on what these sites collectively cover.
2. RECURRING TOPICS — bullet list (max 8) of themes that come up across sites.
3. ANGLES & HOOKS — bullet list (max 6) of opening/hook patterns or framings competitors use that the author could borrow or counter.
4. DATA POINTS / CLAIMS — bullet list (max 6) of concrete stats, claims, or terms that surface repeatedly. Cite the site host in parens.
5. AUTHOR ADVANTAGE — 2-3 bullets: what gaps or contrarian takes the author could own given their persona.

Rules: be concrete, no filler, no marketing speak. If a section has nothing supported by the sources, omit it. Output plain text only (no markdown headers prefixed with #).`;

      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
          body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "user", content: prompt }] }),
        });
        if (aiRes.ok) {
          const j = await aiRes.json();
          reference_web_context = (j?.choices?.[0]?.message?.content ?? "").toString().trim();
        } else {
          console.warn("ai distill non-OK", aiRes.status, (await aiRes.text()).slice(0, 200));
        }
      } catch (e) { console.warn("distill err", e); }
    }

    if (!reference_web_context) {
      // Fallback: concatenate Linkup answers
      reference_web_context = usable.map((s) => `From ${s.url}:\n${s.answer.slice(0, 1200)}`).join("\n\n").slice(0, 6000);
    }

    const updates: Record<string, any> = {
      user_id: user.id,
      reference_websites: list,
      reference_web_context,
      last_websites_enriched_at: new Date().toISOString(),
    };
    if (settings) await admin.from("social_writer_settings").update(updates).eq("user_id", user.id);
    else await admin.from("social_writer_settings").insert(updates);

    // Save a history row so the user can review what was scraped & how it was distilled
    await admin.from("social_website_enrichments").insert({
      user_id: user.id,
      websites: list,
      sites_processed: list.length,
      sites_used: usable.length,
      per_site: perSite.map((s) => ({
        url: s.url,
        answer: (s.answer || "").slice(0, 6000),
        sources: (s.sources || []).slice(0, 8),
      })),
      reference_web_context,
    });

    return jr({
      ok: true,
      sites_processed: list.length,
      sites_used: usable.length,
      context_length: reference_web_context.length,
      preview: reference_web_context.slice(0, 600),
    });
  } catch (e: any) {
    return jr({ error: String(e?.message ?? e) }, 500);
  }
});