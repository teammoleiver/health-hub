import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { force } = await req.json().catch(() => ({}));

    // Load seed JSON (avoid import attributes for edge runtime compatibility)
    const seedUrl = new URL("./seed.json", import.meta.url);
    const seedText = await Deno.readTextFile(seedUrl);
    const seed = JSON.parse(seedText);

    // If user already has items, abort unless forced
    const { count } = await supa.from("content_items").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if ((count ?? 0) > 0 && !force) {
      return new Response(JSON.stringify({ skipped: true, message: "Library already seeded.", existing: count }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let totalCats = 0, totalItems = 0;
    const cats = seed as Array<{ name: string; slug: string; items: any[] }>;
    for (let i = 0; i < cats.length; i++) {
      const c = cats[i];
      const { data: catRow, error: catErr } = await supa
        .from("content_categories")
        .upsert({ user_id: user.id, name: c.name, slug: c.slug, position: i, is_system: true }, { onConflict: "user_id,slug" })
        .select("id")
        .single();
      if (catErr) throw catErr;
      totalCats++;
      const rows = c.items.map((it: any, idx: number) => ({
        user_id: user.id,
        category_id: catRow.id,
        category_name: c.name,
        title: it.title,
        level: it.level ?? null,
        course_name: it.course_name ?? null,
        course_description: it.course_description ?? null,
        lesson_number: it.lesson_number ?? null,
        duration: it.duration ?? null,
        source_url: it.source_url ?? null,
        key_topics: it.key_topics ?? null,
        creator: it.creator ?? null,
        published_label: it.published_label ?? null,
        item_type: it.item_type ?? "lesson",
        origin: "excel",
        position: idx,
      }));
      // chunked insert
      for (let j = 0; j < rows.length; j += 200) {
        const slice = rows.slice(j, j + 200);
        const { error } = await supa.from("content_items").insert(slice);
        if (error) throw error;
        totalItems += slice.length;
      }
    }
    return new Response(JSON.stringify({ ok: true, categories: totalCats, items: totalItems }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("seed error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});