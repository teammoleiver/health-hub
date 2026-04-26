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
  const eligible = accounts.filter((a) => a.active && !usedAccountIdsThisWeek.has(a.id));
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
  // Compute remaining and pick max
  let best: any = null; let bestRem = -1;
  for (const a of eligible) {
    const cost = (Number(a.posts_used_this_period ?? 0) / 10) * Number(a.cost_per_10_posts_usd ?? 0.5);
    const rem = Number(a.monthly_budget_usd ?? 5) - cost;
    if (rem > bestRem && rem > 0) { best = a; bestRem = rem; }
  }
  return best;
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
      const { data: existingRuns } = await admin.from("social_scrape_runs").select("id, apify_account_id")
        .eq("user_id", user.id).eq("profile_id", profile.id).eq("iso_year", year).eq("iso_week", week);
      if (existingRuns && existingRuns.length > 0) {
        results.push({ profile_id: profile.id, status: "skipped", reason: "already scraped this week" });
        continue;
      }

      // Already-used accounts this week (for the user)
      const { data: weekRuns } = await admin.from("social_scrape_runs").select("apify_account_id")
        .eq("user_id", user.id).eq("iso_year", year).eq("iso_week", week);
      const usedSet = new Set<string>((weekRuns ?? []).map((r: any) => r.apify_account_id));

      // Pick best account; fall back to env token if no accounts configured
      let account: any = null;
      let token = fallbackToken;
      let actorId = profile.apify_actor_id || defaultActor;
      if (accounts && accounts.length > 0) {
        account = pickBestAccount(accounts as any[], usedSet);
        if (!account) {
          results.push({ profile_id: profile.id, status: "skipped", reason: "no account with remaining credit / all used this week" });
          continue;
        }
        token = account.api_token;
        actorId = account.actor_id || profile.apify_actor_id || defaultActor;
        if (account._needsReset) {
          await admin.from("social_apify_accounts").update({
            period_start: account.period_start, posts_used_this_period: 0,
          }).eq("id", account.id);
        }
      }
      if (!token) {
        results.push({ profile_id: profile.id, status: "error", error: "No Apify token available" });
        continue;
      }

      try {
        const runUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;
        const apifyRes = await fetch(runUrl, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: profile.profile_url, urls: [profile.profile_url], profileUrls: [profile.profile_url],
            startUrls: [{ url: profile.profile_url }],
            username: profile.username, usernames: profile.username ? [profile.username] : undefined,
            limit, postsLimit: limit, maxPosts: limit, maxItems: limit,
          }),
        });

        if (!apifyRes.ok) {
          const txt = await apifyRes.text();
          await admin.from("social_profiles").update({
            last_scraped_at: new Date().toISOString(), last_scrape_status: "error",
            last_scrape_error: `Apify ${apifyRes.status}: ${txt.slice(0, 400)}`,
          }).eq("id", profile.id);
          if (account) {
            await admin.from("social_scrape_runs").insert({
              user_id: user.id, profile_id: profile.id, apify_account_id: account.id,
              iso_year: year, iso_week: week, posts_fetched: 0, cost_usd: 0,
              status: "error", error: `Apify ${apifyRes.status}`,
            });
          }
          results.push({ profile_id: profile.id, status: "error", error: `Apify ${apifyRes.status}` });
          continue;
        }

        const rawItems: any[] = await apifyRes.json();
        const flat: any[] = [];
        for (const it of rawItems) {
          if (Array.isArray(it?.posts)) flat.push(...it.posts);
          else if (Array.isArray(it?.activity)) flat.push(...it.activity);
          else if (Array.isArray(it?.items)) flat.push(...it.items);
          else flat.push(it);
        }

        let inserted = 0;
        for (const item of flat.slice(0, limit)) {
          const externalId = String(
            item.urn ?? item.id ?? item.postId ?? item.activityId ?? item.shareUrn ??
            item.url ?? item.postUrl ?? item.link ?? item.permalink ?? ""
          );
          const postText = item.text ?? item.postText ?? item.content ?? item.commentary ??
            item.description ?? item.body ?? item.message ?? item.caption ?? "";
          if (!externalId && !postText) continue;
          const postedRaw = item.postedAt ?? item.publishedAt ?? item.date ?? item.timestamp ??
            item.postedAtIso ?? item.postedAtTimestamp ?? item.time ?? item.createdAt ?? null;
          let postedIso: string | null = null;
          if (postedRaw) {
            const d = typeof postedRaw === "number" ? new Date(postedRaw) : new Date(String(postedRaw));
            if (!isNaN(d.getTime())) postedIso = d.toISOString();
          }
          const author = item.authorName ?? item.author?.name ?? item.author?.fullName ?? item.author ??
            item.actor?.name ?? profile.display_name ?? profile.username;
          const company = item.authorCompany ?? item.author?.company ?? item.company ?? profile.company;

          const { error: insErr } = await admin.from("social_posts").insert({
            user_id: user.id, profile_id: profile.id,
            external_id: externalId || `${profile.id}-${flat.indexOf(item)}-${Date.now()}`,
            author: typeof author === "string" ? author : (author?.name ?? null),
            company: typeof company === "string" ? company : (company?.name ?? null),
            post_text: postText, post_type: item.type ?? item.postType ?? "post",
            post_url: item.url ?? item.postUrl ?? item.link ?? item.permalink ?? null,
            posted_at: postedIso,
            likes: Number(item.likes ?? item.numLikes ?? item.likeCount ?? item.reactions ?? item.totalReactionCount ?? 0) || 0,
            comments: Number(item.comments ?? item.numComments ?? item.commentCount ?? item.commentsCount ?? 0) || 0,
            shares: Number(item.shares ?? item.numShares ?? item.shareCount ?? item.reposts ?? item.repostsCount ?? 0) || 0,
            raw_payload: item,
            apify_account_id: account?.id ?? null,
          });
          if (!insErr) inserted++;
        }

        const cost = (inserted / 10) * 0.5;
        total += inserted;

        await admin.from("social_profiles").update({
          last_scraped_at: new Date().toISOString(), last_scrape_status: "success", last_scrape_error: null,
        }).eq("id", profile.id);

        if (account) {
          await admin.from("social_apify_accounts").update({
            posts_used_this_period: Number(account.posts_used_this_period ?? 0) + inserted,
            last_used_at: new Date().toISOString(),
          }).eq("id", account.id);
          await admin.from("social_scrape_runs").insert({
            user_id: user.id, profile_id: profile.id, apify_account_id: account.id,
            iso_year: year, iso_week: week, posts_fetched: inserted, cost_usd: cost, status: "success",
          });
        }

        results.push({ profile_id: profile.id, status: "success", posts: inserted, account: account?.label ?? "env" });
      } catch (e: any) {
        await admin.from("social_profiles").update({
          last_scraped_at: new Date().toISOString(), last_scrape_status: "error",
          last_scrape_error: String(e?.message ?? e).slice(0, 500),
        }).eq("id", profile.id);
        results.push({ profile_id: profile.id, status: "error", error: String(e?.message ?? e) });
      }
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
