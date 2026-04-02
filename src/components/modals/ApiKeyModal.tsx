import { useState, useEffect } from "react";
import { Key, X, Check } from "lucide-react";
import { motion } from "framer-motion";
import { getUserProfile, updateUserProfile } from "@/lib/supabase-queries";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ open, onClose }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [existingKey, setExistingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      getUserProfile().then((p) => {
        if (p?.openai_api_key) setExistingKey(p.openai_api_key);
      });
    }
  }, [open]);

  if (!open) return null;

  const maskedKey = existingKey ? `sk-...${existingKey.slice(-4)}` : null;

  const save = async () => {
    if (!apiKey.trim() || !apiKey.startsWith("sk-")) {
      toast({ title: "Invalid API key", description: "Key should start with sk-", variant: "destructive" });
      return;
    }
    setSaving(true);
    await updateUserProfile({ openai_api_key: apiKey });
    setSaving(false);
    setExistingKey(apiKey);
    setApiKey("");
    toast({ title: "API key saved", description: "Your OpenAI key has been stored securely." });
  };

  const remove = async () => {
    setSaving(true);
    await updateUserProfile({ openai_api_key: null });
    setSaving(false);
    setExistingKey(null);
    toast({ title: "API key removed" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-xl p-6 max-w-sm w-full shadow-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" /> OpenAI API Key
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {maskedKey ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
              <Check className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">Connected: <code className="text-xs">{maskedKey}</code></span>
            </div>
            <p className="text-xs text-muted-foreground">The AI Health Assistant will use this key for personalized health analysis.</p>
            <div className="flex gap-2">
              <button onClick={remove} disabled={saving} className="flex-1 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition">Remove</button>
              <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-accent transition">Close</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Enter your OpenAI API key to enable the AI Health Assistant. Your key is stored in Supabase and never shared.</p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[10px] text-muted-foreground">Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-primary hover:underline">platform.openai.com</a></p>
            <button onClick={save} disabled={saving || !apiKey} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition disabled:opacity-50">
              {saving ? "Saving..." : "Save API Key"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
