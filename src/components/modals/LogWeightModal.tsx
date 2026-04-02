import { useState } from "react";
import { Scale, X } from "lucide-react";
import { motion } from "framer-motion";
import { logWeight } from "@/lib/supabase-queries";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
}

export default function LogWeightModal({ open, onClose, onLogged }: Props) {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const save = async () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w < 30 || w > 300) {
      toast({ title: "Invalid weight", description: "Enter a valid weight in kg", variant: "destructive" });
      return;
    }
    setSaving(true);
    const result = await logWeight(w, {
      waist_cm: waist ? parseFloat(waist) : undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    if (result) {
      const bmi = (w / (1.71 * 1.71)).toFixed(1);
      toast({ title: "Weight logged", description: `${w}kg (BMI: ${bmi})` });
      onLogged();
      onClose();
      setWeight(""); setWaist(""); setNotes("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-xl p-6 max-w-sm w-full shadow-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5" /> Log Weight
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Weight (kg) *</label>
            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="88.0" className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Waist (cm) — optional</label>
            <input type="number" step="0.1" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="92.0" className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes — optional</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Morning, fasted..." className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        <button onClick={save} disabled={saving} className="w-full mt-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition disabled:opacity-50">
          {saving ? "Saving..." : "Log Weight"}
        </button>
      </motion.div>
    </div>
  );
}
