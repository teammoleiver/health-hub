// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { account_id } = await req.json();
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: acc, error } = await admin.from("social_apify_accounts").select("*").eq("id", account_id).eq("user_id", user.id).single();
    if (error || !acc) throw new Error("Account not found");

    const res = await fetch(`https://api.apify.com/v2/users/me?token=${acc.api_token}`);
    const ok = res.ok;
    const payload = ok ? await res.json() : await res.text();
    const status = ok ? "ok" : `error ${res.status}`;

    await admin.from("social_apify_accounts").update({
      last_test_status: status, last_test_at: new Date().toISOString(),
    }).eq("id", account_id);

    return new Response(JSON.stringify({ ok, status, info: ok ? { username: payload?.data?.username, plan: payload?.data?.plan } : payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
