import { useState, useEffect } from "react";
import { User, Key, Globe, Bell, Download, Heart, Check, LogOut, Lock, Loader2 } from "lucide-react";
import { getUserProfile, getProfile, updateProfile } from "@/lib/supabase-queries";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import syncvidaLogo from "@/assets/syncvida-icon.png";
import ApiKeyModal from "@/components/modals/ApiKeyModal";
import { useToast } from "@/hooks/use-toast";

export default function SettingsModule() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [apiKeyModal, setApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [changingPw, setChangingPw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    getUserProfile().then((p) => {
      if (p?.openai_api_key) setHasApiKey(true);
    });
    getProfile().then(setProfile);
  }, []);

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast({ title: "Password updated!" });
      setNewPw("");
      setChangingPw(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Settings</h1>

      {/* Profile */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary text-2xl font-bold text-primary">
            {(profile?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">{profile?.name || "User"}</h3>
            <p className="text-xs text-muted-foreground">{profile?.full_name || ""}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Account Management */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <h3 className="font-display font-semibold text-foreground">Account</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">Change your account password</p>
            </div>
          </div>
          <button
            onClick={() => setChangingPw(!changingPw)}
            className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent transition font-medium"
          >
            {changingPw ? "Cancel" : "Change"}
          </button>
        </div>
        {changingPw && (
          <div className="flex gap-2 ml-12">
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleChangePassword}
              disabled={pwLoading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
            >
              {pwLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Save
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Sign Out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Settings Groups */}
      {[
        {
          icon: Key,
          title: "OpenAI API Key",
          desc: hasApiKey ? "Connected — Syncvida AI is ready" : "Required for Syncvida AI Assistant",
          action: hasApiKey ? "Connected" : "Configure",
          badge: hasApiKey,
          onClick: () => setApiKeyModal(true),
        },
        {
          icon: Heart,
          title: "Fasting Protocol",
          desc: "Manage in Fasting module",
          action: "Manage",
          onClick: () => window.location.href = "/fasting",
        },
        {
          icon: Globe,
          title: "Language",
          desc: "English / Spanish",
          action: "English",
        },
        {
          icon: Bell,
          title: "Notifications",
          desc: "Reminders for water, meals, fasting windows",
          action: "Configure",
        },
        {
          icon: Download,
          title: "Data Export",
          desc: "Export your health data as CSV or PDF",
          action: "Export",
        },
      ].map((item) => (
        <div key={item.title} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <item.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                {"badge" in item && item.badge && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
          <button
            onClick={"onClick" in item ? item.onClick : undefined}
            className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent transition font-medium"
          >
            {item.action}
          </button>
        </div>
      ))}

      <ApiKeyModal open={apiKeyModal} onClose={() => { setApiKeyModal(false); getUserProfile().then((p) => setHasApiKey(!!p?.openai_api_key)); }} />
    </div>
  );
}
