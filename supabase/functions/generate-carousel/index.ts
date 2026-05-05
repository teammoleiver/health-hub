import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CANVA_API = "https://api.canva.com/rest/v1";

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
  const accessToken = await refreshCanvaToken();
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

async function refreshCanvaToken() {
  const clientId = Deno.env.get("CANVA_CLIENT_ID")!;
  const clientSecret = Deno.env.get("CANVA_CLIENT_SECRET")!;
  const refreshToken = Deno.env.get("CANVA_REFRESH_TOKEN")!;
  const basic = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${CANVA_API}/oauth/token`, {
    method: "POST",
    headers: { "Authorization": `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`Canva token refresh failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

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