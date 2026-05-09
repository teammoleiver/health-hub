import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Permissions we need to:
//  - identify the user
//  - list their Pages and post to them
//  - read their Instagram Business account linked to a Page and publish content
const SCOPES = [
  "public_profile",
  "email",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "business_management",
  "instagram_basic",
  "instagram_content_publish",
].join(",");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userRes } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    const user = userRes?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const clientId = Deno.env.get("META_CLIENT_ID");
    const redirectUri = Deno.env.get("META_REDIRECT_URI");
    if (!clientId || !redirectUri) {
      return json({ error: "Meta integration not configured. Set META_CLIENT_ID and META_REDIRECT_URI in edge function secrets." }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const redirectTo: string | null = body?.redirect_to ?? null;

    const state = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    await admin.from("oauth_states").insert({
      state, user_id: user.id, provider: "meta", redirect_to: redirectTo,
    });

    const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");

    // Facebook Login for Business: when a config_id is set, the configuration
    // defines what permissions get requested. The classic `scope` parameter is
    // ignored. If no config_id, fall back to classic FB Login with `scope`.
    const configId = Deno.env.get("META_CONFIG_ID");
    if (configId) {
      url.searchParams.set("config_id", configId);
    } else {
      url.searchParams.set("scope", SCOPES);
      url.searchParams.set("auth_type", "rerequest");
    }

    return json({ authorize_url: url.toString(), state });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(o: any, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
