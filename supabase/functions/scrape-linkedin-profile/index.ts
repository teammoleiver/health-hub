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
    const apifyToken = Deno.env.get("APIFY_API_TOKEN");
    const defaultActor = Deno.env.get("APIFY_LINKEDIN_ACTOR_ID") ?? "94SdiE9JwTx0RNyfS";

    if (!apifyToken) {
      return new Response(JSON.stringify({ error: "APIFY_API_TOKEN not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const { profile_id, all_active, limit = 30 } = body as { profile_id?: string; all_active?: boolean; limit?: number };

    let q = admin.from("social_profiles").select("*").eq("user_id", user.id);
    if (profile_id) q = q.eq("id", profile_id);
    else if (all_active) q = q.eq("active", true);
    else return new Response(JSON.stringify({ error: "profile_id or all_active required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const { data: profiles, error: pErr } = await q;
    if (pErr) throw pErr;
    if (!profiles?.length) {
      return new Response(JSON.stringify({ scraped: 0, message: "No profiles" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let total = 0;
    const results: any[] = [];

    for (const profile of profiles) {
      const actorId = profile.apify_actor_id || defaultActor;
      try {
        const runUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}`;
        const apifyRes = await fetch(runUrl, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: profile.profile_url,
            urls: [profile.profile_url],
            profileUrls: [profile.profile_url],
            startUrls: [{ url: profile.profile_url }],
            username: profile.username,
            usernames: profile.username ? [profile.username] : undefined,
            limit, postsLimit: limit, maxPosts: limit, maxItems: limit,
          }),
        });

        if (!apifyRes.ok) {
          const txt = await apifyRes.text();
          await admin.from("social_profiles").update({
            last_scraped_at: new Date().toISOString(),
            last_scrape_status: "error",
            last_scrape_error: `Apify ${apifyRes.status}: ${txt.slice(0, 500)}`,
          }).eq("id", profile.id);
          results.push({ profile_id: profile.id, status: "error", error: `Apify ${apifyRes.status}` });
          continue;
        }

        const rawItems: any[] = await apifyRes.json();
        console.log(`[scrape] profile=${profile.id} apify items=${rawItems.length} sample=`, JSON.stringify(rawItems[0] ?? {}).slice(0, 800));

        // Flatten: some actors return one wrapper item { posts: [...] }, others return posts directly
        const flat: any[] = [];
        for (const it of rawItems) {
          if (Array.isArray(it?.posts)) flat.push(...it.posts);
          else if (Array.isArray(it?.activity)) flat.push(...it.activity);
          else if (Array.isArray(it?.items)) flat.push(...it.items);
          else flat.push(it);
        }
        console.log(`[scrape] flattened items=${flat.length}`);

        let inserted = 0;
        let skipped = 0;
        let insertErrors = 0;

        for (const item of flat.slice(0, limit)) {
          const externalId = String(
            item.urn ?? item.id ?? item.postId ?? item.activityId ?? item.shareUrn ??
            item.url ?? item.postUrl ?? item.link ?? item.permalink ?? ""
          );
          const postText =
            item.text ?? item.postText ?? item.content ?? item.commentary ??
            item.description ?? item.body ?? item.message ?? item.caption ?? "";
          if (!externalId && !postText) { skipped++; continue; }
          const postedRaw =
            item.postedAt ?? item.publishedAt ?? item.date ?? item.timestamp ??
            item.postedAtIso ?? item.postedAtTimestamp ?? item.time ?? item.createdAt ?? null;

          let postedIso: string | null = null;
          if (postedRaw) {
            const d = typeof postedRaw === "number" ? new Date(postedRaw) : new Date(String(postedRaw));
            if (!isNaN(d.getTime())) postedIso = d.toISOString();
          }

          const author =
            item.authorName ?? item.author?.name ?? item.author?.fullName ?? item.author ??
            item.actor?.name ?? profile.display_name ?? profile.username;
          const company =
            item.authorCompany ?? item.author?.company ?? item.company ?? profile.company;

          const row: any = {
            user_id: user.id,
            profile_id: profile.id,
            external_id: externalId || `${profile.id}-${flat.indexOf(item)}-${Date.now()}`,
            author: typeof author === "string" ? author : (author?.name ?? null),
            company: typeof company === "string" ? company : (company?.name ?? null),
            post_text: postText,
            post_type: item.type ?? item.postType ?? "post",
            post_url: item.url ?? item.postUrl ?? item.link ?? item.permalink ?? null,
            posted_at: postedIso,
            likes: Number(item.likes ?? item.numLikes ?? item.likeCount ?? item.reactions ?? item.totalReactionCount ?? 0) || 0,
            comments: Number(item.comments ?? item.numComments ?? item.commentCount ?? item.commentsCount ?? 0) || 0,
            shares: Number(item.shares ?? item.numShares ?? item.shareCount ?? item.reposts ?? item.repostsCount ?? 0) || 0,
            raw_payload: item,
          };

          // Plain insert (table has no unique constraint defined for upsert).
          const { error: insErr } = await admin.from("social_posts").insert(row);
          if (insErr) {
            insertErrors++;
            console.error(`[scrape] insert error:`, insErr.message);
          } else {
            inserted++;
          }
        }
        console.log(`[scrape] profile=${profile.id} inserted=${inserted} skipped=${skipped} errors=${insertErrors}`);

        total += inserted;
        await admin.from("social_profiles").update({
          last_scraped_at: new Date().toISOString(),
          last_scrape_status: "success",
          last_scrape_error: null,
        }).eq("id", profile.id);
        results.push({ profile_id: profile.id, status: "success", posts: inserted });
      } catch (e: any) {
        await admin.from("social_profiles").update({
          last_scraped_at: new Date().toISOString(),
          last_scrape_status: "error",
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
