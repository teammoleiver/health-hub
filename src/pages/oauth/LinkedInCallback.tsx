import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Linkedin } from "lucide-react";
import { exchangeLinkedInCode } from "@/lib/social-connections";
import { toast } from "sonner";

export default function LinkedInCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"working" | "ok" | "error">("working");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const linkedinError = params.get("error");
    const linkedinErrDesc = params.get("error_description");

    if (linkedinError) {
      setPhase("error");
      setErrorMsg(linkedinErrDesc ?? linkedinError);
      return;
    }
    if (!code || !state) {
      setPhase("error");
      setErrorMsg("Missing code or state from LinkedIn redirect.");
      return;
    }

    (async () => {
      try {
        const r = await exchangeLinkedInCode(code, state);
        setProfile({ display_name: r.display_name, avatar_url: r.avatar_url });
        setPhase("ok");
        toast.success(`Connected as ${r.display_name ?? "LinkedIn user"}`);
        setTimeout(() => navigate(r.redirect_to || "/admin?tab=connections", { replace: true }), 1500);
      } catch (e: any) {
        setPhase("error");
        setErrorMsg(e?.message ?? "Failed to complete LinkedIn connection.");
      }
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Linkedin className="w-6 h-6 text-blue-500" />
          <h1 className="font-display text-lg font-semibold">LinkedIn connection</h1>
        </div>
        {phase === "working" && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Completing LinkedIn authorization…
          </div>
        )}
        {phase === "ok" && profile && (
          <div className="flex items-center gap-3">
            {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full" />}
            <div className="flex-1">
              <div className="text-sm font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Connected as {profile.display_name ?? "LinkedIn user"}
              </div>
              <div className="text-xs text-muted-foreground">Redirecting back to settings…</div>
            </div>
          </div>
        )}
        {phase === "error" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium">LinkedIn connection failed</div>
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
