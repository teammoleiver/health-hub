import { useEffect, useState } from "react";
import { Link as LinkIcon, Plus, Play, Trash2, Sparkles, Settings as SettingsIcon, TrendingUp, FileText, CalendarDays, Users, RefreshCw, Loader2, Wand2, ChevronRight, Copy, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  listSocialProfiles, createSocialProfile, updateSocialProfile, deleteSocialProfile,
  listSocialPosts, createManualSocialPost, deleteSocialPost,
  listHotTopics, clusterHotTopics, deleteHotTopic,
  listContentPlan, createPlanEntry, updatePlanEntry, deletePlanEntry,
  getWriterSettings, upsertWriterSettings,
  scrapeProfile, scrapeAllActive,
  generatePost, suggestFrameworks,
  FRAMEWORK_OPTIONS,
  listApifyAccounts, createApifyAccount, updateApifyAccount, deleteApifyAccount, testApifyAccount, computeAccountHealth,
} from "@/lib/social-queries";

type Tab = "profiles" | "posts" | "topics" | "planner" | "settings";

const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: "profiles", label: "Profiles to Track", icon: Users },
  { id: "posts", label: "Scraped Posts", icon: FileText },
  { id: "topics", label: "Hot Topics & Rewrites", icon: TrendingUp },
  { id: "planner", label: "Content Planner", icon: CalendarDays },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function SocialMediaModule() {
  const [tab, setTab] = useState<Tab>("profiles");

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-display font-bold">S</div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Social Media Studio</h1>
          <p className="text-sm text-muted-foreground">Track LinkedIn voices · scrape posts · turn signal into your own content.</p>
        </div>
      </header>

      <div className="border-b border-border flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border-b-2 transition-colors -mb-px ${
              tab === t.id ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profiles" && <ProfilesTab />}
      {tab === "posts" && <PostsTab />}
      {tab === "topics" && <TopicsTab />}
      {tab === "planner" && <PlannerTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

// ───────── Profiles tab ─────────
function ProfilesTab() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [scrapingAll, setScrapingAll] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => { setLoading(true); setProfiles(await listSocialProfiles()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = profiles.filter((p) =>
    !search || [p.username, p.display_name, p.company, p.location, p.profile_url, p.title].some((f) => (f ?? "").toString().toLowerCase().includes(search.toLowerCase()))
  );

  const runOne = async (id: string) => {
    setScrapingId(id);
    const { error, data } = await scrapeProfile(id);
    setScrapingId(null);
    if (error) toast.error(error.message || "Scrape failed");
    else { toast.success(`Scraped ${(data as any)?.scraped ?? 0} posts`); load(); }
  };

  const runAll = async () => {
    setScrapingAll(true);
    const { error, data } = await scrapeAllActive();
    setScrapingAll(false);
    if (error) toast.error(error.message || "Bulk scrape failed");
    else { toast.success(`Scraped ${(data as any)?.scraped ?? 0} new posts across all active profiles`); load(); }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Input placeholder="Search name, URL, company, location…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={runAll} disabled={scrapingAll}>
            {scrapingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Run All Active
          </Button>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Profile</Button></DialogTrigger>
            <AddProfileDialog onCreated={() => { setShowAdd(false); load(); }} />
          </Dialog>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{profiles.length} profiles total</p>

      {loading ? <div className="text-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></div> :
        filtered.length === 0 ? <Card className="p-8 text-center text-muted-foreground">No profiles yet. Add a LinkedIn URL to start tracking.</Card> :
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-3 py-2 font-medium">LinkedIn URL</th>
                <th className="text-left px-3 py-2 font-medium">Name</th>
                <th className="text-left px-3 py-2 font-medium">Company</th>
                <th className="text-left px-3 py-2 font-medium">Location</th>
                <th className="text-left px-3 py-2 font-medium">Cadence</th>
                <th className="text-left px-3 py-2 font-medium">Last Scrape</th>
                <th className="text-left px-3 py-2 font-medium">Active</th>
                <th className="text-right px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2"><a href={p.profile_url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-[180px] inline-flex items-center gap-1">{p.username || p.profile_url.slice(-24)} <ArrowUpRight className="w-3 h-3" /></a></td>
                  <td className="px-3 py-2 font-medium">{p.display_name || "—"}</td>
                  <td className="px-3 py-2">{p.company || "—"}</td>
                  <td className="px-3 py-2">{p.location || "—"}</td>
                  <td className="px-3 py-2">
                    <Select value={p.scrape_cadence ?? "daily"} onValueChange={async (v) => { await updateSocialProfile(p.id, { scrape_cadence: v }); load(); }}>
                      <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {p.last_scraped_at ? new Date(p.last_scraped_at).toLocaleString() : "—"}
                    {p.last_scrape_status === "error" && <Badge variant="destructive" className="ml-1 text-[10px]">err</Badge>}
                  </td>
                  <td className="px-3 py-2"><Switch checked={p.active} onCheckedChange={async (v) => { await updateSocialProfile(p.id, { active: v }); load(); }} /></td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => runOne(p.id)} disabled={scrapingId === p.id}>
                      {scrapingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={async () => { if (confirm("Delete profile?")) { await deleteSocialProfile(p.id); load(); } }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </section>
  );
}

function AddProfileDialog({ onCreated }: { onCreated: () => void }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [cadence, setCadence] = useState("daily");
  const [actor, setActor] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Add LinkedIn profile</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><label className="text-xs font-medium">LinkedIn URL *</label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.linkedin.com/in/username" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium">Display name</label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="text-xs font-medium">Company</label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Scrape cadence</label>
            <Select value={cadence} onValueChange={setCadence}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off (manual only)</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly (Mondays)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><label className="text-xs font-medium">Apify actor (optional)</label><Input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="default actor" /></div>
        </div>
        <Button className="w-full" disabled={!url || busy} onClick={async () => {
          setBusy(true);
          try {
            await createSocialProfile({ profile_url: url.trim(), display_name: name || undefined, company: company || undefined, scrape_cadence: cadence, apify_actor_id: actor || undefined });
            toast.success("Profile added");
            onCreated();
          } catch (e: any) { toast.error(e?.message ?? "Failed"); } finally { setBusy(false); }
        }}>{busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Add profile</Button>
      </div>
    </DialogContent>
  );
}

// ───────── Posts tab ─────────
function PostsTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openPost, setOpenPost] = useState<any | null>(null);
  const [showManual, setShowManual] = useState(false);

  const load = async () => { setLoading(true); const [pp, pr] = await Promise.all([listSocialPosts(profileFilter !== "all" ? { profile_id: profileFilter } : {}), listSocialProfiles()]); setPosts(pp); setProfiles(pr); setLoading(false); };
  useEffect(() => { load(); }, [profileFilter]);

  const filtered = posts.filter((p) => !search || (p.post_text || "").toLowerCase().includes(search.toLowerCase()) || (p.author || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <Input placeholder="Search posts…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <Select value={profileFilter} onValueChange={setProfileFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All profiles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All profiles</SelectItem>
              {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.display_name || p.username}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{filtered.length} posts</span>
          <Dialog open={showManual} onOpenChange={setShowManual}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Add manually</Button></DialogTrigger>
            <ManualPostDialog profiles={profiles} onCreated={() => { setShowManual(false); load(); }} />
          </Dialog>
        </div>
      </div>

      {loading ? <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> :
        filtered.length === 0 ? <Card className="p-8 text-center text-muted-foreground">No posts. Run a scrape or add one manually.</Card> :
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Author</th>
                <th className="text-left px-3 py-2">Company</th>
                <th className="text-left px-3 py-2">Post</th>
                <th className="text-left px-3 py-2">Likes</th>
                <th className="text-left px-3 py-2">Comments</th>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20 cursor-pointer" onClick={() => setOpenPost(p)}>
                  <td className="px-3 py-2 font-medium">{p.author || "—"}</td>
                  <td className="px-3 py-2">{p.company || "—"}</td>
                  <td className="px-3 py-2 max-w-md"><div className="line-clamp-2 text-muted-foreground">{p.post_text}</div></td>
                  <td className="px-3 py-2">{p.likes}</td>
                  <td className="px-3 py-2">{p.comments}</td>
                  <td className="px-3 py-2 text-xs">{p.posted_at ? new Date(p.posted_at).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {p.post_url && <a href={p.post_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary inline-flex"><ArrowUpRight className="w-4 h-4" /></a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }

      {openPost && <PostInspectorDialog post={openPost} onClose={() => setOpenPost(null)} />}
    </section>
  );
}

function ManualPostDialog({ profiles, onCreated }: { profiles: any[]; onCreated: () => void }) {
  const [profileId, setProfileId] = useState<string>("");
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Add post manually</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Select value={profileId} onValueChange={setProfileId}>
          <SelectTrigger><SelectValue placeholder="Profile (optional)" /></SelectTrigger>
          <SelectContent>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.display_name || p.username}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Author name" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <Textarea rows={6} placeholder="Paste post text…" value={text} onChange={(e) => setText(e.target.value)} />
        <Button className="w-full" disabled={!text || busy} onClick={async () => {
          setBusy(true);
          try { await createManualSocialPost({ profile_id: profileId || undefined, author: author || undefined, post_text: text }); toast.success("Added"); onCreated(); }
          catch (e: any) { toast.error(e?.message ?? "Failed"); } finally { setBusy(false); }
        }}>Add post</Button>
      </div>
    </DialogContent>
  );
}

function PostInspectorDialog({ post, onClose }: { post: any; onClose: () => void }) {
  const [suggestions, setSuggestions] = useState<{ framework: string; reason: string }[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { body: string; loading: boolean }>>({});
  const [suggesting, setSuggesting] = useState(false);

  const suggest = async () => {
    setSuggesting(true);
    const { data, error } = await suggestFrameworks({ source_post_id: post.id });
    setSuggesting(false);
    if (error) return toast.error(error.message);
    setSuggestions((data as any)?.suggestions ?? []);
  };

  const generate = async (framework: string) => {
    setDrafts((d) => ({ ...d, [framework]: { body: "", loading: true } }));
    const { data, error } = await generatePost({ framework, source_post_id: post.id });
    if (error) { setDrafts((d) => ({ ...d, [framework]: { body: "", loading: false } })); return toast.error(error.message); }
    setDrafts((d) => ({ ...d, [framework]: { body: (data as any)?.draft?.body ?? "", loading: false } }));
  };

  const sendToPlanner = async (framework: string, body: string) => {
    const hookLine = body.split("\n").find((l) => l.trim()) || body.slice(0, 80);
    await createPlanEntry({ hook: hookLine.slice(0, 140), body, framework, format: framework === "Listicle" ? "framework" : "insight", status: "planned", source_post_id: post.id });
    toast.success("Added to Content Planner");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Post by {post.author}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Card className="p-4 bg-muted/30 whitespace-pre-wrap text-sm">{post.post_text}</Card>
          <div className="text-xs text-muted-foreground flex gap-3">
            <span>👍 {post.likes}</span><span>💬 {post.comments}</span><span>🔁 {post.shares}</span>
            {post.post_url && <a href={post.post_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">View on LinkedIn <ArrowUpRight className="w-3 h-3" /></a>}
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm flex items-center gap-2"><Wand2 className="w-4 h-4" />Generate posts from this</h3>
              <Button size="sm" variant="outline" onClick={suggest} disabled={suggesting}>
                {suggesting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}Suggest best frameworks
              </Button>
            </div>
            {suggestions && suggestions.length > 0 && (
              <div className="mb-3 space-y-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="text-xs flex gap-2 items-start bg-primary/5 border border-primary/20 rounded p-2">
                    <Badge variant="secondary" className="shrink-0">{s.framework}</Badge>
                    <span className="text-muted-foreground">{s.reason}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FRAMEWORK_OPTIONS.map((f) => (
                <Card key={f.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{f.name}</div>
                      <div className="text-[11px] text-muted-foreground">{f.description}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => generate(f.id)} disabled={drafts[f.id]?.loading}>
                      {drafts[f.id]?.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    </Button>
                  </div>
                  {drafts[f.id]?.body && (
                    <div className="mt-2 space-y-2">
                      <Textarea rows={8} value={drafts[f.id].body} onChange={(e) => setDrafts((d) => ({ ...d, [f.id]: { ...d[f.id], body: e.target.value } }))} className="text-xs" />
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(drafts[f.id].body); toast.success("Copied"); }}><Copy className="w-3 h-3 mr-1" />Copy</Button>
                        <Button size="sm" onClick={() => sendToPlanner(f.id, drafts[f.id].body)}><ChevronRight className="w-3 h-3 mr-1" />To Planner</Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ───────── Topics tab ─────────
function TopicsTab() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clustering, setClustering] = useState(false);
  const [genTopic, setGenTopic] = useState<any | null>(null);

  const load = async () => { setLoading(true); setTopics(await listHotTopics()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const cluster = async () => {
    setClustering(true);
    const { error, data } = await clusterHotTopics();
    setClustering(false);
    if (error) toast.error(error.message);
    else { toast.success(`Generated ${(data as any)?.topics ?? 0} topics`); load(); }
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl flex items-center gap-2">🔥 Hot Topics</h2>
        <Button onClick={cluster} disabled={clustering}>
          {clustering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Re-cluster from posts
        </Button>
      </div>
      {loading ? <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> :
        topics.length === 0 ? <Card className="p-8 text-center text-muted-foreground">No topics yet. Click "Re-cluster from posts" after scraping some profiles.</Card> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {topics.map((t) => (
            <Card key={t.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium leading-tight">{t.title}</h3>
                <Badge variant="secondary">{t.score}/100</Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">{t.description}</p>
              <div className="text-[11px] text-muted-foreground flex gap-3 flex-wrap">
                <span>{t.post_count} posts</span><span>{t.profile_count} profiles</span>{t.timeframe && <span>{t.timeframe}</span>}
              </div>
              <div className="flex gap-1 pt-2">
                <Button size="sm" variant="outline" onClick={() => setGenTopic(t)}><Sparkles className="w-3 h-3 mr-1" />Generate Rewrites</Button>
                <Button size="sm" variant="ghost" onClick={async () => { await deleteHotTopic(t.id); load(); }}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      }
      {genTopic && <TopicGenerateDialog topic={genTopic} onClose={() => setGenTopic(null)} />}
    </section>
  );
}

function TopicGenerateDialog({ topic, onClose }: { topic: any; onClose: () => void }) {
  const [drafts, setDrafts] = useState<Record<string, { body: string; loading: boolean }>>({});
  const generate = async (framework: string) => {
    setDrafts((d) => ({ ...d, [framework]: { body: "", loading: true } }));
    const { data, error } = await generatePost({ framework, source_topic_id: topic.id, idea: topic.title, significance: topic.description });
    if (error) { setDrafts((d) => ({ ...d, [framework]: { body: "", loading: false } })); return toast.error(error.message); }
    setDrafts((d) => ({ ...d, [framework]: { body: (data as any)?.draft?.body ?? "", loading: false } }));
  };
  const send = async (framework: string, body: string) => {
    const hookLine = body.split("\n").find((l) => l.trim()) || body.slice(0, 80);
    await createPlanEntry({ hook: hookLine.slice(0, 140), body, framework, status: "planned", source_topic_id: topic.id });
    toast.success("Added to Content Planner");
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{topic.title}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{topic.description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {FRAMEWORK_OPTIONS.map((f) => (
            <Card key={f.id} className="p-3">
              <div className="flex items-center justify-between">
                <div><div className="font-medium text-sm">{f.name}</div><div className="text-[11px] text-muted-foreground">{f.description}</div></div>
                <Button size="sm" variant="ghost" onClick={() => generate(f.id)} disabled={drafts[f.id]?.loading}>
                  {drafts[f.id]?.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                </Button>
              </div>
              {drafts[f.id]?.body && (
                <div className="mt-2 space-y-2">
                  <Textarea rows={8} value={drafts[f.id].body} onChange={(e) => setDrafts((d) => ({ ...d, [f.id]: { ...d[f.id], body: e.target.value } }))} className="text-xs" />
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(drafts[f.id].body); toast.success("Copied"); }}><Copy className="w-3 h-3 mr-1" />Copy</Button>
                    <Button size="sm" onClick={() => send(f.id, drafts[f.id].body)}><ChevronRight className="w-3 h-3 mr-1" />To Planner</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ───────── Planner tab ─────────
function PlannerTab() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => { setLoading(true); setEntries(await listContentPlan()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = entries.filter((e) => (statusFilter === "all" || e.status === statusFilter) && (!search || (e.hook ?? "").toLowerCase().includes(search.toLowerCase())));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center">
          <Input placeholder="Search planner…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="ready">Ready to Post</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-1" />Add Entry</Button>
      </div>
      {loading ? <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> :
        filtered.length === 0 ? <Card className="p-8 text-center text-muted-foreground">No entries yet. Generate a post and send it to the planner.</Card> :
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2 w-10">#</th>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Hook</th>
                <th className="text-left px-3 py-2">Format</th>
                <th className="text-left px-3 py-2">Framework</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/20 cursor-pointer" onClick={() => setEditing(e)}>
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 text-xs">{e.scheduled_date || "—"}</td>
                  <td className="px-3 py-2 max-w-md"><div className="line-clamp-2">{e.hook}</div></td>
                  <td className="px-3 py-2"><Badge variant="outline">{e.format}</Badge></td>
                  <td className="px-3 py-2 text-xs">{e.framework || "—"}</td>
                  <td className="px-3 py-2">
                    <Badge variant={e.status === "posted" ? "default" : e.status === "ready" ? "secondary" : "outline"} className="capitalize">{e.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={(ev) => { ev.stopPropagation(); deletePlanEntry(e.id).then(load); }}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
      {(editing || adding) && <PlanEntryDialog entry={editing} onClose={() => { setEditing(null); setAdding(false); load(); }} />}
    </section>
  );
}

function PlanEntryDialog({ entry, onClose }: { entry: any | null; onClose: () => void }) {
  const [hook, setHook] = useState(entry?.hook ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [format, setFormat] = useState(entry?.format ?? "insight");
  const [status, setStatus] = useState(entry?.status ?? "planned");
  const [date, setDate] = useState(entry?.scheduled_date ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{entry ? "Edit entry" : "New entry"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-xs font-medium">Hook</label><Input value={hook} onChange={(e) => setHook(e.target.value)} /></div>
          <div><label className="text-xs font-medium">Body</label><Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-medium">Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot-take">hot-take</SelectItem>
                  <SelectItem value="story">story</SelectItem>
                  <SelectItem value="framework">framework</SelectItem>
                  <SelectItem value="insight">insight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="ready">Ready to Post</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium">Date</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <Button className="w-full" disabled={!hook || busy} onClick={async () => {
            setBusy(true);
            try {
              if (entry) await updatePlanEntry(entry.id, { hook, body, format, status, scheduled_date: date || null });
              else await createPlanEntry({ hook, body, format, status, scheduled_date: date || undefined });
              toast.success("Saved"); onClose();
            } catch (e: any) { toast.error(e?.message ?? "Failed"); } finally { setBusy(false); }
          }}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ───────── Settings tab ─────────
function SettingsTab() {
  const [s, setS] = useState<any>({
    custom_system_prompt: "",
    banned_words: [],
    preferred_provider: "lovable",
    anthropic_model: "claude-sonnet-4-20250514",
    openai_model: "gpt-5-mini",
    lovable_model: "google/gemini-3-flash-preview",
    default_word_limit: 150,
    voice_notes: "",
  });
  const [bannedInput, setBannedInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getWriterSettings().then((data: any) => {
      if (data) {
        setS({ ...s, ...data });
        setBannedInput((data.banned_words || []).join(", "));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      await upsertWriterSettings({
        ...s,
        banned_words: bannedInput.split(",").map((x) => x.trim()).filter(Boolean),
      });
      toast.success("Settings saved");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); } finally { setBusy(false); }
  };

  return (
    <section className="space-y-6 max-w-3xl">
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-primary" /><h2 className="font-medium">Writer system prompt</h2></div>
        <p className="text-xs text-muted-foreground">Sets the voice for ALL 7 framework writers. The frameworks define structure; this defines persona. Leave blank for the default B2B operator voice.</p>
        <Textarea rows={8} value={s.custom_system_prompt ?? ""} onChange={(e) => setS({ ...s, custom_system_prompt: e.target.value })}
          placeholder="ROLE: You are a B2B LinkedIn copywriter writing in the voice of a marketing automation practitioner. Short, punchy sentences. Zero corporate filler. You sound like a real operator sharing a real insight, not a content machine." />
        <div>
          <label className="text-xs font-medium">Voice notes (appended to every prompt)</label>
          <Textarea rows={3} value={s.voice_notes ?? ""} onChange={(e) => setS({ ...s, voice_notes: e.target.value })} placeholder="e.g. I run a 65-domain cold email infra and build n8n + Supabase dashboards." />
        </div>
        <div>
          <label className="text-xs font-medium">Banned words (comma separated)</label>
          <Input value={bannedInput} onChange={(e) => setBannedInput(e.target.value)} placeholder="leverage, synergy, unleash, game-changer" />
        </div>
        <div>
          <label className="text-xs font-medium">Default word limit</label>
          <Input type="number" min={50} max={300} value={s.default_word_limit ?? 150} onChange={(e) => setS({ ...s, default_word_limit: Number(e.target.value) })} className="max-w-[120px]" />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /><h2 className="font-medium">AI provider</h2></div>
        <p className="text-xs text-muted-foreground">Falls back automatically if the preferred provider fails. Anthropic & OpenAI keys are stored as Supabase secrets.</p>
        <Select value={s.preferred_provider} onValueChange={(v) => setS({ ...s, preferred_provider: v })}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="anthropic">Anthropic Claude (preferred)</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="lovable">Lovable AI (default Gemini)</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><label className="text-xs font-medium">Anthropic model</label><Input value={s.anthropic_model ?? ""} onChange={(e) => setS({ ...s, anthropic_model: e.target.value })} /></div>
          <div><label className="text-xs font-medium">OpenAI model</label><Input value={s.openai_model ?? ""} onChange={(e) => setS({ ...s, openai_model: e.target.value })} /></div>
          <div><label className="text-xs font-medium">Lovable AI model</label><Input value={s.lovable_model ?? ""} onChange={(e) => setS({ ...s, lovable_model: e.target.value })} /></div>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2"><LinkIcon className="w-5 h-5 text-primary" /><h2 className="font-medium">Apify scraping</h2></div>
        <p className="text-xs text-muted-foreground">Token + default actor are stored as Supabase secrets (<code>APIFY_API_TOKEN</code>, <code>APIFY_LINKEDIN_ACTOR_ID</code>). Override the actor per profile in the Profiles tab.</p>
        <Badge variant="secondary">Daily cron at 06:00 UTC for active profiles</Badge>
      </Card>

      <Button onClick={save} disabled={busy} className="w-full md:w-auto">{busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Save settings</Button>
    </section>
  );
}
