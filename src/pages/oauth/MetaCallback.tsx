import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Facebook } from "lucide-react";
import { exchangeMetaCode } from "@/lib/social-connections";
import { toast } from "sonner";

export default function MetaCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"working" | "ok" | "error">("working");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ display_name: string | null; page_name: string | null; ig_username: string | null } | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const err = params.get("error");
    const errDesc = params.get("error_description") ?? params.get("error_message");

    if (err) { setPhase("error"); setErrorMsg(errDesc ?? err); return; }
    if (!code || !state) { setPhase("error"); setErrorMsg("Missing code or state from Meta redirect."); return; }

    (async () => {
      try {
        const r = await exchangeMetaCode(code, state);
        setProfile({ display_name: r.display_name, page_name: r.page_name, ig_username: r.ig_username });
        setPhase("ok");
        toast.success(`Meta connected — Page: ${r.page_name ?? "—"}${r.ig_username ? `, IG: @${r.ig_username}` : ""}`);
        setTimeout(() => navigate(r.redirect_to || "/admin?tab=connections", { replace: true }), 2000);
      } catch (e: any) {
        setPhase("error");
        setErrorMsg(e?.message ?? "Failed to complete Meta connection.");
      }
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Facebook className="w-6 h-6 text-blue-500" />
          <h1 className="font-display text-lg font-semibold">Facebook & Instagram connection</h1>
        </div>
        {phase === "working" && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Completing Meta authorization, finding your Page and Instagram…
          </div>
        )}
        {phase === "ok" && profile && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Connected as <span className="font-medium">{profile.display_name ?? "Meta user"}</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5 ml-6">
              <div>Facebook Page: <span className="text-foreground">{profile.page_name ?? "—"}</span></div>
              <div>Instagram: <span className="text-foreground">{profile.ig_username ? `@${profile.ig_username}` : "(not linked to this Page)"}</span></div>
            </div>
            <div className="text-xs text-muted-foreground">Redirecting back…</div>
          </div>
        )}
        {phase === "error" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium">Meta connection failed</div>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{errorMsg}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin?tab=connections")}>
              Back to settings
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
