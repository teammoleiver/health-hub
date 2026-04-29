// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function decodeEntities(s: string) {
  return (s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
function stripTags(s: string) { return decodeEntities(s).replace(/<[^>]+>/g, "").trim(); }
function pick(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1] : null;
}
function pickAttr(xml: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']+)["']`, "i");
  const m = xml.match(re); return m ? m[1] : null;
}

function parseFeed(xml: string) {
  const items: any[] = [];
  const isAtom = /<feed[\s>]/i.test(xml);
  const blockTag = isAtom ? "entry" : "item";
  const re = new RegExp(`<${blockTag}[\\s\\S]*?<\\/${blockTag}>`, "gi");
  const blocks = xml.match(re) ?? [];
  for (const b of blocks) {
    const title = stripTags(pick(b, "title") ?? "");
    let link = "";
    if (isAtom) link = pickAttr(b, "link", "href") ?? "";
    else link = stripTags(pick(b, "link") ?? "");
    const pub = pick(b, "pubDate") ?? pick(b, "published") ?? pick(b, "updated") ?? pick(b, "dc:date");
    const desc = pick(b, "description") ?? pick(b, "summary") ?? pick(b, "content") ?? pick(b, "content:encoded") ?? "";
    const author = stripTags(pick(b, "author") ?? pick(b, "dc:creator") ?? "");
    if (!title || !link) continue;
    items.push({
      title,
      article_url: link.trim(),
      snippet: stripTags(desc).slice(0, 600),
      published_at: pub ? new Date(stripTags(pub)).toISOString() : null,
      author: author || null,
    });
  }
  const sourceLabel = stripTags(pick(xml, "title") ?? "");
  return { items, sourceLabel };
}

function dueByCadence(lastFetched: string | null, cadence: string) {
  if (!lastFetched) return true;
  const ms = Date.now() - new Date(lastFetched).getTime();
  const day = 86400000;
  if (cadence === "weekly") return ms >= 7 * day;
  if (cadence === "monthly") return ms >= 30 * day;
  return ms >= day; // daily
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes.user;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json().catch(() => ({}));
    const { feed_id, all_due, scheduled } = body ?? {};

    let feedsQ = admin.from("social_rss_feeds").select("*").eq("active", true);
    if (!scheduled) {
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      feedsQ = feedsQ.eq("user_id", user.id);
      if (feed_id) feedsQ = feedsQ.eq("id", feed_id);
    }
    const { data: feeds } = await feedsQ;

    const results: any[] = [];
    for (const f of feeds ?? []) {
      if (all_due || scheduled) {
        if (!dueByCadence(f.last_fetched_at, f.cadence)) { results.push({ id: f.id, skipped: true }); continue; }
      }
      try {
        const r = await fetch(f.feed_url, { headers: { "User-Agent": "Mozilla/5.0 SyncvidaRSS/1.0", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const xml = await r.text();
        const { items, sourceLabel } = parseFeed(xml);
        let inserted = 0;
        for (const it of items.slice(0, 50)) {
          const { error } = await admin.from("social_articles").upsert({
            user_id: f.user_id, feed_id: f.id, title: it.title.slice(0, 500),
            snippet: it.snippet, article_url: it.article_url, author: it.author,
            source_label: f.label || sourceLabel || null, published_at: it.published_at,
          }, { onConflict: "user_id,article_url", ignoreDuplicates: true });
          if (!error) inserted++;
        }
        await admin.from("social_rss_feeds").update({
          last_fetched_at: new Date().toISOString(), last_fetch_status: "success",
          last_fetch_error: null, articles_count: (f.articles_count || 0) + inserted,
        }).eq("id", f.id);
        results.push({ id: f.id, fetched: items.length, inserted });

        // Auto-cluster Hot News for this user after every successful fetch.
        try {
          await fetch(`${supabaseUrl}/functions/v1/cluster-hot-news`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
            body: JSON.stringify({ user_id: f.user_id, scheduled: true }),
          });
        } catch { /* non-fatal */ }
      } catch (e: any) {
        await admin.from("social_rss_feeds").update({
          last_fetched_at: new Date().toISOString(), last_fetch_status: "error",
          last_fetch_error: String(e?.message ?? e),
        }).eq("id", f.id);
        results.push({ id: f.id, error: String(e?.message ?? e) });
      }
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("fetch-rss-articles:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});