import { useState } from "react";
import { Scale, X, Sun, Sunset, Moon, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { logWeight } from "@/lib/supabase-queries";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
}

const timeSlots = [
  { id: "morning", label: "Morning", icon: Sun, desc: "Fasted, after waking", color: "text-warning" },
  { id: "midday", label: "Midday", icon: Clock, desc: "Before or after lunch", color: "text-blue-400" },
  { id: "evening", label: "Evening", icon: Sunset, desc: "End of day", color: "text-orange-400" },
  { id: "night", label: "Night", icon: Moon, desc: "Before bed", color: "text-indigo-400" },
] as const;

type TimeSlot = typeof timeSlots[number]["id"];

function getDefaultTimeSlot(): TimeSlot {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 15) return "midday";
  if (h < 20) return "evening";
  return "night";
}

export default function LogWeightModal({ open, onClose, onLogged }: Props) {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [notes, setNotes] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<TimeSlot>(getDefaultTimeSlot());
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const save = async () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w < 30 || w > 300) {
      toast({ title: "Invalid weight", description: "Enter a valid weight in kg", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Build the logged_at timestamp based on time of day selection
    const now = new Date();
    const timeHours: Record<TimeSlot, number> = { morning: 8, midday: 13, evening: 18, night: 22 };
    const logDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), timeHours[timeOfDay], 0, 0);

    const slot = timeSlots.find((s) => s.id === timeOfDay);
    const fullNotes = [slot?.label, notes].filter(Boolean).join(" — ");

    const result = await logWeight(w, {
      waist_cm: waist ? parseFloat(waist) : undefined,
      notes: fullNotes || undefined,
    }, logDate.toISOString());
    setSaving(false);
    if (result) {
      const bmi = (w / (1.71 * 1.71)).toFixed(1);
      toast({ title: "Weight logged", description: `${w}kg (BMI: ${bmi}) — ${slot?.label}` });
      onLogged();
      onClose();
      setWeight(""); setWaist(""); setNotes("");
      setTimeOfDay(getDefaultTimeSlot());
    }
  };

  const bmiPreview = weight ? (parseFloat(weight) / (1.71 * 1.71)).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-xl p-6 max-w-sm w-full shadow-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5" /> Log Weight
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          {/* Weight input + BMI preview */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Weight (kg) *</label>
            <input
              type="number" step="0.1" value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="88.0"
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {bmiPreview && !isNaN(parseFloat(bmiPreview)) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 flex items-center gap-2"
              >
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  parseFloat(bmiPreview) >= 30 ? "bg-destructive/10 text-destructive" :
                  parseFloat(bmiPreview) >= 25 ? "bg-warning/10 text-warning" :
                  "bg-success/10 text-success"
                }`}>
                  BMI {bmiPreview}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {parseFloat(bmiPreview) >= 30 ? "Obese" : parseFloat(bmiPreview) >= 25 ? "Overweight" : "Normal"}
                </span>
              </motion.div>
            )}
          </div>

          {/* Time of day selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Time of day</label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const active = timeOfDay === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => setTimeOfDay(slot.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-secondary hover:bg-accent"
                    }`}
                  >
                    <slot.icon className={`w-4 h-4 ${active ? slot.color : "text-muted-foreground"}`} />
                    <span className={`text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{slot.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {timeSlots.find((s) => s.id === timeOfDay)?.desc}
            </p>
          </div>

          {/* Waist */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Waist (cm) — optional</label>
            <input
              type="number" step="0.1" value={waist}
              onChange={(e) => setWaist(e.target.value)}
              placeholder="92.0"
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes — optional</label>
            <input
              type="text" value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="After workout, before eating..."
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <button onClick={save} disabled={saving} className="w-full mt-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition disabled:opacity-50">
          {saving ? "Saving..." : "Log Weight"}
        </button>
      </motion.div>
    </div>
  );
}
