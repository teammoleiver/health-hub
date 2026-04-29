import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "search";

    // ── Optimize prompt only ──
    if (action === "optimize") {
      const optimized = await optimizePrompt(body.query ?? "", body.outputType ?? "sourcedAnswer", body.depth ?? "auto");
      return json({ optimized });
    }

    // ── Run a search ──
    if (action !== "search") return json({ error: `Unknown action: ${action}` }, 400);

    const query: string = (body.query ?? "").toString().trim();
    if (!query) return json({ error: "Query is required" }, 400);

    // Pick provider
    let provider: any = null;
    if (body.provider_id) {
      const { data } = await supabase.from("social_search_providers").select("*").eq("id", body.provider_id).maybeSingle();
      provider = data;
    }
    if (!provider) {
      const { data } = await supabase.from("social_search_providers").select("*")
        .eq("user_id", user.id).eq("is_active", true).order("is_default", { ascending: false }).limit(1).maybeSingle();
      provider = data;
    }
    // Auto-create a default Linkup provider if none exists
    if (!provider) {
      const { data: created } = await supabase.from("social_search_providers").insert({
        user_id: user.id,
        name: "Linkup (default)",
        provider_kind: "linkup",
      }).select().single();
      provider = created;
    }
    if (!provider) return json({ error: "No search provider configured" }, 400);

    const apiKey = Deno.env.get(provider.api_key_secret_name || "LINKUP_API_KEY");
    if (!apiKey) return json({ error: `Missing secret ${provider.api_key_secret_name}. Add it in project settings.` }, 400);

    const outputType = body.outputType ?? provider.default_body?.outputType ?? "sourcedAnswer";
    const depth = body.depth ?? provider.default_body?.depth ?? "standard";
    const includeImages = body.includeImages ?? provider.default_body?.includeImages ?? false;

    // Build request
    const headers: Record<string, string> = {
      ...(provider.default_headers ?? { "Content-Type": "application/json" }),
      [provider.auth_header_name || "Authorization"]: `${provider.auth_header_prefix || "Bearer "}${apiKey}`,
    };

    let payload: Record<string, unknown>;
    if (provider.provider_kind === "linkup") {
      payload = {
        q: query,
        depth,
        outputType,
        includeImages: !!includeImages,
      };
      if (Array.isArray(body.includeDomains)) payload.includeDomains = body.includeDomains;
      if (Array.isArray(body.excludeDomains)) payload.excludeDomains = body.excludeDomains;
    } else {
      // custom_http: merge default body and put query into configured field
      payload = { ...(provider.default_body ?? {}) };
      payload[provider.query_field || "q"] = query;
      if (body.extra && typeof body.extra === "object") Object.assign(payload, body.extra);
    }

    const t0 = Date.now();
    const resp = await fetch(provider.endpoint_url, {
      method: provider.http_method || "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const duration_ms = Date.now() - t0;
    const text = await resp.text();
    let raw: any;
    try { raw = JSON.parse(text); } catch { raw = { _raw: text }; }

    if (!resp.ok) {
      await supabase.from("social_search_queries").insert({
        user_id: user.id, provider_id: provider.id, query,
        output_type: outputType, depth, status: "error",
        raw_response: raw, error: `HTTP ${resp.status}: ${text.slice(0, 500)}`,
        duration_ms,
      });
      return json({ error: `Search provider returned ${resp.status}`, details: raw }, 502);
    }

    // Normalize response
    const answer: string | null = raw?.answer ?? raw?.sourcedAnswer ?? raw?.output ?? null;
    const results = raw?.results ?? raw?.sources ?? raw?.data ?? null;

    const { data: saved } = await supabase.from("social_search_queries").insert({
      user_id: user.id, provider_id: provider.id, query,
      output_type: outputType, depth, status: "success",
      answer, results, raw_response: raw, duration_ms,
    }).select().single();

    return json({ ok: true, id: saved?.id, answer, results, raw, provider: { id: provider.id, name: provider.name, kind: provider.provider_kind } });
  } catch (e: any) {
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

async function optimizePrompt(query: string, outputType: string, depth: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || !query.trim()) return query;
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You rewrite vague user queries into a single, specific, search-engine-friendly query. Reply with ONLY the rewritten query, no quotes, no preamble. Keep it under 200 characters. Preserve the user's intent and named entities. Add precision (timeframe, region, type of source) when obviously useful." },
          { role: "user", content: `Output type: ${outputType}\nDepth: ${depth}\nUser query: ${query}` },
        ],
        temperature: 0.2,
      }),
    });
    const j = await r.json();
    const out = j?.choices?.[0]?.message?.content?.trim();
    return out || query;
  } catch {
    return query;
  }
}