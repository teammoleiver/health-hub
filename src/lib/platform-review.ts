import { supabase } from "@/integrations/supabase/client";
import type { LinkedInPost, PostState } from "./linkedin-review";

/**
 * Unified review module for non-LinkedIn platforms (Facebook, Instagram, Twitter/X).
 * LinkedIn keeps its own (read-only) seed-JSON-backed module in linkedin-review.ts.
 */

export type Platform = "facebook" | "instagram" | "twitter";

export type PlatformPost = LinkedInPost & {
  platform: Platform;
  source_kind: "manual" | "duplicate" | "ai";
  source_post_id: string | null;
  created_at: string;
  updated_at: string;
};

export type { PostStatus, PostState } from "./linkedin-review";

const POSTS = "social_review_posts" as any;
const STATES = "social_review_post_states" as any;

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function listPlatformPosts(platform: Platform): Promise<PlatformPost[]> {
  const u = await uid();
  const { data, error } = await supabase
    .from(POSTS)
    .select("*")
    .eq("user_id", u)
    .eq("platform", platform)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data as any) ?? [];
}

export async function listPlatformStates(platform: Platform): Promise<Record<string, PostState>> {
  const u = await uid();
  const { data, error } = await supabase
    .from(STATES)
    .select("post_id,status,edited_body,notes,updated_at")
    .eq("user_id", u)
    .eq("platform", platform);
  if (error) throw error;
  const map: Record<string, PostState> = {};
  (data ?? []).forEach((r: any) => { map[r.post_id] = r as PostState; });
  return map;
}

export async function upsertPlatformState(
  platform: Platform,
  post_id: string,
  patch: Partial<Pick<PostState, "status" | "edited_body" | "notes">>,
): Promise<PostState> {
  const u = await uid();
  const row: any = {
    user_id: u, post_id, platform,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from(STATES)
    .upsert(row, { onConflict: "user_id,post_id" })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PostState;
}

export async function clearAllPlatformStates(platform: Platform): Promise<void> {
  const u = await uid();
  await supabase.from(STATES).delete().eq("user_id", u).eq("platform", platform);
}

export async function createPlatformPost(input: {
  platform: Platform;
  topic: string;
  body: string;
  date?: string;
  month?: string;
  post_type?: string;
  pillar?: string;
  source_kind?: "manual" | "duplicate" | "ai";
  source_post_id?: string | null;
}): Promise<PlatformPost> {
  const u = await uid();
  const { data, error } = await supabase
    .from(POSTS)
    .insert({
      user_id: u,
      platform: input.platform,
      source_kind: input.source_kind ?? "manual",
      source_post_id: input.source_post_id ?? null,
      topic: input.topic,
      body: input.body,
      date: input.date ?? "",
      month: input.month ?? "",
      post_type: input.post_type ?? "PT-01",
      pillar: input.pillar ?? "P1",
    } as any)
    .select()
    .single();
  if (error) throw error;
  return data as any;
}

export async function updatePlatformPost(
  id: string,
  patch: Partial<Pick<PlatformPost, "topic" | "body" | "date" | "month" | "post_type" | "pillar">>,
): Promise<void> {
  const { error } = await supabase.from(POSTS).update(patch as any).eq("id", id);
  if (error) throw error;
}

export async function deletePlatformPost(id: string): Promise<void> {
  await supabase.from(STATES).delete().eq("post_id", id);
  await supabase.from(POSTS).delete().eq("id", id);
}

/** Duplicate a LinkedIn-review post into the chosen platform's review (independent edits). */
export async function duplicateFromLinkedIn(
  platform: Platform,
  post: LinkedInPost,
  edited_body?: string | null,
): Promise<PlatformPost> {
  return createPlatformPost({
    platform,
    topic: post.topic,
    body: edited_body ?? post.body,
    date: post.date,
    month: post.month,
    post_type: post.post_type,
    pillar: post.pillar,
    source_kind: "duplicate",
    source_post_id: post.id,
  });
}

export async function findPlatformDuplicateOf(
  platform: Platform,
  linkedinPostId: string,
): Promise<PlatformPost | null> {
  const u = await uid();
  const { data } = await supabase
    .from(POSTS)
    .select("*")
    .eq("user_id", u)
    .eq("platform", platform)
    .eq("source_post_id", linkedinPostId)
    .maybeSingle();
  return (data as any) ?? null;
}

const PLATFORM_TONE: Record<Platform, string> = {
  facebook: "Conversational, slightly less formal than LinkedIn. Line breaks and the occasional emoji are fine. End with a question or invitation when natural.",
  instagram: "Visual-first feed caption. Short hook on line 1, breathable line breaks, 3–8 relevant hashtags at the end. Personal voice.",
  twitter: "Sharp and tight. Single idea per tweet. Punchy hook, no filler, no hashtags unless essential. If a thread is needed, structure as numbered tweets separated by --.",
};

/** Generate a platform-tuned post via the existing rewrite-linkedin-post edge function. */
export async function generatePlatformPost(payload: {
  platform: Platform;
  topic?: string;
  reference_body?: string;
  customText: string;
}): Promise<{ rewrite?: string; error?: string }> {
  const seed = payload.reference_body ?? `Topic: ${payload.topic ?? ""}`;
  const tone = PLATFORM_TONE[payload.platform];
  const { data, error } = await supabase.functions.invoke("rewrite-linkedin-post", {
    body: {
      mode: "custom",
      postBody: seed,
      customText: `Write a ${payload.platform === "twitter" ? "Twitter / X" : payload.platform} post. ${tone} ${payload.customText}`,
    },
  });
  if (error) return { error: error.message };
  return data as any;
}

/* ─── Platform display config ─── */
export const PLATFORM_CONFIG: Record<Platform, {
  label: string;
  tabLabel: string;
  // Tailwind-class flavored colors for chips/borders/text in the editor
  hex: string;          // brand hex
  hexText: string;      // foreground text on chip
  ring: string;         // focus ring tailwind class fragment, e.g. "blue-500"
  // Conversational tone for the editor's quick-fill chips
  quickFills: string[];
}> = {
  facebook: {
    label: "Facebook",
    tabLabel: "Facebook Review",
    hex: "#90D5FF",
    hexText: "#0a2540",
    ring: "sky-300",
    quickFills: [
      "Make it more conversational ", "Add an emoji ", "End with a question ",
      "Make the hook stronger ", "Cut the last 3 lines ", "Soften the tone ",
    ],
  },
  instagram: {
    label: "Instagram",
    tabLabel: "Instagram Review",
    hex: "#d62976",
    hexText: "#ffffff",
    ring: "pink-500",
    quickFills: [
      "Add 5 niche hashtags ", "More personal tone ", "Shorter, punchier hook ",
      "Add a CTA to save the post ", "Break into 3 short paragraphs ",
    ],
  },
  twitter: {
    label: "Twitter / X",
    tabLabel: "Twitter X Review",
    hex: "#000000",
    hexText: "#ffffff",
    ring: "zinc-700",
    quickFills: [
      "Cut to under 280 chars ", "Make it a numbered thread ", "Sharper hook ",
      "Remove all hashtags ", "Add one concrete number ",
    ],
  },
};
