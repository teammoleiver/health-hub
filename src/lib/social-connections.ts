import { supabase } from "@/integrations/supabase/client";

export type SocialProvider = "linkedin" | "facebook" | "instagram" | "twitter";

export type SocialConnectionMeta = {
  provider: SocialProvider;
  provider_user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  expires_at: string | null;
  scope: string | null;
  created_at: string;
  updated_at: string;
};

/** Loads the current user's social connections (metadata only — never tokens). */
export async function listMyConnections(): Promise<SocialConnectionMeta[]> {
  const { data, error } = await supabase.rpc("get_my_social_connections" as any);
  if (error) throw error;
  return ((data as any[]) ?? []) as SocialConnectionMeta[];
}

export async function getMyLinkedInConnection(): Promise<SocialConnectionMeta | null> {
  const all = await listMyConnections();
  return all.find((c) => c.provider === "linkedin") ?? null;
}

/**
 * Direct fetch wrapper around an edge function so we can surface the actual
 * error body when the function returns 4xx/5xx (Supabase's `functions.invoke`
 * collapses these to "Edge Function returned a non-2xx status code").
 */
async function callEdge<T>(fn: string, body: any): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const url = `${import.meta.env.VITE_SUPABASE_URL ?? "https://vpsaonpsidmuzufhlbis.supabase.co"}/functions/v1/${fn}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* keep null */ }
  if (!res.ok) {
    const msg = parsed?.error || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  if (parsed?.error) throw new Error(parsed.error);
  return (parsed as T) ?? ({} as T);
}

export async function startLinkedInAuth(redirectTo?: string): Promise<{ authorize_url: string; state: string }> {
  return callEdge("linkedin-oauth-start", { redirect_to: redirectTo ?? null });
}

export async function exchangeLinkedInCode(code: string, state: string) {
  return callEdge<{ ok: true; provider: "linkedin"; provider_user_id: string; display_name: string | null; avatar_url: string | null; redirect_to: string | null }>(
    "linkedin-oauth-exchange",
    { code, state },
  );
}

export async function disconnectLinkedIn(): Promise<void> {
  await callEdge<{ ok: true }>("linkedin-disconnect", {});
}

export async function postToLinkedIn(args: { plan_id?: string; text?: string; image_url?: string }) {
  return callEdge<{ ok: true; post_urn: string | null; status: number }>("post-to-linkedin", args);
}
