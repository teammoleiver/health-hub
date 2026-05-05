import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "missing auth" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: userRes } = await admin.auth.getUser(jwt);
    const user = userRes?.user;
    if (!user) return json({ error: "invalid auth" }, 401);

    const body = await req.json().catch(() => ({}));
    const { hook = "", post_body = "", entry_id = null, size = "1024x1024" } =
      body ?? {};
    if (!hook && !post_body) return json({ error: "hook or body required" }, 400);

    const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_KEY) return json({ error: "OPENAI_API_KEY not configured" }, 500);

    // Pull style prompt from writer settings
    const { data: settings } = await admin
      .from("social_writer_settings")
      .select("image_style_prompt, about_me, expertise, target_audience")
      .eq("user_id", user.id)
      .maybeSingle();

    const style = (settings?.image_style_prompt ?? "").trim() ||
      "Clean, modern, minimalist editorial illustration. Soft lighting, professional, social-media friendly composition.";

    const prompt = [
      `Create a social-media image for a LinkedIn post.`,
      `Headline: "${hook}"`,
      post_body ? `Context: ${String(post_body).slice(0, 500)}` : "",
      ``,
      `STYLE GUIDE (must follow):`,
      style,
      ``,
      `Constraints: no embedded text, no watermarks, no logos. Square composition.`,
    ].filter(Boolean).join("\n");

    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size,
        n: 1,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("openai image error", r.status, t);
      return json({ error: `OpenAI ${r.status}: ${t.slice(0, 300)}` }, 500);
    }

    const out = await r.json();
    const b64 = out?.data?.[0]?.b64_json;
    const url = out?.data?.[0]?.url;
    if (!b64 && !url) return json({ error: "no image returned" }, 500);

    let imageUrl: string;
    if (b64) {
      // Upload to storage so it persists and is small to store
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const path = `${user.id}/post-images/${Date.now()}.png`;
      // Try existing health-records bucket; otherwise fall back to data URL
      const { error: upErr } = await admin.storage
        .from("health-records")
        .upload(path, bytes, { contentType: "image/png", upsert: false });
      if (!upErr) {
        const { data: signed } = await admin.storage
          .from("health-records")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        imageUrl = signed?.signedUrl ?? `data:image/png;base64,${b64}`;
      } else {
        console.warn("storage upload failed, returning data url", upErr.message);
        imageUrl = `data:image/png;base64,${b64}`;
      }
    } else {
      imageUrl = url;
    }

    if (entry_id) {
      await admin
        .from("social_content_plan")
        .update({ image_url: imageUrl })
        .eq("id", entry_id)
        .eq("user_id", user.id);
    }

    return json({ image_url: imageUrl, prompt_used: prompt });
  } catch (e) {
    console.error("generate-post-image fatal", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}