import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Linkedin, Loader2, CheckCircle2, AlertTriangle, LogOut, Plug, Palette, Facebook, Instagram } from "lucide-react";
import { toast } from "sonner";
import { listMyConnections, startLinkedInAuth, disconnectLinkedIn, startCanvaAuth, disconnectCanva, startMetaAuth, disconnectMeta, type SocialConnectionMeta } from "@/lib/social-connections";

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
  const canva = conns.find((c) => c.provider === "canva");
  const canvaExpired = canva?.expires_at && new Date(canva.expires_at).getTime() < Date.now();
  const meta = conns.find((c) => (c.provider as any) === "meta");
  const metaExpired = meta?.expires_at && new Date(meta.expires_at).getTime() < Date.now();

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

  async function connectCanva() {
    setBusy("canva");
    try {
      const { authorize_url } = await startCanvaAuth(window.location.pathname + window.location.search);
      window.location.href = authorize_url;
    } catch (e: any) { toast.error(e?.message ?? "Could not start Canva auth"); setBusy(null); }
  }
  async function dropCanva() {
    if (!confirm("Disconnect Canva?")) return;
    setBusy("canva");
    try { await disconnectCanva(); toast.success("Canva disconnected"); reload(); }
    catch (e: any) { toast.error(e?.message ?? "Disconnect failed"); }
    finally { setBusy(null); }
  }

  async function connectMeta() {
    setBusy("meta");
    try {
      const { authorize_url } = await startMetaAuth(window.location.pathname + window.location.search);
      window.location.href = authorize_url;
    } catch (e: any) { toast.error(e?.message ?? "Could not start Meta auth"); setBusy(null); }
  }
  async function dropMeta() {
    if (!confirm("Disconnect Facebook & Instagram?")) return;
    setBusy("meta");
    try { await disconnectMeta(); toast.success("Meta disconnected"); reload(); }
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

          <Card className="p-4 border-purple-500/30">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-purple-500/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <div className="font-medium">Canva</div>
                  {canva ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {canvaExpired ? <AlertTriangle className="w-3 h-3 text-amber-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      Connected as <span className="text-foreground">{canva.display_name ?? canva.email ?? canva.provider_user_id}</span>
                      {canvaExpired && <span className="text-amber-300 ml-1">(token expired)</span>}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Not connected. Connect to design directly in Canva and pull the result into your posts.
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {canva ? (
                  <>
                    {canvaExpired && (
                      <Button size="sm" onClick={connectCanva} disabled={busy === "canva"}>
                        {busy === "canva" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plug className="w-3.5 h-3.5 mr-1" />}
                        Reconnect
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={dropCanva} disabled={busy === "canva"}>
                      <LogOut className="w-3.5 h-3.5 mr-1" /> Disconnect
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={connectCanva} disabled={busy === "canva"}>
                    {busy === "canva" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plug className="w-3.5 h-3.5 mr-1" />}
                    Connect Canva
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4 border-blue-500/30">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center relative">
                  <Facebook className="w-5 h-5 text-blue-500" />
                  <Instagram className="w-3 h-3 text-pink-500 absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-px" />
                </div>
                <div>
                  <div className="font-medium">Facebook & Instagram</div>
                  {meta ? (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {metaExpired ? <AlertTriangle className="w-3 h-3 text-amber-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        Connected as <span className="text-foreground">{meta.display_name ?? meta.email ?? meta.provider_user_id}</span>
                        {metaExpired && <span className="text-amber-300 ml-1">(token expired)</span>}
                      </div>
                      <div className="ml-4">
                        Page: <span className="text-foreground">{(meta as any).raw_profile?.primary_page?.name ?? "—"}</span>
                        {(meta as any).raw_profile?.primary_ig?.username && (
                          <> · IG: <span className="text-foreground">@{(meta as any).raw_profile.primary_ig.username}</span></>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Not connected. Posts to your Facebook Page and Instagram Business account directly.
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {meta ? (
                  <>
                    {metaExpired && (
                      <Button size="sm" onClick={connectMeta} disabled={busy === "meta"}>
                        {busy === "meta" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plug className="w-3.5 h-3.5 mr-1" />}
                        Reconnect
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={dropMeta} disabled={busy === "meta"}>
                      <LogOut className="w-3.5 h-3.5 mr-1" /> Disconnect
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={connectMeta} disabled={busy === "meta"}>
                    {busy === "meta" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plug className="w-3.5 h-3.5 mr-1" />}
                    Connect Facebook & Instagram
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4 opacity-60">
            <div className="text-xs text-muted-foreground">
              X (Twitter) direct connection coming next. For now those posts still go through your webhook configuration.
            </div>
          </Card>

          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">LinkedIn — first-time setup checklist</summary>
            <ol className="mt-2 list-decimal list-inside space-y-1.5 pl-2">
              <li>Create a LinkedIn Developer App at <a className="text-primary underline" href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer">linkedin.com/developers/apps</a>.</li>
              <li>Under <em>Products</em>, request <strong>Sign In with LinkedIn using OpenID Connect</strong> and <strong>Share on LinkedIn</strong>. Both auto-approve.</li>
              <li>Under <em>Auth</em> → <em>Authorized redirect URLs</em>, add <code>{`${window.location.origin}/oauth/linkedin/callback`}</code>.</li>
              <li>Copy <em>Client ID</em> and <em>Client Secret</em>.</li>
              <li>In Supabase → Edge Functions → Secrets, set:
                <ul className="list-disc list-inside pl-4">
                  <li><code>LINKEDIN_CLIENT_ID</code></li>
                  <li><code>LINKEDIN_CLIENT_SECRET</code></li>
                  <li><code>LINKEDIN_REDIRECT_URI</code> = <code>{`${window.location.origin}/oauth/linkedin/callback`}</code></li>
                </ul>
              </li>
              <li>Click <em>Connect LinkedIn</em> above.</li>
            </ol>
          </details>

          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">Facebook & Instagram — first-time setup checklist</summary>
            <ol className="mt-2 list-decimal list-inside space-y-1.5 pl-2">
              <li>Create a Meta Developer App at <a className="text-primary underline" href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">developers.facebook.com/apps</a> → choose <strong>Business</strong> use case.</li>
              <li>Add the <strong>Facebook Login for Business</strong> product. Under <em>Settings → Quickstart</em>, set the redirect URL: <code>http://127.0.0.1:8080/oauth/meta/callback</code></li>
              <li>Add the <strong>Instagram Graph API</strong> product (free).</li>
              <li>Make sure your Instagram is a <strong>Business or Creator</strong> account (IG app → Settings → Account → Switch to Professional).</li>
              <li>In your Facebook Page settings, link the Instagram account (Page → Settings → Linked accounts → Instagram).</li>
              <li>In the Meta App → Settings → Basic, copy <em>App ID</em> and <em>App Secret</em>.</li>
              <li>In Supabase → Edge Functions → Secrets, set:
                <ul className="list-disc list-inside pl-4">
                  <li><code>META_CLIENT_ID</code> = App ID</li>
                  <li><code>META_CLIENT_SECRET</code> = App Secret</li>
                  <li><code>META_REDIRECT_URI</code> = <code>http://127.0.0.1:8080/oauth/meta/callback</code></li>
                </ul>
              </li>
              <li>While the app is in <strong>Development mode</strong>, only Admins/Developers/Testers can use it. Add yourself as an Admin under <em>App Roles</em>. This is fine for personal use.</li>
              <li>Click <em>Connect Facebook & Instagram</em> above.</li>
            </ol>
            <p className="mt-2 text-[10px]">Note: Facebook personal profiles cannot be posted to via API (Meta removed that permission in 2018). This connection posts to your Facebook <strong>Page</strong> and Instagram <strong>Business/Creator</strong> account.</p>
          </details>

          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">Canva — first-time setup checklist</summary>
            <ol className="mt-2 list-decimal list-inside space-y-1.5 pl-2">
              <li>Sign up at <a className="text-primary underline" href="https://www.canva.com/developers/" target="_blank" rel="noreferrer">canva.com/developers</a> (free).</li>
              <li>Create a new <strong>Integration</strong> at <a className="text-primary underline" href="https://www.canva.com/developers/integrations" target="_blank" rel="noreferrer">canva.com/developers/integrations</a>. Choose <em>Public</em> integration type.</li>
              <li>Under <em>Authentication</em>, add <strong>Authorized redirect URL</strong>: <code>{`${window.location.origin}/oauth/canva/callback`}</code>.</li>
              <li>Under <em>Scopes</em>, request:
                <ul className="list-disc list-inside pl-4 text-[10px]">
                  <li><code>profile:read</code></li>
                  <li><code>design:meta:read</code>, <code>design:content:read</code>, <code>design:content:write</code></li>
                  <li><code>asset:read</code>, <code>asset:write</code></li>
                  <li><code>brandtemplate:meta:read</code>, <code>brandtemplate:content:read</code></li>
                  <li><code>folder:read</code></li>
                </ul>
              </li>
              <li>Copy <em>Client ID</em> and <em>Client Secret</em> from the integration's auth page.</li>
              <li>In Supabase → Edge Functions → Secrets, set:
                <ul className="list-disc list-inside pl-4">
                  <li><code>CANVA_CLIENT_ID</code></li>
                  <li><code>CANVA_CLIENT_SECRET</code></li>
                  <li><code>CANVA_REDIRECT_URI</code> = <code>{`${window.location.origin}/oauth/canva/callback`}</code></li>
                </ul>
              </li>
              <li>Click <em>Connect Canva</em> above.</li>
            </ol>
          </details>
        </>
      )}
    </div>
  );
}
