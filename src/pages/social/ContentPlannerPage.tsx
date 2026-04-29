import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, CalendarDays, Linkedin, Newspaper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { listContentPlan, createPlanEntry, updatePlanEntry, deletePlanEntry, FRAMEWORK_OPTIONS } from "@/lib/social-queries";

const STATUSES = ["planned", "drafting", "ready", "scheduled", "posted"];

function sourceBadge(e: any) {
  if (e.source_post_id || e.source_kind === "linkedin") return { icon: Linkedin, label: "LinkedIn" };
  if (e.source_hotnews_id || e.source_article_id || e.source_kind === "hot_news" || e.source_kind === "article") return { icon: Newspaper, label: "News" };
  if (e.source_topic_id) return { icon: Sparkles, label: "Hot topic" };
  return { icon: CalendarDays, label: "Manual" };
}

export default function ContentPlannerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [show, setShow] = useState(false);

  const load = async () => { setLoading(true); setEntries(await listContentPlan()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = entries.filter((e) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (sourceFilter !== "all") {
      const s = sourceBadge(e).label.toLowerCase();
      if (s !== sourceFilter) return false;
    }
    return true;
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="news">News</SelectItem>
              <SelectItem value="hot topic">Hot topic</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={show} onOpenChange={setShow}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />New entry</Button></DialogTrigger>
          <NewEntryDialog onCreated={() => { setShow(false); load(); }} />
        </Dialog>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} entries</p>

      {loading ? <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> :
        filtered.length === 0 ? <Card className="p-8 text-center text-muted-foreground">No entries match. Generate from LinkedIn posts, Hot News, or add manually.</Card> :
        <div className="space-y-2">
          {filtered.map((e) => {
            const src = sourceBadge(e);
            return (
              <Card key={e.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] inline-flex items-center gap-1"><src.icon className="w-3 h-3" />{src.label}</Badge>
                      {e.framework && <Badge variant="outline" className="text-[10px]">{e.framework}</Badge>}
                      {e.pillar && <span>· {e.pillar}</span>}
                      {e.scheduled_date && <span>· 📅 {e.scheduled_date}</span>}
                    </div>
                    <div className="font-medium text-sm">{e.hook}</div>
                    {e.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{e.body}</p>}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Select value={e.status} onValueChange={async (v) => { await updatePlanEntry(e.id, { status: v }); load(); }}>
                      <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={async () => { if (confirm("Delete entry?")) { await deletePlanEntry(e.id); load(); } }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      }
    </section>
  );
}

function NewEntryDialog({ onCreated }: { onCreated: () => void }) {
  const [hook, setHook] = useState("");
  const [body, setBody] = useState("");
  const [framework, setFramework] = useState("");
  const [scheduled, setScheduled] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New plan entry</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Input placeholder="Hook / headline *" value={hook} onChange={(e) => setHook(e.target.value)} />
        <Textarea rows={6} placeholder="Body (optional)…" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Select value={framework} onValueChange={setFramework}>
            <SelectTrigger><SelectValue placeholder="Framework (optional)" /></SelectTrigger>
            <SelectContent>{FRAMEWORK_OPTIONS.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="date" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
        </div>
        <Button className="w-full" disabled={!hook || busy} onClick={async () => {
          setBusy(true);
          try {
            await createPlanEntry({ hook, body: body || undefined, framework: framework || undefined, scheduled_date: scheduled || undefined, status: "planned" });
            toast.success("Added"); onCreated();
          } catch (e: any) { toast.error(e?.message ?? "Failed"); } finally { setBusy(false); }
        }}>Create</Button>
      </div>
    </DialogContent>
  );
}