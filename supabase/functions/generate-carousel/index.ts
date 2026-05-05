import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CANVA_API = "https://api.canva.com/rest/v1";
const TOKEN_REFRESH_SKEW_MS = 2 * 60 * 1000;
const TOKEN_REFRESH_LOCK_MS = 30 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { posts } = await req.json();
  if (!Array.isArray(posts) || posts.length !== 6) {
    return json({ error: "Need exactly 6 posts" }, 400);
  }

  const { data: row, error: insertError } = await supabase
    .from("carousels").insert({ user_id: user.id, posts, status: "pending" })
    .select().single();
  if (insertError) return json({ error: insertError.message }, 500);

  processCarousel(supabase, row.id, posts).catch(async (err) => {
    console.error("processCarousel failed:", err);
    await supabase.from("carousels")
      .update({ status: "failed", error_message: String(err?.message || err) })
      .eq("id", row.id);
  });

  return json({ id: row.id }, 200);
});

async function processCarousel(supabase: any, rowId: string, posts: string[]) {
  await update(supabase, rowId, { status: "writing_copy" });
  const copy = await generateCopy(posts);

  await update(supabase, rowId, { status: "creating_design", copy });
  const accessToken = await getCanvaAccessToken(supabase);
  const designId = await createCanvaDesign(accessToken, copy);

  await update(supabase, rowId, { status: "exporting", canva_design_id: designId });
  const designUrls = await getDesignUrls(accessToken, designId);
  const pngUrl = await exportDesign(accessToken, designId);

  await update(supabase, rowId, { status: "uploading" });
  const publicUrl = await uploadToStorage(supabase, rowId, pngUrl);

  await update(supabase, rowId, {
    status: "ready",
    image_url: publicUrl,
    canva_view_url: designUrls.view_url,
    canva_edit_url: designUrls.edit_url,
  });
}

async function generateCopy(posts: string[]) {
  const systemPrompt = `You are a viral content strategist for LinkedIn carousels. Given 6 LinkedIn posts, extract the strongest common theme and write copy for a 4-page carousel. Tone: professional but conversational and bold. No fluff, no jargon, no emojis, no hashtags. Active verbs, social-proof tone, slight urgency. Output ONLY valid JSON matching this exact schema with no extra keys:
{
  "title_of_the_post": "6-9 word bold headline",
  "heres_why": "one sentence why this matters, grounded in proof or transformation",
  "page_1_text": "page 1 body, one strong opening sentence",
  "page_2_title": "short title under 8 words",
  "page_2_body": "one sentence on the problem or pain",
  "page_3_title": "short title under 8 words",
  "page_3_body": "one sentence on the solution with specifics",
  "page_4_title": "short call to action title",
  "page_4_body": "conversational one sentence CTA"
}`;

  const userPrompt = JSON.stringify({
    post_1: posts[0], post_2: posts[1], post_3: posts[2],
    post_4: posts[3], post_5: posts[4], post_6: posts[5],
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function getCanvaAccessToken(supabase: any) {
  const cached = await readCachedAccessToken(supabase);
  if (cached) return cached;

  const lockOwner = crypto.randomUUID();
  const locked = await acquireRefreshLock(supabase, lockOwner);
  if (!locked) {
    const refreshed = await waitForCachedAccessToken(supabase);
    if (refreshed) return refreshed;
    throw new Error("Canva token refresh is already in progress. Please retry in a few seconds.");
  }

  try {
    const refreshedByOther = await readCachedAccessToken(supabase);
    if (refreshedByOther) return refreshedByOther;

    const { data: row, error } = await supabase
      .from("canva_oauth_tokens")
      .select("refresh_token_ciphertext,refresh_token_iv")
      .eq("id", "default")
      .maybeSingle();
    if (error) throw new Error(`Canva token cache read failed: ${error.message}`);

    const refreshToken = row?.refresh_token_ciphertext && row?.refresh_token_iv
      ? await decryptToken(row.refresh_token_ciphertext, row.refresh_token_iv)
      : Deno.env.get("CANVA_REFRESH_TOKEN");
    if (!refreshToken) throw new Error("Canva refresh token is not configured");

    return await refreshCanvaToken(supabase, refreshToken);
  } finally {
    await releaseRefreshLock(supabase, lockOwner);
  }
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
      await supabase.from("canva_oauth_tokens").delete().eq("id", "default");
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

async function readCachedAccessToken(supabase: any) {
  const { data: row, error } = await supabase
    .from("canva_oauth_tokens")
    .select("access_token_ciphertext,access_token_iv,expires_at")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw new Error(`Canva token cache read failed: ${error.message}`);
  if (!row?.access_token_ciphertext || !row?.access_token_iv || !row?.expires_at) return null;
  const expiresAt = new Date(row.expires_at).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt - TOKEN_REFRESH_SKEW_MS <= Date.now()) return null;
  return await decryptToken(row.access_token_ciphertext, row.access_token_iv);
}
async function waitForCachedAccessToken(supabase: any) {
  for (let i = 0; i < 8; i++) {
    await sleep(750);
    const token = await readCachedAccessToken(supabase);
    if (token) return token;
  }
  return null;
}
async function acquireRefreshLock(supabase: any, lockOwner: string) {
  const lockUntil = new Date(Date.now() + TOKEN_REFRESH_LOCK_MS).toISOString();
  const nowIso = new Date().toISOString();
  const { data: updated, error } = await supabase.from("canva_oauth_tokens")
    .update({ refresh_lock_owner: lockOwner, refresh_lock_until: lockUntil })
    .eq("id", "default")
    .or(`refresh_lock_until.is.null,refresh_lock_until.lt.${nowIso}`)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Canva token lock failed: ${error.message}`);
  if (updated?.id) return true;

  const refreshToken = Deno.env.get("CANVA_REFRESH_TOKEN");
  if (!refreshToken) return false;
  const encrypted = await encryptToken(refreshToken);
  const { error: insertError } = await supabase.from("canva_oauth_tokens").insert({
    id: "default",
    refresh_token_ciphertext: encrypted.ciphertext,
    refresh_token_iv: encrypted.iv,
    refresh_lock_owner: lockOwner,
    refresh_lock_until: lockUntil,
  });
  if (!insertError) return true;
  if (insertError.code === "23505") return false;
  throw new Error(`Canva token lock failed: ${insertError.message}`);
}
async function releaseRefreshLock(supabase: any, lockOwner: string) {
  await supabase.from("canva_oauth_tokens")
    .update({ refresh_lock_owner: null, refresh_lock_until: null })
    .eq("id", "default")
    .eq("refresh_lock_owner", lockOwner);
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

async function createCanvaDesign(accessToken: string, copy: any) {
  const templateId = Deno.env.get("CANVA_CAROUSEL_TEMPLATE_ID")!;
  const body = {
    brand_template_id: templateId,
    title: "Automated GTM Carousel",
    data: {
      title_of_the_post: { type: "text", text: copy.title_of_the_post },
      heres_why:         { type: "text", text: copy.heres_why },
      page_1_text:       { type: "text", text: copy.page_1_text },
      page_2_title:      { type: "text", text: copy.page_2_title },
      page_2_body:       { type: "text", text: copy.page_2_body },
      page_3_title:      { type: "text", text: copy.page_3_title },
      page_3_body:       { type: "text", text: copy.page_3_body },
      page_4_title:      { type: "text", text: copy.page_4_title },
      page_4_body:       { type: "text", text: copy.page_4_body },
    },
  };
  const res = await fetch(`${CANVA_API}/autofills`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Canva autofill create failed: ${await res.text()}`);
  const created = await res.json();
  const jobId = created.job.id;
  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    const poll = await fetch(`${CANVA_API}/autofills/${jobId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    const data = await poll.json();
    if (data.job.status === "success") return data.job.result.design.id;
    if (data.job.status === "failed") throw new Error("Canva autofill job failed");
  }
  throw new Error("Canva autofill timed out");
}

async function getDesignUrls(accessToken: string, designId: string) {
  const res = await fetch(`${CANVA_API}/designs/${designId}`, {
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Get design failed: ${await res.text()}`);
  const data = await res.json();
  return {
    view_url: data.design.urls.view_url,
    edit_url: data.design.urls.edit_url,
  };
}

async function exportDesign(accessToken: string, designId: string) {
  const res = await fetch(`${CANVA_API}/exports`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ design_id: designId, format: { type: "png", quality: "regular" } }),
  });
  if (!res.ok) throw new Error(`Canva export create failed: ${await res.text()}`);
  const created = await res.json();
  const jobId = created.job.id;
  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    const poll = await fetch(`${CANVA_API}/exports/${jobId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    const data = await poll.json();
    if (data.job.status === "success") return data.job.urls[0];
    if (data.job.status === "failed") throw new Error("Canva export job failed");
  }
  throw new Error("Canva export timed out");
}

async function uploadToStorage(supabase: any, rowId: string, pngUrl: string) {
  const imgRes = await fetch(pngUrl);
  if (!imgRes.ok) throw new Error("Failed to download Canva PNG");
  const buffer = await imgRes.arrayBuffer();
  const path = `${rowId}.png`;
  const { error } = await supabase.storage.from("carousel-exports")
    .upload(path, buffer, { contentType: "image/png", upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabase.storage.from("carousel-exports").getPublicUrl(path);
  return data.publicUrl;
}

async function update(supabase: any, rowId: string, patch: any) {
  await supabase.from("carousels").update(patch).eq("id", rowId);
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}