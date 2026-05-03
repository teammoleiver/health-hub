import { supabase } from "@/integrations/supabase/client";

async function uid(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Profiles ──
export async function listSocialProfiles() {
  const u = await uid(); if (!u) return [];
  const { data } = await supabase.from("social_profiles" as any).select("*").eq("user_id", u).order("created_at", { ascending: false });
  return (data as any[]) ?? [];
}
export async function createSocialProfile(p: {
  profile_url: string; username?: string; display_name?: string; company?: string;
  location?: string; title?: string; info_summary?: string; followers?: number;
  scrape_cadence?: string; apify_actor_id?: string; tags?: string[];
}) {
  const u = await uid(); if (!u) return null;
  const username = p.username || (() => {
    try { const url = new URL(p.profile_url); return url.pathname.split("/").filter(Boolean).pop() ?? ""; } catch { return ""; }
  })();
  const { data, error } = await supabase.from("social_profiles" as any).insert({ ...p, username, user_id: u } as any).select().single();
  if (error) throw error;
  return data;
}
export async function updateSocialProfile(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from("social_profiles" as any).update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteSocialProfile(id: string) {
  const { error } = await supabase.from("social_profiles" as any).delete().eq("id", id);
  if (error) throw error;
}

// ── Posts ──
export async function listSocialPosts(filters?: { profile_id?: string; limit?: number }) {
  const u = await uid(); if (!u) return [];
  let q = supabase.from("social_posts" as any).select("*").eq("user_id", u).order("posted_at", { ascending: false }).limit(filters?.limit ?? 500);
  if (filters?.profile_id) q = q.eq("profile_id", filters.profile_id);
  const { data } = await q;
  return (data as any[]) ?? [];
}
export async function deleteSocialPost(id: string) {
  await supabase.from("social_posts" as any).delete().eq("id", id);
}
export async function createManualSocialPost(p: { profile_id?: string; author?: string; company?: string; post_text: string; post_url?: string; posted_at?: string; }) {
  const u = await uid(); if (!u) return null;
  const { data, error } = await supabase.from("social_posts" as any).insert({ ...p, user_id: u } as any).select().single();
  if (error) throw error;
  return data;
}

// ── Hot topics ──
export async function listHotTopics() {
  const u = await uid(); if (!u) return [];
  const { data } = await supabase.from("social_hot_topics" as any).select("*").eq("user_id", u).order("score", { ascending: false });
  return (data as any[]) ?? [];
}
export async function deleteHotTopic(id: string) {
  await supabase.from("social_hot_topics" as any).delete().eq("id", id);
}

// ── Drafts ──
export async function listDraftsForPost(postId: string) {
  const u = await uid(); if (!u) return [];
  const { data } = await supabase.from("social_generated_drafts" as any).select("*").eq("user_id", u).eq("source_post_id", postId).order("created_at", { ascending: false });
  return (data as any[]) ?? [];
}
export async function deleteDraft(id: string) {
  await supabase.from("social_generated_drafts" as any).delete().eq("id", id);
}

// ── Content plan ──
export async function listContentPlan() {
  const u = await uid(); if (!u) return [];
  const { data } = await supabase.from("social_content_plan" as any).select("*").eq("user_id", u).order("position", { ascending: true });
  return (data as any[]) ?? [];
}
export async function createPlanEntry(e: { hook: string; body?: string; format?: string; pillar?: string; framework?: string; status?: string; scheduled_date?: string; source_post_id?: string; source_topic_id?: string; }) {
  const u = await uid(); if (!u) return null;
  const { data, error } = await supabase.from("social_content_plan" as any).insert({ ...e, user_id: u } as any).select().single();
  if (error) throw error;
  return data;
}
export async function updatePlanEntry(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from("social_content_plan" as any).update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deletePlanEntry(id: string) {
  await supabase.from("social_content_plan" as any).delete().eq("id", id);
}

// ── Writer settings ──
export async function getWriterSettings() {
  const u = await uid(); if (!u) return null;
  const { data } = await supabase.from("social_writer_settings" as any).select("*").eq("user_id", u).maybeSingle();
  return data;
}
export async function upsertWriterSettings(s: Record<string, any>) {
  const u = await uid(); if (!u) return null;
  const existing = await getWriterSettings();
  if (existing) {
    const { data, error } = await supabase.from("social_writer_settings" as any).update(s).eq("user_id", u).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from("social_writer_settings" as any).insert({ ...s, user_id: u } as any).select().single();
  if (error) throw error;
  return data;
}

// ── Edge function calls ──
export async function scrapeProfile(profile_id: string) {
  return supabase.functions.invoke("scrape-linkedin-profile", { body: { profile_id } });
}
export async function rotateNowScrape(profile_id: string) {
  return supabase.functions.invoke("scrape-linkedin-profile", { body: { profile_id, force_rotate: true } });
}
export async function retryWithAccount(profile_id: string, account_id: string) {
  return supabase.functions.invoke("scrape-linkedin-profile", { body: { profile_id, account_id } });
}
export async function scrapeAllActive() {
  return supabase.functions.invoke("scrape-linkedin-profile", { body: { all_active: true } });
}
export async function clusterHotTopics() {
  return supabase.functions.invoke("cluster-hot-topics", { body: {} });
}
export async function generatePost(args: { framework: string; source_post_id?: string; source_topic_id?: string; idea?: string; significance?: string; data?: string; description?: string; implications?: string; }) {
  return supabase.functions.invoke("generate-social-post", { body: { ...args, mode: "generate" } });
}
export async function suggestFrameworks(args: { source_post_id?: string; source_topic_id?: string; idea?: string; }) {
  return supabase.functions.invoke("generate-social-post", { body: { ...args, mode: "suggest" } });
}

// ── Apify accounts (rotating fallback pool) ──
export async function listApifyAccounts() {
  const u = await uid(); if (!u) return [];
  const { data } = await supabase.from("social_apify_accounts" as any).select("*").eq("user_id", u).order("created_at", { ascending: true });
  return (data as any[]) ?? [];
}
export async function createApifyAccount(p: { label: string; api_token: string; actor_id?: string; monthly_budget_usd?: number }) {
  const u = await uid(); if (!u) return null;
  const { data, error } = await supabase.from("social_apify_accounts" as any).insert({
    user_id: u, label: p.label, api_token: p.api_token, actor_id: p.actor_id ?? null,
    monthly_budget_usd: p.monthly_budget_usd ?? 5,
    period_start: new Date().toISOString().slice(0, 10),
  } as any).select().single();
  if (error) throw error;
  return data;
}
export async function updateApifyAccount(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from("social_apify_accounts" as any).update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteApifyAccount(id: string) {
  await supabase.from("social_apify_accounts" as any).delete().eq("id", id);
}
export async function testApifyAccount(id: string, mode: "health" | "run" = "run") {
  return supabase.functions.invoke("test-apify-account", { body: { account_id: id, mode } });
}

// ── Scrape run history ──
export async function listScrapeRuns(filters?: { account_id?: string; profile_id?: string; limit?: number }) {
  const u = await uid(); if (!u) return [];
  let q = supabase.from("social_scrape_runs" as any).select("*").eq("user_id", u).order("ran_at", { ascending: false }).limit(filters?.limit ?? 50);
  if (filters?.account_id) q = q.eq("apify_account_id", filters.account_id);
  if (filters?.profile_id) q = q.eq("profile_id", filters.profile_id);
  const { data } = await q;
  return (data as any[]) ?? [];
}
export async function getScrapeRun(id: string) {
  const { data } = await supabase.from("social_scrape_runs" as any).select("*").eq("id", id).maybeSingle();
  return data;
}

// ── Per-profile scraped post history (all-time) ──
export async function listPostsForProfile(profile_id: string, limit = 200) {
  const u = await uid(); if (!u) return [];
  const { data } = await supabase.from("social_posts" as any).select("*")
    .eq("user_id", u).eq("profile_id", profile_id)
    .order("posted_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data as any[]) ?? [];
}

// ── Editable framework prompts ──
export async function listFrameworkPrompts() {
  const { data, error } = await supabase.functions.invoke("framework-prompts", { body: { action: "list" } });
  if (error) throw error;
  return (data as any)?.frameworks ?? [];
}
export async function saveFrameworkPrompt(framework_id: string, prompt: string) {
  return supabase.functions.invoke("framework-prompts", { body: { action: "save", framework_id, prompt } });
}
export async function suggestFrameworkPromptImprovement(framework_id: string) {
  return supabase.functions.invoke("framework-prompts", { body: { action: "suggest", framework_id } });
}

// ── Self LinkedIn analysis ──
export async function analyzeSelfProfile(linkedin_url?: string, profile_actor_id?: string) {
  return supabase.functions.invoke("analyze-self-profile", { body: { linkedin_url, profile_actor_id } });
}
export async function getSelfProfileId(): Promise<string | null> {
  const u = await uid(); if (!u) return null;
  const { data } = await supabase.from("social_profiles" as any).select("id")
    .eq("user_id", u).eq("is_self", true).maybeSingle();
  return (data as any)?.id ?? null;
}
export async function scrapeMyLastPosts(limit = 50) {
  const id = await getSelfProfileId();
  if (!id) throw new Error("Run 'Analyze my LinkedIn' first to create your self profile.");
  const res = await supabase.functions.invoke("scrape-linkedin-profile", { body: { profile_id: id, limit, force_rotate: true } });
  // After posts land, refine voice strictly from real posts (no hallucination).
  try { await supabase.functions.invoke("enrich-voice-from-posts", { body: {} }); } catch { /* non-fatal */ }
  return res;
}

export async function enrichVoiceFromPosts() {
  return supabase.functions.invoke("enrich-voice-from-posts", { body: {} });
}

// ── RSS feeds ──
export async function listRssFeeds() {
  const u = await uid(); if (!u) return [];
  const { data } = await supabase.from("social_rss_feeds" as any).select("*").eq("user_id", u).order("created_at", { ascending: false });
  return (data as any[]) ?? [];
}
export async function createRssFeed(p: { feed_url: string; label?: string; cadence?: string }) {
  const u = await uid(); if (!u) return null;
  const { data, error } = await supabase.from("social_rss_feeds" as any).insert({
    user_id: u, feed_url: p.feed_url.trim(), label: p.label?.trim() || null, cadence: p.cadence || "daily",
  } as any).select().single();
  if (error) throw error; return data;
}
export async function updateRssFeed(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from("social_rss_feeds" as any).update(updates).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteRssFeed(id: string) {
  await supabase.from("social_rss_feeds" as any).delete().eq("id", id);
}
export async function fetchRssNow(feed_id?: string) {
  return supabase.functions.invoke("fetch-rss-articles", { body: feed_id ? { feed_id } : { all_due: false } });
}
export async function fetchAllRssDue() {
  return supabase.functions.invoke("fetch-rss-articles", { body: { all_due: true } });
}

// ── Articles ──
export async function listArticles(filters?: { feed_id?: string; limit?: number }) {
  const u = await uid(); if (!u) return [];
  let q = supabase.from("social_articles" as any).select("*").eq("user_id", u).order("published_at", { ascending: false, nullsFirst: false }).limit(filters?.limit ?? 200);
  if (filters?.feed_id) q = q.eq("feed_id", filters.feed_id);
  const { data } = await q; return (data as any[]) ?? [];
}
export async function deleteArticle(id: string) {
  await supabase.from("social_articles" as any).delete().eq("id", id);
}

// ── Hot News ──
export async function listHotNews() {
  const u = await uid(); if (!u) return [];
  const { data } = await supabase.from("social_hot_news" as any).select("*").eq("user_id", u).order("score", { ascending: false });
  return (data as any[]) ?? [];
}
export async function clusterHotNews() {
  return supabase.functions.invoke("cluster-hot-news", { body: {} });
}
export async function deleteHotNews(id: string) {
  await supabase.from("social_hot_news" as any).delete().eq("id", id);
}

export function computeAccountHealth(acc: any) {
  const budget = Number(acc.monthly_budget_usd ?? 5);
  const cost = (Number(acc.posts_used_this_period ?? 0) / 10) * Number(acc.cost_per_10_posts_usd ?? 0.5);
  const remaining = Math.max(0, budget - cost);
  const start = new Date(acc.period_start);
  const periodEnd = new Date(start); periodEnd.setDate(periodEnd.getDate() + 30);
  const daysLeft = Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / 86400000));
  return { budget, cost, remaining, pct: budget > 0 ? (remaining / budget) * 100 : 0, daysLeft, periodEnd };
}

// Parse "https://console.apify.com/actors/<id>/..." or "apify.com/store/<user>/<actor>" or raw id
export function parseApifyActorId(input: string): string {
  const s = (input || "").trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    const parts = u.pathname.split("/").filter(Boolean);
    const i = parts.indexOf("actors");
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
    const j = parts.indexOf("store");
    if (j >= 0 && parts[j + 1] && parts[j + 2]) return `${parts[j + 1]}~${parts[j + 2]}`;
    return parts[parts.length - 1] || s;
  } catch {
    const cleaned = s.replace(/^\/+/, "").replace(/\/+$/, "");
    if (cleaned.startsWith("actors/")) return cleaned.split("/")[1] ?? "";
    return cleaned.replace("/", "~");
  }
}

export const FRAMEWORK_OPTIONS = [
  { id: "PPPP", name: "PPPP", description: "Promise · Picture · Proof · Push" },
  { id: "BAB", name: "BAB", description: "Before · After · Bridge" },
  { id: "CIII", name: "CIII", description: "Connect · Inform · Inspire · Interact" },
  { id: "AICPBSAWR", name: "AICPBSAWR", description: "Authority compressed (5 beats)" },
  { id: "Contrarian", name: "Contrarian", description: "Pick a fight with consensus" },
  { id: "BuildInPublic", name: "Build-in-Public", description: "Show your real work" },
  { id: "Listicle", name: "Listicle", description: "Numbered insights · most-saved" },
];

// ── Content Studio ──
export async function listContentCategories() {
  const u = await uid(); if (!u) return [];
  const { data } = await supabase.from("content_categories" as any).select("*").eq("user_id", u).order("position", { ascending: true });
  return (data as any[]) ?? [];
}
export async function createContentCategory(p: { name: string; slug?: string; color?: string; icon?: string }) {
  const u = await uid(); if (!u) return null;
  const slug = (p.slug || p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { data, error } = await supabase.from("content_categories" as any).insert({ user_id: u, name: p.name, slug, color: p.color, icon: p.icon } as any).select().single();
  if (error) throw error; return data;
}
export async function deleteContentCategory(id: string) {
  const { error } = await supabase.from("content_categories" as any).delete().eq("id", id);
  if (error) throw error;
}
export async function updateContentCategory(id: string, updates: { name?: string; slug?: string; color?: string; icon?: string; position?: number }) {
  const patch: Record<string, any> = { ...updates };
  if (updates.name && !updates.slug) {
    patch.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  const { data, error } = await supabase.from("content_categories" as any).update(patch).eq("id", id).select().single();
  if (error) throw error;
  // Also propagate name to denormalized category_name on items
  if (updates.name) {
    await supabase.from("content_items" as any).update({ category_name: updates.name } as any).eq("category_id", id);
  }
  return data;
}
export async function bulkUpdateContentItems(ids: string[], updates: Record<string, any>) {
  if (!ids.length) return;
  const { error } = await supabase.from("content_items" as any).update(updates).in("id", ids);
  if (error) throw error;
}
export async function bulkDeleteContentItems(ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase.from("content_items" as any).delete().in("id", ids);
  if (error) throw error;
}

export async function listContentItems(filters?: { category_id?: string; search?: string; level?: string; status?: string; limit?: number }) {
  const u = await uid(); if (!u) return [];
  let q = supabase.from("content_items" as any).select("*").eq("user_id", u).order("position", { ascending: true }).limit(filters?.limit ?? 1000);
  if (filters?.category_id) q = q.eq("category_id", filters.category_id);
  if (filters?.level) q = q.eq("level", filters.level);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.search) q = q.ilike("title", `%${filters.search}%`);
  const { data } = await q;
  return (data as any[]) ?? [];
}
export async function createContentItem(p: Record<string, any>) {
  const u = await uid(); if (!u) return null;
  const { data, error } = await supabase.from("content_items" as any).insert({ ...p, user_id: u } as any).select().single();
  if (error) throw error; return data;
}
export async function updateContentItem(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from("content_items" as any).update(updates).eq("id", id).select().single();
  if (error) throw error; return data;
}
export async function deleteContentItem(id: string) {
  const { error } = await supabase.from("content_items" as any).delete().eq("id", id);
  if (error) throw error;
}
export async function seedContentLibrary(force = false) {
  return supabase.functions.invoke("content-studio-seed", { body: { force } });
}
export async function contentStudioAI(args: { action: "nl_filter" | "brainstorm" | "combine" | "web_search"; message?: string; item_ids?: string[]; query?: string }) {
  return supabase.functions.invoke("content-studio-ai", { body: args });
}
export async function listContentChatMessages(limit = 50) {
  const u = await uid(); if (!u) return [];
  const { data } = await supabase.from("content_chat_messages" as any).select("*").eq("user_id", u).order("created_at", { ascending: true }).limit(limit);
  return (data as any[]) ?? [];
}
export async function pushIdeasToPlanner(ideas: Array<{ title: string; hook?: string; key_topics?: string }>) {
  const u = await uid(); if (!u) return null;
  const rows = ideas.map((i) => ({ user_id: u, hook: i.title, body: [i.hook, i.key_topics].filter(Boolean).join("\n\n"), status: "planned", source_kind: "content_studio" }));
  const { data, error } = await supabase.from("social_content_plan" as any).insert(rows as any).select();
  if (error) throw error; return data;
}

// ── Webhook settings (per platform per user) ──
export const PLANNER_PLATFORMS = ["linkedin", "facebook", "instagram", "twitter", "youtube"] as const;
export type PlannerPlatform = typeof PLANNER_PLATFORMS[number];

export async function listWebhookSettings() {
  const u = await uid(); if (!u) return [];
  const { data } = await supabase.from("social_webhook_settings" as any).select("*").eq("user_id", u);
  return (data as any[]) ?? [];
}
export async function upsertWebhookSetting(p: { platform: PlannerPlatform; webhook_url?: string | null; json_template?: any; active?: boolean }) {
  const u = await uid(); if (!u) return null;
  const { data, error } = await supabase.from("social_webhook_settings" as any).upsert({ user_id: u, ...p } as any, { onConflict: "user_id,platform" }).select().single();
  if (error) throw error; return data;
}

// ── Planner: send/schedule ──
export async function pushSinglePost(plan_id: string) {
  return supabase.functions.invoke("dispatch-due-posts", { body: { plan_id } });
}
export async function createPlannerPost(p: {
  hook: string; body?: string; image_url?: string;
  scheduled_date?: string; scheduled_time?: string;
  platforms?: string[]; status?: string;
  source_kind?: string; source_content_item_id?: string;
}) {
  const u = await uid(); if (!u) return null;
  const { data, error } = await supabase.from("social_content_plan" as any).insert({ ...p, user_id: u } as any).select().single();
  if (error) throw error; return data;
}
