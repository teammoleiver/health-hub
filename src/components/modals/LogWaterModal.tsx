import { useState } from "react";
import { Droplets, X, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { upsertWaterLog } from "@/lib/supabase-queries";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  currentGlasses: number;
  onUpdated: (glasses: number) => void;
}

export default function LogWaterModal({ open, onClose, currentGlasses, onUpdated }: Props) {
  const [glasses, setGlasses] = useState(currentGlasses);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const save = async () => {
    setSaving(true);
    const result = await upsertWaterLog(glasses);
    setSaving(false);
    if (result) {
      onUpdated(glasses);
      toast({ title: "Water logged", description: `${glasses} glasses (${glasses * 250}ml) recorded` });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-xl p-6 max-w-sm w-full shadow-xl border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" /> Log Water
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <button onClick={() => setGlasses(Math.max(0, glasses - 1))} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition">
            <Minus className="w-4 h-4" />
          </button>
          <div className="text-center">
            <div className="text-4xl font-display font-bold text-foreground">{glasses}</div>
            <div className="text-xs text-muted-foreground">/ 12 glasses</div>
          </div>
          <button onClick={() => setGlasses(Math.min(20, glasses + 1))} className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center hover:bg-blue-500/30 transition">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-6 gap-2 mb-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setGlasses(i + 1)}
              className={`aspect-square rounded-lg flex items-center justify-center transition ${
                i < glasses
                  ? "bg-blue-500/20 text-blue-500 border border-blue-500/30"
                  : "bg-secondary text-muted-foreground border border-transparent"
              }`}
            >
              <Droplets className="w-4 h-4" />
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mb-4">{glasses * 250}ml of 3,000ml goal</p>

        <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </motion.div>
    </div>
  );
}
