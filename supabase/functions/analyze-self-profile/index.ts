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
    const i = parts.indexOf("actors");
    if (i >= 0 && parts[i + 1] && parts[i + 1] !== "runs") return parts[i + 1];
    const j = parts.indexOf("store");
    if (j >= 0 && parts[j + 1] && parts[j + 2]) return `${parts[j + 1]}~${parts[j + 2]}`;
    if (parts.length >= 2 && url.hostname.includes("apify.com")) return `${parts[0]}~${parts[1]}`;
  } catch { /* raw id */ }
  return raw.replace(/^\/+/, "").replace(/\/+$/, "").replace("/", "~");
}

function pickFirstAccount(accounts: any[]) {
  return (accounts ?? []).find((a) => a.active && a.api_token) ?? null;
}

function firstString(...values: any[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fallbackToken = Deno.env.get("APIFY_API_TOKEN");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const { linkedin_url, profile_actor_id } = body as { linkedin_url?: string; profile_actor_id?: string };

    // Load writer settings to get stored values if not passed
    const { data: settings } = await admin.from("social_writer_settings").select("*").eq("user_id", user.id).maybeSingle();
    const url = (linkedin_url || settings?.linkedin_url || "").trim();
    const actorRaw = (profile_actor_id || settings?.profile_actor_id || "").trim();
    if (!url) return new Response(JSON.stringify({ error: "LinkedIn URL required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!actorRaw) return new Response(JSON.stringify({ error: "Profile actor ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const actorId = normalizeActorId(actorRaw);

    // Pick an Apify token
    const { data: accounts } = await admin.from("social_apify_accounts").select("*").eq("user_id", user.id);
    const account = pickFirstAccount(accounts ?? []);
    const token = account?.api_token || fallbackToken;
    if (!token) return new Response(JSON.stringify({ error: "No Apify token configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Run profile-info actor
    const actorInput: Record<string, any> = {
      url, urls: [url], profileUrls: [url], startUrls: [{ url }],
    };
    const apiUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${token}`;
    const apifyRes = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(actorInput) });
    if (!apifyRes.ok) {
      const txt = await apifyRes.text();
      return new Response(JSON.stringify({ error: `Apify ${apifyRes.status}: ${txt.slice(0, 400)}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const items: any[] = await apifyRes.json();
    const item = items?.[0] ?? {};
    const fullName = firstString(item.fullName, item.full_name, item.name, item.displayName);
    const headline = firstString(item.headline, item.title, item.subtitle);
    const about = firstString(item.about, item.summary, item.description, item.bio);
    const company = firstString(item.companyName, item.company, item.currentCompany?.name);
    const location = firstString(item.location, item.geoLocation, item.city);
    const followers = Number(item.followers ?? item.followersCount ?? item.connections ?? 0) || 0;
    const experiences = Array.isArray(item.experience) ? item.experience : Array.isArray(item.experiences) ? item.experiences : [];
    const skills = Array.isArray(item.skills) ? item.skills.map((s: any) => typeof s === "string" ? s : s?.name).filter(Boolean) : [];

    // Decide whether the actor returned anything usable. If not, fail loudly instead of inventing.
    const hasAnyData = Boolean(fullName || headline || about || company || (experiences?.length) || (skills?.length));
    if (!hasAnyData) {
      return new Response(JSON.stringify({
        error: "The Apify profile actor returned no usable data for this LinkedIn URL. Check the actor ID, token, and that the URL is a public profile.",
        raw_sample: items?.slice(0, 1) ?? [],
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // AI-summarize into structured persona fields — STRICTLY grounded in scraped data.
    let about_me = about ?? "";
    let career_summary = "";
    let expertise = skills.slice(0, 20).join(", ");
    let target_audience = "";
    if (lovableKey && hasAnyData) {
      try {
        const prompt = `You are rewriting a LinkedIn persona using ONLY the JSON below. Rules:
- Do NOT invent facts, companies, skills, audiences, or achievements.
- If a field cannot be supported by the JSON, return an empty string for it.
- Use first person ("I"). Keep wording concrete and specific to what is provided.
- Do not use generic filler like "versatile skill set", "passionate professional", "various roles", "exploring new opportunities".

Return JSON with keys: about_me (1-3 sentences, only from "about"/"headline"/role data), career_summary (one short paragraph built strictly from "experiences"; empty string if none), expertise (comma-separated; ONLY items from "skills" or clearly stated in "headline"/"about"; empty if none), target_audience (only if obviously implied by headline/about; otherwise empty).

Profile JSON:
${JSON.stringify({ fullName, headline, about, company, location, experiences, skills }).slice(0, 8000)}`;
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });
        if (aiRes.ok) {
          const j = await aiRes.json();
          const content = j?.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(content);
          if (typeof parsed.about_me === "string" && parsed.about_me.trim()) about_me = parsed.about_me.trim();
          if (typeof parsed.career_summary === "string") career_summary = parsed.career_summary.trim();
          if (typeof parsed.expertise === "string") expertise = parsed.expertise.trim();
          if (typeof parsed.target_audience === "string") target_audience = parsed.target_audience.trim();
        }
      } catch (_) { /* keep raw */ }
    }

    // Save to writer settings — only write fields we actually derived (don't wipe user edits with empty strings).
    const updates: Record<string, any> = {
      user_id: user.id,
      linkedin_url: url,
      profile_actor_id: actorRaw,
      last_self_analyzed_at: new Date().toISOString(),
    };
    if (about_me) updates.about_me = about_me;
    if (career_summary) updates.career_summary = career_summary;
    if (expertise) updates.expertise = expertise;
    if (target_audience) updates.target_audience = target_audience;

    if (settings) {
      await admin.from("social_writer_settings").update(updates).eq("user_id", user.id);
    } else {
      await admin.from("social_writer_settings").insert(updates);
    }

    // Upsert "self" profile in social_profiles so the existing scraper can grab posts
    const username = (() => { try { return new URL(url).pathname.split("/").filter(Boolean).pop() ?? ""; } catch { return ""; } })();
    const { data: existingSelf } = await admin.from("social_profiles").select("id").eq("user_id", user.id).eq("is_self", true).maybeSingle();
    let selfProfileId = existingSelf?.id ?? null;
    if (selfProfileId) {
      await admin.from("social_profiles").update({
        profile_url: url, username, display_name: fullName, company, location, title: headline,
        info_summary: about_me, followers, is_self: true, active: true,
      }).eq("id", selfProfileId);
    } else {
      const { data: created } = await admin.from("social_profiles").insert({
        user_id: user.id, profile_url: url, username, display_name: fullName,
        company, location, title: headline, info_summary: about_me, followers,
        is_self: true, active: true, scrape_cadence: "manual",
      }).select("id").single();
      selfProfileId = created?.id ?? null;
    }

    return new Response(JSON.stringify({
      ok: true, self_profile_id: selfProfileId,
      summary: { fullName, headline, about_me, career_summary, expertise, followers },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});