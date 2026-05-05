import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CANVA_API = "https://api.canva.com/rest/v1";
const TOKEN_REFRESH_SKEW_MS = 2 * 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { hook, body, entry_id } = await req.json();
    if (!hook || typeof hook !== "string") return json({ error: "hook is required" }, 400);

    const templateId = Deno.env.get("CANVA_POST_TEMPLATE_ID");
    if (!templateId) return json({ error: "CANVA_POST_TEMPLATE_ID not configured" }, 500);

    const accessToken = await getCanvaAccessToken(supabase);

    // Autofill
    const autoRes = await fetch(`${CANVA_API}/autofills`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_template_id: templateId,
        title: hook.slice(0, 80),
        data: {
          hook: { type: "text", text: hook },
          body: { type: "text", text: (body || "").slice(0, 600) },
        },
      }),
    });
    if (!autoRes.ok) return json({ error: `Canva autofill failed: ${await autoRes.text()}` }, 500);
    const autoJob = await autoRes.json();
    const jobId = autoJob.job.id;

    let designId: string | null = null;
    for (let i = 0; i < 20; i++) {
      await sleep(2500);
      const poll = await fetch(`${CANVA_API}/autofills/${jobId}`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      const d = await poll.json();
      if (d.job.status === "success") { designId = d.job.result.design.id; break; }
      if (d.job.status === "failed") return json({ error: "Canva autofill failed" }, 500);
    }
    if (!designId) return json({ error: "Canva autofill timed out" }, 504);

    // Get URLs
    const dRes = await fetch(`${CANVA_API}/designs/${designId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    const dData = await dRes.json();
    const view_url = dData.design.urls.view_url;
    const edit_url = dData.design.urls.edit_url;

    // Export PNG
    const exRes = await fetch(`${CANVA_API}/exports`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ design_id: designId, format: { type: "png", quality: "regular" } }),
    });
    const exJob = await exRes.json();
    let pngUrl: string | null = null;
    for (let i = 0; i < 20; i++) {
      await sleep(2500);
      const poll = await fetch(`${CANVA_API}/exports/${exJob.job.id}`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      const d = await poll.json();
      if (d.job.status === "success") { pngUrl = d.job.urls[0]; break; }
      if (d.job.status === "failed") break;
    }

    let image_url = pngUrl;
    if (pngUrl && entry_id) {
      try {
        const imgRes = await fetch(pngUrl);
        const buf = await imgRes.arrayBuffer();
        const path = `${user.id}/${entry_id}-canva-${Date.now()}.png`;
        const { error: upErr } = await supabase.storage.from("health-records")
          .upload(path, buf, { contentType: "image/png", upsert: true });
        if (!upErr) {
          const { data: signed } = await supabase.storage.from("health-records")
            .createSignedUrl(path, 60 * 60 * 24 * 365);
          if (signed?.signedUrl) image_url = signed.signedUrl;
        }
      } catch (e) { console.error("upload failed", e); }

      await supabase.from("social_content_plan")
        .update({ image_url, image_status: "ready" })
        .eq("id", entry_id).eq("user_id", user.id);
    }

    return json({ design_id: designId, view_url, edit_url, image_url });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

async function getCanvaAccessToken(supabase: any) {
  const { data: row, error } = await supabase
    .from("canva_oauth_tokens")
    .select("access_token_ciphertext,access_token_iv,refresh_token_ciphertext,refresh_token_iv,expires_at")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw new Error(`Canva token cache read failed: ${error.message}`);

  const now = Date.now();
  if (row?.access_token_ciphertext && row?.access_token_iv && row?.expires_at) {
    const expiresAt = new Date(row.expires_at).getTime();
    if (Number.isFinite(expiresAt) && expiresAt - TOKEN_REFRESH_SKEW_MS > now) {
      return decryptToken(row.access_token_ciphertext, row.access_token_iv);
    }
  }

  const refreshToken = row?.refresh_token_ciphertext && row?.refresh_token_iv
    ? await decryptToken(row.refresh_token_ciphertext, row.refresh_token_iv)
    : Deno.env.get("CANVA_REFRESH_TOKEN");
  if (!refreshToken) throw new Error("Canva refresh token is not configured");

  return await refreshCanvaToken(supabase, refreshToken);
}

async function refreshCanvaToken(supabase: any, refreshToken: string) {
  const clientId = Deno.env.get("CANVA_CLIENT_ID")!;
  const clientSecret = Deno.env.get("CANVA_CLIENT_SECRET")!;
  const basic = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${CANVA_API}/oauth/token`, {
    method: "POST",
    headers: { "Authorization": `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) {
    const message = await res.text();
    if (message.includes("invalid_grant")) {
      throw new Error("Canva authorization expired or was revoked. Reconnect Canva to generate a new refresh token.");
    }
    throw new Error(`Canva token refresh failed: ${message}`);
  }
  const data = await res.json();
  const access = await encryptToken(data.access_token);
  const refresh = await encryptToken(data.refresh_token ?? refreshToken);
  const expiresAt = new Date(Date.now() + Math.max(1, Number(data.expires_in ?? 3600) - 60) * 1000).toISOString();
  const { error } = await supabase.from("canva_oauth_tokens").upsert({
    id: "default",
    access_token_ciphertext: access.ciphertext,
    access_token_iv: access.iv,
    refresh_token_ciphertext: refresh.ciphertext,
    refresh_token_iv: refresh.iv,
    expires_at: expiresAt,
    refreshed_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) throw new Error(`Canva token cache update failed: ${error.message}`);
  return data.access_token;
}
async function getCryptoKey() {
  const secret = Deno.env.get("CANVA_CLIENT_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) throw new Error("Canva token encryption key is not configured");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function encryptToken(token: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getCryptoKey();
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token));
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}
async function decryptToken(ciphertext: string, iv: string) {
  const key = await getCryptoKey();
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, key, base64ToBytes(ciphertext));
  return new TextDecoder().decode(decrypted);
}
function bytesToBase64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
function base64ToBytes(value: string) { return Uint8Array.from(atob(value), (c) => c.charCodeAt(0)); }
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}