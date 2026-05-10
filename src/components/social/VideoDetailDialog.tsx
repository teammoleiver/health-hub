import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, FileText, Sparkles, Plus, RefreshCw, Check, ChevronDown, ChevronUp, Copy, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  fetchVideoTranscript, generateVideoIdeas, getVideoDetail, addIdeaToPlanner,
  type YouTubeVideo, type VideoIdea,
} from "@/lib/youtube-queries";

type SourceVideo = { video_id: string; title: string; channel: string };

export default function VideoDetailDialog({
  open, onClose, video, channelTitle, onTranscriptFetched,
}: {
  open: boolean;
  onClose: () => void;
  video: YouTubeVideo | null;
  channelTitle: string;
  onTranscriptFetched?: (videoId: string) => void;
}) {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptFetchedAt, setTranscriptFetchedAt] = useState<string | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const [ideas, setIdeas] = useState<VideoIdea[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [source, setSource] = useState<SourceVideo | null>(null);
  const [transcriptDebug, setTranscriptDebug] = useState<any>(null);

  // Reset and load existing transcript when video changes
  useEffect(() => {
    if (!open || !video) return;
    setTranscript(null);
    setTranscriptFetchedAt(null);
    setIdeas(null);
    setSavedIds(new Set());
    setTranscriptOpen(false);
    setSource({
      video_id: video.video_id,
      title: video.title,
      channel: channelTitle || video.channel_id,
    });
    void getVideoDetail(video.video_id).then((d) => {
      if (d?.transcript) {
        setTranscript(d.transcript);
        setTranscriptFetchedAt((d as any).transcript_fetched_at ?? null);
      }
    }).catch(() => { /* ignore */ });
  }, [open, video?.video_id, channelTitle]);

  if (!video) return null;

  const ytUrl = `https://www.youtube.com/watch?v=${video.video_id}`;

  async function getTranscript(refresh = false) {
    if (!video) return;
    setLoadingTranscript(true);
    setTranscriptDebug(null);
    try {
      const r = await fetchVideoTranscript(video.video_id, refresh);
      setTranscript(r.transcript);
      setTranscriptFetchedAt(new Date().toISOString());
      setTranscriptOpen(true);
      onTranscriptFetched?.(video.video_id);
      toast.success(r.cached ? "Loaded cached transcript" : "Transcript fetched");
    } catch (e: any) {
      toast.error(e?.message ?? "Transcript failed");
      if (e?.debug) setTranscriptDebug(e.debug);
    } finally { setLoadingTranscript(false); }
  }

  async function genIdeas() {
    if (!video) return;
    setGenerating(true);
    try {
      const r = await generateVideoIdeas(video.video_id, 7);
      setIdeas(r.ideas);
      setSource(r.source_video);
      setSavedIds(new Set());
      toast.success(`${r.ideas.length} ideas generated`);
    } catch (e: any) {
      toast.error(e?.message ?? "Ideas failed");
    } finally { setGenerating(false); }
  }

  async function saveIdea(i: number) {
    if (!ideas || !source) return;
    setSavingIdx(i);
    try {
      await addIdeaToPlanner(ideas[i], source);
      setSavedIds((cur) => new Set(cur).add(i));
      toast.success("Added to Content Planner");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally { setSavingIdx(null); }
  }

  async function saveAll() {
    if (!ideas || !source) return;
    setSavingIdx(-1);
    let saved = 0;
    try {
      for (let i = 0; i < ideas.length; i++) {
        if (savedIds.has(i)) continue;
        try {
          await addIdeaToPlanner(ideas[i], source);
          setSavedIds((cur) => new Set(cur).add(i));
          saved++;
        } catch { /* continue */ }
      }
      toast.success(`Added ${saved} idea${saved === 1 ? "" : "s"} to planner`);
    } finally { setSavingIdx(null); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2 pr-6">
            <span className="line-clamp-2 text-base">{video.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a href={ytUrl} target="_blank" rel="noreferrer" className="sm:col-span-1 block">
              {video.thumbnail_url ? (
                <img src={video.thumbnail_url} alt="" className="w-full aspect-video object-cover rounded-md" />
              ) : (
                <div className="w-full aspect-video bg-muted rounded-md" />
              )}
            </a>
            <div className="sm:col-span-2 space-y-2 text-sm">
              <div className="text-muted-foreground">
                {channelTitle || video.channel_id}
                {video.published_at ? ` · ${new Date(video.published_at).toLocaleDateString()}` : ""}
              </div>
              {video.description && (
                <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{video.description}</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" asChild>
                  <a href={ytUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5 mr-1" /> Watch on YouTube</a>
                </Button>
                <Button size="sm" onClick={() => getTranscript(false)} disabled={loadingTranscript}>
                  {loadingTranscript ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1" />}
                  {transcript ? "View transcript" : "Get transcript"}
                </Button>
                <Button size="sm" variant="outline" onClick={genIdeas} disabled={generating}>
                  {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                  Generate ideas
                </Button>
              </div>
            </div>
          </div>

          {/* Transcript debug (when actor returned items but parser couldn't extract) */}
          {transcriptDebug && (
            <Card className="p-3 border-destructive/40 bg-destructive/5">
              <div className="text-xs font-medium text-destructive mb-1">Actor ran but no transcript text was found</div>
              <p className="text-[11px] text-muted-foreground mb-2">
                Copy this and paste it back to me — I'll teach the parser this actor's output shape.
              </p>
              <pre className="text-[10px] bg-background/50 p-2 rounded border border-border overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(transcriptDebug, null, 2)}
              </pre>
            </Card>
          )}

          {/* Transcript */}
          {transcript && (
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button onClick={() => setTranscriptOpen((v) => !v)} className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="w-4 h-4 text-primary" />
                  Transcript
                  {transcriptOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{readingMinutes(transcript)} min read · {wordCount(transcript).toLocaleString()} words</span>
                  {transcriptFetchedAt && <span>fetched {timeAgo(transcriptFetchedAt)}</span>}
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(transcript)} title="Copy">
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => getTranscript(true)} disabled={loadingTranscript} title="Re-fetch">
                    {loadingTranscript ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              {transcriptOpen && (
                <div className="mt-3 max-h-[28rem] overflow-y-auto pr-2 -mr-1">
                  <article className="prose-sm max-w-prose text-sm leading-7 text-foreground/90 space-y-3">
                    {formatTranscript(transcript).map((para, i) => (
                      <p key={i} className="m-0">{para}</p>
                    ))}
                  </article>
                </div>
              )}
            </Card>
          )}

          {/* Ideas */}
          {ideas && ideas.length > 0 && (
            <Card className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-sm">Content ideas based on this video</h3>
                  <Badge variant="secondary" className="text-[10px]">{ideas.length}</Badge>
                </div>
                <Button size="sm" variant="outline" onClick={saveAll} disabled={savingIdx !== null || savedIds.size === ideas.length}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add all to planner
                </Button>
              </div>
              <div className="space-y-2">
                {ideas.map((it, i) => {
                  const saved = savedIds.has(i);
                  return (
                    <div key={i} className="rounded-md border border-border p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{it.hook}</div>
                          {it.body && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{it.body}</p>}
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">{it.format}</Badge>
                            {it.angle && <span className="text-[10px] text-muted-foreground italic line-clamp-1">{it.angle}</span>}
                          </div>
                        </div>
                        <Button size="sm" variant={saved ? "secondary" : "outline"} onClick={() => saveIdea(i)} disabled={saved || savingIdx === i}>
                          {savingIdx === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5 text-primary" /> : <Plus className="w-3.5 h-3.5" />}
                          {saved ? " Saved" : " Add"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

/**
 * Break a flat transcript blob into readable paragraphs. Apify transcripts
 * arrive as one wall of text; we split on sentence boundaries and group ~4
 * sentences per paragraph, while collapsing speech disfluencies.
 */
function formatTranscript(raw: string): string[] {
  const cleaned = raw
    // Collapse common filler patterns: " uh, " " um, " " you know, "
    .replace(/\s+(uh|um|er|ah|hmm)[,.\s]/gi, " ")
    // Drop double spaces
    .replace(/\s+/g, " ")
    .trim();
  // Split on sentence terminators while keeping them attached.
  const sentences = cleaned.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [cleaned];
  const SENTENCES_PER_PARA = 4;
  const paras: string[] = [];
  for (let i = 0; i < sentences.length; i += SENTENCES_PER_PARA) {
    paras.push(sentences.slice(i, i + SENTENCES_PER_PARA).join(" "));
  }
  return paras.filter((p) => p.length > 0);
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function readingMinutes(s: string): number {
  return Math.max(1, Math.round(wordCount(s) / 220));
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    const { toast } = await import("sonner");
    toast.success("Transcript copied");
  } catch { /* no-op */ }
}
