import { useState } from "react";
import { Utensils, X, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { logMeal } from "@/lib/supabase-queries";
import { toast } from "@/hooks/use-toast";

const MEAL_TYPES = ["Almuerzo", "Comida", "Merienda", "Cena"];
const QUALITY_OPTIONS = [
  { value: "good", label: "Healthy", color: "bg-success/20 text-success border-success/30" },
  { value: "ok", label: "OK", color: "bg-warning/20 text-warning border-warning/30" },
  { value: "bad", label: "Unhealthy", color: "bg-destructive/20 text-destructive border-destructive/30" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
  isFastDay?: boolean;
  fastDayCalories?: number;
}

export default function LogMealModal({ open, onClose, onLogged, isFastDay = false, fastDayCalories = 0 }: Props) {
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [quality, setQuality] = useState("ok");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [saving, setSaving] = useState(false);
  const [showOverride, setShowOverride] = useState(false);

  if (!open) return null;

  const now = new Date();
  const hour = now.getHours();
  const isOutsideWindow = hour < 12 || hour >= 20;

  const save = async () => {
    if (!foodName.trim()) {
      toast({ title: "Food name required", variant: "destructive" });
      return;
    }
    if (isOutsideWindow && !showOverride) {
      setShowOverride(true);
      return;
    }
    const cal = calories ? parseInt(calories) : undefined;
    setSaving(true);
    const result = await logMeal({
      meal_type: mealType,
      food_name: foodName,
      calories: cal,
      quality,
      is_healthy: quality === "good",
      protein_g: protein ? parseFloat(protein) : undefined,
      carbs_g: carbs ? parseFloat(carbs) : undefined,
      fat_g: fat ? parseFloat(fat) : undefined,
      is_fast_day_meal: isFastDay,
      fast_day_running_calories: isFastDay ? fastDayCalories + (cal ?? 0) : undefined,
    });
    setSaving(false);
    if (result) {
      toast({ title: "Meal logged", description: `${mealType}: ${foodName}` });
      onLogged();
      onClose();
      setFoodName(""); setCalories(""); setProtein(""); setCarbs(""); setFat(""); setShowOverride(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-xl p-6 max-w-sm w-full shadow-xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" /> Log Meal
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {isOutsideWindow && !showOverride && (
          <div className="danger-gradient rounded-lg p-3 text-destructive-foreground text-xs flex items-start gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Outside eating window (12pm-8pm). Logging will require override.</span>
          </div>
        )}

        {isFastDay && (
          <div className="bg-fast-day/10 border border-fast-day/20 rounded-lg p-3 text-xs text-foreground mb-4">
            <strong>5:2 Fast Day</strong> — Running total: {fastDayCalories} kcal / 500 kcal limit
            {fastDayCalories + (parseInt(calories) || 0) > 500 && (
              <span className="text-destructive font-bold block mt-1">⚠️ Will exceed 500 kcal limit!</span>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Meal Type *</label>
            <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30">
              {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Food *</label>
            <input type="text" value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="Grilled chicken salad..." className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Calories</label>
            <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="450" className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Quality</label>
            <div className="flex gap-2">
              {QUALITY_OPTIONS.map((q) => (
                <button key={q.value} onClick={() => setQuality(q.value)} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${quality === q.value ? q.color : "bg-secondary text-muted-foreground border-border"}`}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground">Protein (g)</label>
              <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="30" className="w-full mt-1 px-2 py-2 rounded-lg bg-secondary text-foreground text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground">Carbs (g)</label>
              <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="40" className="w-full mt-1 px-2 py-2 rounded-lg bg-secondary text-foreground text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground">Fat (g)</label>
              <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="15" className="w-full mt-1 px-2 py-2 rounded-lg bg-secondary text-foreground text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>

        {showOverride && (
          <div className="mt-3 p-3 bg-warning/10 rounded-lg text-xs text-foreground">
            ⚠️ You're logging outside the 12pm-8pm eating window. Click again to confirm.
          </div>
        )}

        <button onClick={save} disabled={saving} className="w-full mt-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition disabled:opacity-50">
          {saving ? "Saving..." : showOverride ? "Confirm Override & Log" : "Log Meal"}
        </button>
      </motion.div>
    </div>
  );
}
