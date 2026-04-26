// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isoWeek(d: Date): { year: number; week: number } {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((+t - +yearStart) / 86400000 + 1) / 7);
  return { year: t.getUTCFullYear(), week };
}

function pickBestAccount(accounts: any[], usedAccountIdsThisWeek: Set<string>) {
  const eligible = accounts.filter((a) => a.active);
  // Refresh period if older than 30 days
  const now = Date.now();
  for (const a of eligible) {
    const start = new Date(a.period_start).getTime();
    if (now - start > 30 * 86400000) {
      a.posts_used_this_period = 0;
      a.period_start = new Date().toISOString().slice(0, 10);
      a._needsReset = true;
    }
  }
  // Prefer unused-this-week accounts, then fall back to the highest remaining balance.
  let best: any = null; let bestScore = -Infinity;
  for (const a of eligible) {
    const cost = (Number(a.posts_used_this_period ?? 0) / 10) * Number(a.cost_per_10_posts_usd ?? 0.5);
    const rem = Number(a.monthly_budget_usd ?? 5) - cost;
    const score = rem - (usedAccountIdsThisWeek.has(a.id) ? 1000 : 0);
    if (rem > 0 && score > bestScore) { best = a; bestScore = score; }
  }
  return best;
}

function normalizeActorId(input?: string | null): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    const actorIndex = parts.indexOf("actors");
    if (actorIndex >= 0 && parts[actorIndex + 1]) return parts[actorIndex + 1];
    const storeIndex = parts.indexOf("store");
    if (storeIndex >= 0 && parts[storeIndex + 1] && parts[storeIndex + 2]) return `${parts[storeIndex + 1]}~${parts[storeIndex + 2]}`;
    if (parts.length >= 2 && url.hostname.includes("apify.com")) return `${parts[0]}~${parts[1]}`;
  } catch { /* raw id */ }
  const cleaned = raw.replace(/^\/+/, "").replace(/\/+$/, "");
  if (cleaned.startsWith("actors/")) return cleaned.split("/")[1] ?? "";
  return cleaned.replace("/", "~");
}

function accountRemaining(a: any) {
  return Number(a.monthly_budget_usd ?? 5) - (Number(a.posts_used_this_period ?? 0) / 10) * Number(a.cost_per_10_posts_usd ?? 0.5);
}

function rankedAccounts(accounts: any[], usedAccountIdsThisWeek: Set<string>) {
  const now = Date.now();
  for (const a of accounts) {
    const start = new Date(a.period_start).getTime();
    if (now - start > 30 * 86400000) {
      a.posts_used_this_period = 0;
      a.period_start = new Date().toISOString().slice(0, 10);
      a._needsReset = true;
    }
  }
  return accounts.filter((a) => a.active && accountRemaining(a) > 0).sort((a, b) => {
    const usedDelta = Number(usedAccountIdsThisWeek.has(a.id)) - Number(usedAccountIdsThisWeek.has(b.id));
    return usedDelta || accountRemaining(b) - accountRemaining(a);
  });
}

function buildLinkedInInput(profile: any, limit: number) {
  const url = profile.profile_url;
  return { url, urls: [url], profileUrls: [url], startUrls: [{ url }], username: profile.username, usernames: profile.username ? [profile.username] : undefined, limit, postsLimit: limit, maxPosts: limit, maxItems: limit };
}

function flattenItems(rawItems: any[]) {
  const flat: any[] = [];
  for (const it of rawItems) {
    if (Array.isArray(it?.posts)) flat.push(...it.posts);
    else if (Array.isArray(it?.activity)) flat.push(...it.activity);
    else if (Array.isArray(it?.items)) flat.push(...it.items);
    else flat.push(it);
  }
  return flat;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fallbackToken = Deno.env.get("APIFY_API_TOKEN");
    const defaultActor = Deno.env.get("APIFY_LINKEDIN_ACTOR_ID") ?? "94SdiE9JwTx0RNyfS";

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const { profile_id, all_active, limit = 5 } = body as { profile_id?: string; all_active?: boolean; limit?: number };

    let q = admin.from("social_profiles").select("*").eq("user_id", user.id);
    if (profile_id) q = q.eq("id", profile_id);
    else if (all_active) q = q.eq("active", true);
    else return new Response(JSON.stringify({ error: "profile_id or all_active required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const { data: profiles, error: pErr } = await q;
    if (pErr) throw pErr;
    if (!profiles?.length) return new Response(JSON.stringify({ scraped: 0, message: "No profiles" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const { data: accounts } = await admin.from("social_apify_accounts").select("*").eq("user_id", user.id).eq("active", true);

    const { week, year } = isoWeek(new Date());

    let total = 0;
    const results: any[] = [];

    for (const profile of profiles) {
      // Enforce: one scrape per profile per ISO week
      const { data: existingRuns } = await admin.from("social_scrape_runs").select("id, apify_account_id, status, posts_fetched")
        .eq("user_id", user.id).eq("profile_id", profile.id).eq("iso_year", year).eq("iso_week", week);
      const alreadySucceeded = (existingRuns ?? []).some((r: any) => r.status === "success" && Number(r.posts_fetched ?? 0) > 0);
      if (alreadySucceeded) {
        results.push({ profile_id: profile.id, status: "skipped", reason: "already scraped this week" });
        continue;
      }

      // Already-used accounts this week (for the user)
      const { data: weekRuns } = await admin.from("social_scrape_runs").select("apify_account_id")
        .eq("user_id", user.id).eq("iso_year", year).eq("iso_week", week);
      const usedSet = new Set<string>((weekRuns ?? []).map((r: any) => r.apify_account_id));

      const candidates = accounts && accounts.length > 0 ? rankedAccounts(accounts as any[], usedSet) : [];
      if (accounts && accounts.length > 0 && candidates.length === 0) {
        results.push({ profile_id: profile.id, status: "skipped", reason: "no account with remaining credit" });
        continue;
      }
      if (!fallbackToken && candidates.length === 0) {
        results.push({ profile_id: profile.id, status: "error", error: "No Apify token available" });
        continue;
      }

      let inserted = 0;
      let winningAccount: any = null;
      let lastError = "No results";
      const attempts = candidates.length > 0 ? candidates : [{ id: null, label: "env", api_token: fallbackToken, actor_id: profile.apify_actor_id || defaultActor }];

      for (const account of attempts) {
        const token = account.api_token;
        const actorId = normalizeActorId(account.actor_id || profile.apify_actor_id || defaultActor);
        if (!token || !actorId) continue;
        if (account._needsReset) {
          await admin.from("social_apify_accounts").update({ period_start: account.period_start, posts_used_this_period: 0 }).eq("id", account.id);
        }
        try {
        const runUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${token}`;
        const apifyRes = await fetch(runUrl, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildLinkedInInput(profile, limit)),
        });

        if (!apifyRes.ok) {
          const txt = await apifyRes.text();
          lastError = `Apify ${apifyRes.status}: ${txt.slice(0, 300)}`;
          if (account.id) {
            await admin.from("social_apify_accounts").update({ last_test_status: `scrape error ${apifyRes.status}`, last_test_at: new Date().toISOString() }).eq("id", account.id);
            await admin.from("social_scrape_runs").insert({
              user_id: user.id, profile_id: profile.id, apify_account_id: account.id,
              iso_year: year, iso_week: week, posts_fetched: 0, cost_usd: 0,
              status: "error", error: lastError.slice(0, 500),
            });
          }
          continue;
        }

        const rawItems: any[] = await apifyRes.json();
        const flat = flattenItems(rawItems);

        for (const [index, item] of flat.slice(0, limit).entries()) {
          const externalId = String(
            item.urn ?? item.id ?? item.postId ?? item.activityId ?? item.shareUrn ??
            item.url ?? item.postUrl ?? item.link ?? item.permalink ?? ""
          );
          const postText = item.post_text ?? item.text ?? item.postText ?? item.content ?? item.commentary ??
            item.description ?? item.body ?? item.message ?? item.caption ?? "";
          if (!externalId && !postText) continue;
          const postedRaw = item.date_posted ?? item.postedAt ?? item.publishedAt ?? item.date ?? item.timestamp ??
            item.postedAtIso ?? item.postedAtTimestamp ?? item.time ?? item.createdAt ?? null;
          let postedIso: string | null = null;
          if (postedRaw) {
            const d = typeof postedRaw === "number" ? new Date(postedRaw) : new Date(String(postedRaw));
            if (!isNaN(d.getTime())) postedIso = d.toISOString();
          }
          const author = item.user_name ?? item.authorName ?? item.author?.name ?? item.author?.fullName ?? item.author ??
            item.actor?.name ?? profile.display_name ?? profile.username;
          const company = item.authorCompany ?? item.author?.company ?? item.company ?? profile.company;

          const { error: insErr } = await admin.from("social_posts").insert({
            user_id: user.id, profile_id: profile.id,
            external_id: externalId || `${profile.id}-${index}-${Date.now()}`,
            author: typeof author === "string" ? author : (author?.name ?? null),
            company: typeof company === "string" ? company : (company?.name ?? null),
            post_text: postText, post_type: item.post_type ?? item.type ?? item.postType ?? "post",
            post_url: item.url ?? item.postUrl ?? item.link ?? item.permalink ?? null,
            posted_at: postedIso,
            likes: Number(item.num_likes ?? item.likes ?? item.numLikes ?? item.likeCount ?? item.reactions ?? item.totalReactionCount ?? 0) || 0,
            comments: Number(item.num_comments ?? item.comments ?? item.numComments ?? item.commentCount ?? item.commentsCount ?? 0) || 0,
            shares: Number(item.num_shares ?? item.shares ?? item.numShares ?? item.shareCount ?? item.reposts ?? item.repostsCount ?? 0) || 0,
            raw_payload: item,
            apify_account_id: account.id ?? null,
          });
          if (!insErr) inserted++;
        }

        if (inserted === 0) {
          lastError = `Actor returned ${flat.length} item(s), but no usable post text was found`;
          if (account.id) await admin.from("social_apify_accounts").update({ last_test_status: "no results", last_test_at: new Date().toISOString() }).eq("id", account.id);
          continue;
        }

        winningAccount = account;
        break;
        } catch (e: any) {
          lastError = String(e?.message ?? e);
          if (account.id) await admin.from("social_apify_accounts").update({ last_test_status: "scrape failed", last_test_at: new Date().toISOString() }).eq("id", account.id);
        }
      }

      if (inserted === 0) {
        await admin.from("social_profiles").update({
          last_scraped_at: new Date().toISOString(), last_scrape_status: "error",
          last_scrape_error: lastError.slice(0, 500),
        }).eq("id", profile.id);
        results.push({ profile_id: profile.id, status: "error", error: lastError });
        continue;
      }

        const cost = (inserted / 10) * 0.5;
        total += inserted;

        await admin.from("social_profiles").update({
          last_scraped_at: new Date().toISOString(), last_scrape_status: "success", last_scrape_error: null,
        }).eq("id", profile.id);

        if (winningAccount?.id) {
          await admin.from("social_apify_accounts").update({
            posts_used_this_period: Number(winningAccount.posts_used_this_period ?? 0) + inserted,
            last_used_at: new Date().toISOString(),
            last_test_status: "ok",
          }).eq("id", winningAccount.id);
          await admin.from("social_scrape_runs").insert({
            user_id: user.id, profile_id: profile.id, apify_account_id: winningAccount.id,
            iso_year: year, iso_week: week, posts_fetched: inserted, cost_usd: cost, status: "success",
          });
        }

        results.push({ profile_id: profile.id, status: "success", posts: inserted, account: winningAccount?.label ?? "env" });
    }

    return new Response(JSON.stringify({ scraped: total, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("scrape-linkedin-profile:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
