import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Fetch the transcript of a YouTube video using the user's configured Apify
 * actor for kind='youtube_video_transcript'. Saves the transcript on the
 * youtube_videos row and returns it.
 *
 * Body: { video_id: string }
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: ur } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    const user = ur?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const videoId = String(body?.video_id ?? "").trim();
    if (!videoId) return json({ error: "video_id required" }, 400);

    const { data: vid } = await admin.from("youtube_videos")
      .select("id, video_id, title, transcript")
      .eq("user_id", user.id).eq("video_id", videoId).maybeSingle();
    if (!vid) return json({ error: "Video not found" }, 404);

    if (vid.transcript && vid.transcript.length > 50 && body?.refresh !== true) {
      return json({ ok: true, transcript: vid.transcript, cached: true });
    }

    const actorId = await pickTranscriptActor(admin, user.id);
    if (!actorId) return json({ error: "No youtube_video_transcript actor configured. Add one in Social Hub → Settings → Apify actors." }, 400);
    const token = await pickApifyToken(admin, user.id);
    if (!token) return json({ error: "No Apify token available. Add one in Social Hub → Settings → Apify account pool." }, 400);

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const transcript = await runTranscriptActor(token, actorId, videoUrl);
    if (!transcript) return json({ error: "Actor returned no transcript. Check the actor's expected input format." }, 500);

    await admin.from("youtube_videos").update({
      transcript,
      transcript_fetched_at: new Date().toISOString(),
      transcript_source: "apify",
    }).eq("id", vid.id);

    return json({ ok: true, transcript, cached: false });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

async function pickTranscriptActor(admin: any, userId: string): Promise<string | null> {
  const { data } = await admin.from("apify_actors")
    .select("actor_id")
    .eq("user_id", userId).eq("kind", "youtube_video_transcript").eq("is_default", true)
    .maybeSingle();
  if (data?.actor_id) return data.actor_id as string;
  return Deno.env.get("APIFY_YT_TRANSCRIPT_ACTOR") ?? null;
}

async function pickApifyToken(admin: any, userId: string): Promise<string> {
  const { data } = await admin.from("social_apify_accounts")
    .select("api_token, monthly_budget_usd, posts_used_this_period, cost_per_10_posts_usd, active")
    .eq("user_id", userId).eq("active", true);
  if (Array.isArray(data) && data.length > 0) {
    const ranked = data
      .map((a: any) => {
        const cost = (Number(a.posts_used_this_period ?? 0) / 10) * Number(a.cost_per_10_posts_usd ?? 0.5);
        return { token: a.api_token as string, remaining: Number(a.monthly_budget_usd ?? 5) - cost };
      })
      .filter((x) => x.token && x.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining);
    if (ranked[0]?.token) return ranked[0].token;
  }
  return Deno.env.get("APIFY_API_TOKEN") ?? "";
}

async function runTranscriptActor(token: string, actorId: string, videoUrl: string): Promise<string | null> {
  // Send several common field names so the actor's expected schema is covered.
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;
  const body: Record<string, any> = {
    videoUrls: [videoUrl],
    startUrls: [{ url: videoUrl }],
    videoUrl,
    url: videoUrl,
    urls: [videoUrl],
    language: "en",
    languages: ["en"],
    subtitlesLanguage: "en",
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Apify ${res.status}: ${await res.text()}`);
  const items = await res.json();
  if (!Array.isArray(items) || items.length === 0) return null;
  return extractTranscriptFromItems(items);
}

function extractTranscriptFromItems(items: any[]): string | null {
  // Try direct text fields on the first item
  for (const it of items) {
    const direct = it?.transcript ?? it?.text ?? it?.fullText ?? it?.captions ?? it?.subtitles_text;
    if (typeof direct === "string" && direct.trim().length > 0) return direct.trim();
  }
  // Try array-of-segments shape: subtitles[], transcript[], segments[], items[]
  const collectFromSegments = (arr: any[]): string => {
    return arr
      .map((s: any) => {
        if (typeof s === "string") return s;
        return s?.text ?? s?.snippet ?? s?.line ?? "";
      })
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  };
  for (const it of items) {
    for (const key of ["subtitles", "transcript", "segments", "captions", "lines"]) {
      const v = it?.[key];
      if (Array.isArray(v) && v.length > 0) {
        const joined = collectFromSegments(v);
        if (joined.length > 0) return joined;
      }
    }
  }
  // Last resort: if items themselves are segment objects, join across them
  if (items.every((x) => typeof x?.text === "string" || typeof x === "string")) {
    const joined = collectFromSegments(items);
    if (joined.length > 0) return joined;
  }
  return null;
}

function json(o: any, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
