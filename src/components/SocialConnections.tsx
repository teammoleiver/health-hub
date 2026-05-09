import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Linkedin, Loader2, CheckCircle2, AlertTriangle, LogOut, Plug } from "lucide-react";
import { toast } from "sonner";
import { listMyConnections, startLinkedInAuth, disconnectLinkedIn, type SocialConnectionMeta } from "@/lib/social-connections";

export default function SocialConnections() {
  const [conns, setConns] = useState<SocialConnectionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try { setConns(await listMyConnections()); }
    catch (e: any) { toast.error(e?.message ?? "Failed to load connections"); }
    finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  const linkedin = conns.find((c) => c.provider === "linkedin");
  const isExpired = linkedin?.expires_at && new Date(linkedin.expires_at).getTime() < Date.now();

  async function connectLinkedIn() {
    setBusy("linkedin");
    try {
      const { authorize_url } = await startLinkedInAuth(window.location.pathname + window.location.search);
      window.location.href = authorize_url;
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start LinkedIn auth");
      setBusy(null);
    }
  }

  async function dropLinkedIn() {
    if (!confirm("Disconnect LinkedIn? You'll need to re-authorize to post directly.")) return;
    setBusy("linkedin");
    try { await disconnectLinkedIn(); toast.success("LinkedIn disconnected"); reload(); }
    catch (e: any) { toast.error(e?.message ?? "Disconnect failed"); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <>
          <Card className="p-4 border-blue-500/30">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <Linkedin className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium">LinkedIn</div>
                  {linkedin ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {isExpired ? <AlertTriangle className="w-3 h-3 text-amber-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      Connected as <span className="text-foreground">{linkedin.display_name ?? linkedin.provider_user_id}</span>
                      {isExpired && <span className="text-amber-300 ml-1">(token expired)</span>}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Not connected. Connect to post directly without Zapier / n8n.
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {linkedin ? (
                  <>
                    {isExpired && (
                      <Button size="sm" onClick={connectLinkedIn} disabled={busy === "linkedin"}>
                        {busy === "linkedin" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plug className="w-3.5 h-3.5 mr-1" />}
                        Reconnect
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={dropLinkedIn} disabled={busy === "linkedin"}>
                      <LogOut className="w-3.5 h-3.5 mr-1" /> Disconnect
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={connectLinkedIn} disabled={busy === "linkedin"}>
                    {busy === "linkedin" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plug className="w-3.5 h-3.5 mr-1" />}
                    Connect LinkedIn
                  </Button>
                )}
              </div>
            </div>
            {linkedin?.scope && (
              <p className="text-[10px] text-muted-foreground mt-3">Scope: <code>{linkedin.scope}</code></p>
            )}
          </Card>

          <Card className="p-4 opacity-60">
            <div className="text-xs text-muted-foreground">
              Facebook, Instagram and X direct connections will appear here once their integrations are wired in.
              For now those platforms still go through your webhook configuration.
            </div>
          </Card>

          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">First-time setup checklist</summary>
            <ol className="mt-2 list-decimal list-inside space-y-1.5 pl-2">
              <li>Create a LinkedIn Developer App at <a className="text-primary underline" href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer">linkedin.com/developers/apps</a>.</li>
              <li>Under <em>Products</em>, request <strong>Sign In with LinkedIn using OpenID Connect</strong> and <strong>Share on LinkedIn</strong>. Both auto-approve.</li>
              <li>Under <em>Auth</em> → <em>Authorized redirect URLs</em>, add <code>{`${window.location.origin}/oauth/linkedin/callback`}</code>.</li>
              <li>Copy <em>Client ID</em> and <em>Client Secret</em>.</li>
              <li>In Supabase → Edge Functions → Secrets, set:
                <ul className="list-disc list-inside pl-4">
                  <li><code>LINKEDIN_CLIENT_ID</code> = your client id</li>
                  <li><code>LINKEDIN_CLIENT_SECRET</code> = your client secret</li>
                  <li><code>LINKEDIN_REDIRECT_URI</code> = <code>{`${window.location.origin}/oauth/linkedin/callback`}</code></li>
                </ul>
              </li>
              <li>Click <em>Connect LinkedIn</em> above.</li>
            </ol>
          </details>
        </>
      )}
    </div>
  );
}
