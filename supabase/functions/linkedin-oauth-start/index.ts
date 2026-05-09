import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCOPES = "openid profile email w_member_social";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: userRes } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    const user = userRes?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const clientId = Deno.env.get("LINKEDIN_CLIENT_ID");
    const redirectUri = Deno.env.get("LINKEDIN_REDIRECT_URI");
    if (!clientId || !redirectUri) {
      return json({ error: "LinkedIn integration not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_REDIRECT_URI in edge function secrets." }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const redirectTo: string | null = body?.redirect_to ?? null;

    // Random state, persisted (so callback can validate)
    const state = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    await admin.from("oauth_states").insert({
      state, user_id: user.id, provider: "linkedin", redirect_to: redirectTo,
    });

    const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("scope", SCOPES);

    return json({ authorize_url: url.toString(), state });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(o: any, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
