import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, Folder, Megaphone, Library, ClipboardList, Plus, Trash2, Loader2, Heart, FolderKanban, User as UserIcon, Webhook, Linkedin, Facebook, Instagram, Twitter, Youtube, Save } from "lucide-react";
import { Link } from "react-router-dom";
import {
  listContentCategories, createContentCategory,
  updateContentCategory, deleteContentCategory, listContentItems,
  listWebhookSettings, upsertWebhookSetting, PLANNER_PLATFORMS,
} from "@/lib/social-queries";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import SocialMediaModule from "./SocialMediaModule";

type Cat = { id: string; name: string; slug: string; color?: string };
type Item = { id: string; category_id: string | null };

export default function AdminPanel() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Centralized settings for every module in Syncvida.</p>
        </div>
      </header>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="content"><Library className="w-4 h-4 mr-1.5" />Content</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="w-4 h-4 mr-1.5" />Webhooks</TabsTrigger>
          <TabsTrigger value="social"><Megaphone className="w-4 h-4 mr-1.5" />Social Studio</TabsTrigger>
          <TabsTrigger value="planner"><ClipboardList className="w-4 h-4 mr-1.5" />Content Planner</TabsTrigger>
          <TabsTrigger value="health"><Heart className="w-4 h-4 mr-1.5" />Health</TabsTrigger>
          <TabsTrigger value="productivity"><FolderKanban className="w-4 h-4 mr-1.5" />Productivity</TabsTrigger>
          <TabsTrigger value="general"><UserIcon className="w-4 h-4 mr-1.5" />General</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Folder className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold">Content categories</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Shared across Content Studio, Content Planner, and Social Studio. Rename, add, or remove categories — changes propagate to every linked item.</p>
            <CategoriesAdmin />
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Webhook className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold">Posting webhooks</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Configure one webhook URL per platform. When a Content Planner post is scheduled and its time arrives,
              we POST the JSON template (rendered with <code>{`{{hook}}`}</code>, <code>{`{{body}}`}</code>, <code>{`{{image_url}}`}</code>,
              <code>{`{{scheduled_at}}`}</code>, <code>{`{{plan_id}}`}</code>, <code>{`{{platform}}`}</code>) to that URL — works with Zapier, n8n, Make, or any HTTP endpoint.
            </p>
            <WebhooksAdmin />
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="p-2 md:p-4">
            <SocialMediaModule defaultTab="settings" hideHeader />
          </Card>
        </TabsContent>

        <TabsContent value="planner">
          <Card className="p-5 space-y-2">
            <h2 className="font-display font-semibold">Content Planner settings</h2>
            <p className="text-sm text-muted-foreground">Planner uses the shared content categories above. Additional planner-specific settings (default cadence, weekly view start day, etc.) will appear here.</p>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <ModuleSettingsPlaceholder
            title="Health modules"
            description="Manage settings for Nutrition, Fasting, Exercise, Sleep, Records and Body."
            links={[
              { to: "/nutrition", label: "Nutrition" },
              { to: "/fasting", label: "Fasting" },
              { to: "/exercise", label: "Exercise" },
              { to: "/sleep", label: "Sleep" },
              { to: "/health", label: "Records" },
              { to: "/body", label: "Body" },
            ]}
          />
        </TabsContent>

        <TabsContent value="productivity">
          <ModuleSettingsPlaceholder
            title="Productivity modules"
            description="Manage Projects, Tasks, Calendar and Goals."
            links={[
              { to: "/projects", label: "Projects" },
              { to: "/tasks", label: "Tasks" },
              { to: "/calendar", label: "Calendar" },
              { to: "/goals", label: "Goals" },
            ]}
          />
        </TabsContent>

        <TabsContent value="general">
          <Card className="p-5 space-y-3">
            <h2 className="font-display font-semibold">General</h2>
            <p className="text-sm text-muted-foreground">Personal account preferences (name, avatar, password, language, API keys) live in your <Link to="/settings" className="text-primary underline">Profile</Link> page.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModuleSettingsPlaceholder({ title, description, links }: { title: string; description: string; links: { to: string; label: string }[] }) {
  return (
    <Card className="p-5 space-y-3">
      <h2 className="font-display font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <p className="text-xs text-muted-foreground">Per-module admin settings will be added here. For now, jump directly to a module:</p>
      <div className="flex flex-wrap gap-2 pt-1">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent transition font-medium">{l.label}</Link>
        ))}
      </div>
    </Card>
  );
}

function CategoriesAdmin() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [c, i] = await Promise.all([listContentCategories(), listContentItems({})]);
    setCats(c as Cat[]);
    setItems(i as Item[]);
    setEdits(Object.fromEntries((c as Cat[]).map((x) => [x.id, x.name])));
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function rename(id: string) {
    const name = edits[id]?.trim();
    if (!name) return;
    setBusy(id);
    try { await updateContentCategory(id, { name }); toast.success("Category renamed"); await refresh(); }
    catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setBusy(null); }
  }
  async function remove(id: string) {
    const count = items.filter((i) => i.category_id === id).length;
    if (!confirm(`Delete this category? ${count} item(s) will become uncategorized.`)) return;
    setBusy(id);
    try { await deleteContentCategory(id); toast.success("Category deleted"); await refresh(); }
    catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setBusy(null); }
  }
  async function add() {
    if (!newName.trim()) return;
    setBusy("__new");
    try { await createContentCategory({ name: newName.trim() }); setNewName(""); toast.success("Category added"); await refresh(); }
    catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setBusy(null); }
  }

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading categories…</div>;

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {cats.length === 0 && <p className="text-sm text-muted-foreground">No categories yet. Add one below.</p>}
        {cats.map((c) => {
          const count = items.filter((i) => i.category_id === c.id).length;
          const dirty = (edits[c.id] ?? c.name) !== c.name;
          return (
            <div key={c.id} className="flex items-center gap-2">
              <Input value={edits[c.id] ?? c.name} onChange={(e) => setEdits({ ...edits, [c.id]: e.target.value })} />
              <span className="text-xs text-muted-foreground w-16 text-right">{count} item{count === 1 ? "" : "s"}</span>
              <Button size="sm" variant="outline" disabled={busy === c.id || !dirty} onClick={() => rename(c.id)}>Save</Button>
              <Button size="sm" variant="ghost" disabled={busy === c.id} onClick={() => remove(c.id)} aria-label="Delete category">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border pt-3 space-y-2">
        <Label className="text-xs">Add new category</Label>
        <div className="flex gap-2">
          <Input placeholder="e.g. Outbound Mastery" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={add} disabled={!newName.trim() || busy === "__new"}><Plus className="w-4 h-4" /> Add</Button>
        </div>
      </div>
    </div>
  );
}