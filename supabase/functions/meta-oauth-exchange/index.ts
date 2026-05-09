import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH = "https://graph.facebook.com/v21.0";

/**
 * Exchange the OAuth code for a long-lived user token, then discover the
 * user's first Facebook Page and the Instagram Business account linked to it.
 * Stores everything in social_oauth_connections (provider='meta').
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userRes } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    const user = userRes?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { code, state } = await req.json();
    if (typeof code !== "string" || typeof state !== "string") return json({ error: "code and state required" }, 400);

    const clientId = Deno.env.get("META_CLIENT_ID");
    const clientSecret = Deno.env.get("META_CLIENT_SECRET");
    const redirectUri = Deno.env.get("META_REDIRECT_URI");
    if (!clientId || !clientSecret || !redirectUri) {
      return json({ error: "Meta integration not configured" }, 500);
    }

    // Validate state
    const { data: stateRow } = await admin.from("oauth_states").select("*").eq("state", state).maybeSingle();
    if (!stateRow) return json({ error: "Invalid state" }, 400);
    if (stateRow.user_id !== user.id) return json({ error: "State does not match user" }, 400);
    if (stateRow.provider !== "meta") return json({ error: "Wrong provider for this state" }, 400);
    if (new Date(stateRow.expires_at).getTime() < Date.now()) {
      await admin.from("oauth_states").delete().eq("state", state);
      return json({ error: "State expired" }, 400);
    }

    // 1. Code → short-lived user token
    const shortUrl = new URL(`${GRAPH}/oauth/access_token`);
    shortUrl.searchParams.set("client_id", clientId);
    shortUrl.searchParams.set("client_secret", clientSecret);
    shortUrl.searchParams.set("redirect_uri", redirectUri);
    shortUrl.searchParams.set("code", code);
    const shortRes = await fetch(shortUrl);
    if (!shortRes.ok) {
      return json({ error: `Meta short-lived token exchange failed: ${await shortRes.text()}` }, 500);
    }
    const shortTok = await shortRes.json();
    const shortToken: string = shortTok.access_token;

    // 2. Short-lived → long-lived (~60 days)
    const longUrl = new URL(`${GRAPH}/oauth/access_token`);
    longUrl.searchParams.set("grant_type", "fb_exchange_token");
    longUrl.searchParams.set("client_id", clientId);
    longUrl.searchParams.set("client_secret", clientSecret);
    longUrl.searchParams.set("fb_exchange_token", shortToken);
    const longRes = await fetch(longUrl);
    if (!longRes.ok) {
      return json({ error: `Meta long-lived swap failed: ${await longRes.text()}` }, 500);
    }
    const longTok = await longRes.json();
    const userToken: string = longTok.access_token;
    const expiresIn: number = Number(longTok.expires_in ?? 60 * 24 * 3600);

    // 3. Profile
    const meRes = await fetch(`${GRAPH}/me?fields=id,name,email&access_token=${encodeURIComponent(userToken)}`);
    const me = meRes.ok ? await meRes.json() : {};

    // 4. Pages (Facebook Pages the user admins). Each page comes with its
    //    own non-expiring page access_token (since manage_pages was granted).
    const pagesRes = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token,category,picture,instagram_business_account&access_token=${encodeURIComponent(userToken)}`);
    if (!pagesRes.ok) {
      return json({ error: `Could not list Pages: ${await pagesRes.text()}` }, 500);
    }
    const pagesJson = await pagesRes.json();
    const pages: any[] = pagesJson.data ?? [];
    if (!pages.length) {
      return json({ error: "No Facebook Pages found on this account. Create one at facebook.com/pages/create and try again." }, 400);
    }
    // Pick the first Page. (UI for multi-page picker can come later.)
    const primaryPage = pages[0];

    // 5. IG Business account linked to that Page (if any)
    let ig: any = null;
    if (primaryPage.instagram_business_account?.id) {
      const igRes = await fetch(`${GRAPH}/${primaryPage.instagram_business_account.id}?fields=username,name,profile_picture_url&access_token=${encodeURIComponent(primaryPage.access_token)}`);
      if (igRes.ok) ig = await igRes.json();
    }

    const profileUrn = `meta:user:${me?.id ?? "unknown"}`;
    const displayName: string = me?.name ?? primaryPage?.name ?? "Meta user";
    const email: string | null = me?.email ?? null;

    const { error: upErr } = await admin.from("social_oauth_connections").upsert({
      user_id: user.id,
      provider: "meta",
      provider_user_id: profileUrn,
      display_name: displayName,
      email,
      avatar_url: primaryPage?.picture?.data?.url ?? null,
      access_token: userToken,
      refresh_token: null,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      scope: "pages_manage_posts,instagram_content_publish",
      raw_profile: { user: me, primary_page: primaryPage, primary_ig: ig, all_pages: pages },
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,provider" });
    if (upErr) return json({ error: upErr.message }, 500);

    await admin.from("oauth_states").delete().eq("state", state);

    return json({
      ok: true, provider: "meta",
      provider_user_id: profileUrn,
      display_name: displayName,
      avatar_url: primaryPage?.picture?.data?.url ?? null,
      page_name: primaryPage?.name ?? null,
      ig_username: ig?.username ?? null,
      redirect_to: stateRow.redirect_to ?? null,
    });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(o: any, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
