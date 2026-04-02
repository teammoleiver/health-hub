import { useState } from "react";
import { Dumbbell, X } from "lucide-react";
import { motion } from "framer-motion";
import { logExercise } from "@/lib/supabase-queries";
import { toast } from "@/hooks/use-toast";

const EXERCISE_TYPES = [
  "Treadmill Walk", "Treadmill Intervals", "Bodyweight Circuit",
  "Gym Strength", "Outdoor Walk", "Swimming", "Other",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
}

export default function LogExerciseModal({ open, onClose, onLogged }: Props) {
  const [exerciseType, setExerciseType] = useState(EXERCISE_TYPES[0]);
  const [duration, setDuration] = useState("");
  const [speed, setSpeed] = useState("");
  const [calories, setCalories] = useState("");
  const [isTrainingDay, setIsTrainingDay] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const save = async () => {
    if (!duration) {
      toast({ title: "Duration required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const result = await logExercise({
      exercise_type: exerciseType,
      duration_min: parseInt(duration),
      speed_kmh: speed ? parseFloat(speed) : undefined,
      calories: calories ? parseInt(calories) : undefined,
      is_training_day: isTrainingDay,
      notes: notes || undefined,
    });
    setSaving(false);
    if (result) {
      toast({ title: "Exercise logged", description: `${exerciseType} — ${duration} min` });
      onLogged();
      onClose();
      setDuration(""); setSpeed(""); setCalories(""); setNotes("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-xl p-6 max-w-sm w-full shadow-xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-warning" /> Log Exercise
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Exercise Type *</label>
            <select value={exerciseType} onChange={(e) => setExerciseType(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30">
              {EXERCISE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Duration (minutes) *</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="45" className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Speed (km/h)</label>
              <input type="number" step="0.1" value={speed} onChange={(e) => setSpeed(e.target.value)} placeholder="5.5" className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Calories</label>
              <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="300" className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsTrainingDay(!isTrainingDay)} className={`relative w-11 h-6 rounded-full transition-colors ${isTrainingDay ? "bg-primary" : "bg-muted"}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${isTrainingDay ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm text-foreground">Training day</span>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        <button onClick={save} disabled={saving} className="w-full mt-5 py-2.5 rounded-xl bg-warning text-warning-foreground font-semibold hover:opacity-90 transition disabled:opacity-50">
          {saving ? "Saving..." : "Log Exercise"}
        </button>
      </motion.div>
    </div>
  );
}
