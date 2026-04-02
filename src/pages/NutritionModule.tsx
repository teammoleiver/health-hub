import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Clock, Droplets, Plus, Minus, Trophy } from "lucide-react";
import { getFastingStatus } from "@/lib/health-data";
import { getTodayWaterLog, upsertWaterLog, getTodayMeals, upsertChecklist } from "@/lib/supabase-queries";
import { playWaterSound, playGoalReachedSound } from "@/lib/water-sound";
import LogMealModal from "@/components/modals/LogMealModal";
import type { Tables } from "@/integrations/supabase/types";

const FOOD_IMAGES: Record<string, string> = {
  almuerzo_egg: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=80&h=80&fit=crop",
  almuerzo_turkey: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=80&h=80&fit=crop",
  almuerzo_salmon: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=80&h=80&fit=crop",
  comida_fish: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=80&h=80&fit=crop",
  comida_chicken: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=80&h=80&fit=crop",
  comida_lentils: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=80&h=80&fit=crop",
  comida_free: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop",
  merienda_olives: "https://images.unsplash.com/photo-1593030103066-0093718e7177?w=80&h=80&fit=crop",
  merienda_almonds: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=80&h=80&fit=crop",
  cena_default: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=80&h=80&fit=crop",
};

function getMealImage(mealType: string, items: string): string {
  const lower = items.toLowerCase();
  if (mealType.startsWith("Almuerzo")) {
    if (lower.includes("huevo") || lower.includes("tortilla")) return FOOD_IMAGES.almuerzo_egg;
    if (lower.includes("pavo")) return FOOD_IMAGES.almuerzo_turkey;
    if (lower.includes("salmón")) return FOOD_IMAGES.almuerzo_salmon;
    return FOOD_IMAGES.almuerzo_egg;
  }
  if (mealType.startsWith("Comida")) {
    if (lower.includes("libre") || lower.includes("free")) return FOOD_IMAGES.comida_free;
    if (lower.includes("salmón") || lower.includes("atún")) return FOOD_IMAGES.comida_fish;
    if (lower.includes("lentejas") || lower.includes("legumbre")) return FOOD_IMAGES.comida_lentils;
    return FOOD_IMAGES.comida_chicken;
  }
  if (mealType.startsWith("Merienda")) {
    return lower.includes("almendra") ? FOOD_IMAGES.merienda_almonds : FOOD_IMAGES.merienda_olives;
  }
  return FOOD_IMAGES.cena_default;
}

const MENUS = [
  { day: 1, label: "Menu 1 — Training Day", meals: [
    { type: "Almuerzo (12pm)", items: "Rúcula/Espinacas + 2 Crackers trigo sarraceno + Tortilla 2 huevos + 1 cda AOVE" },
    { type: "Comida (2pm)", items: "200g Brochetas pavo + champiñones + pimientos + 100g patata cocida + Ensalada + 1 cda AOVE" },
    { type: "Merienda (5pm)", items: "10 olivas" },
    { type: "Cena (7:30pm)", items: "150g Pollo desmenuzado con especias + Wrap lechuga + vegetales + 1 cda AOVE" },
  ]},
  { day: 2, label: "Menu 2 — Rest Day", meals: [
    { type: "Almuerzo", items: "Tomate + 2 Crackers + 4 lonchas pavo + 1 cda AOVE" },
    { type: "Comida", items: "300g Salmón al horno con limón + Puré calabaza + 1/2 aguacate" },
    { type: "Merienda", items: "15g almendras" },
    { type: "Cena", items: "Revuelto 3 huevos + Espárragos y zanahorias + 1 cda AOVE" },
  ]},
  { day: 3, label: "Menu 3 — Training Day", meals: [
    { type: "Almuerzo", items: "Rúcula/Espinacas + 2 Crackers + 50g salmón ahumado + 1/2 aguacate" },
    { type: "Comida", items: "200g Pollo desmenuzado salsa tomate + 80g arroz cocido + Verduras al horno + 1/2 aguacate" },
    { type: "Merienda", items: "10 olivas" },
    { type: "Cena", items: "225g Atún al horno + 1 bowl caldo verduras + 1 cda AOVE" },
  ]},
  { day: 4, label: "Menu 4 — Rest Day", meals: [
    { type: "Almuerzo", items: "Tomate + 2 Crackers + 4 lonchas pavo + 1 cda AOVE" },
    { type: "Comida", items: "200g Muslos pollo con verduras al horno + Lechuga/tomate/cebolla + 1 cda AOVE" },
    { type: "Merienda", items: "15g almendras" },
    { type: "Cena", items: "Tortilla 3 huevos + 1 bowl caldo verduras + 1 cda AOVE" },
  ]},
  { day: 5, label: "Menu 5 — Training Day", meals: [
    { type: "Almuerzo", items: "Rúcula/Espinacas + 2 Crackers + 50g salmón ahumado + 1/2 aguacate" },
    { type: "Comida", items: "200g Hamburguesa legumbres + 100g boniato + Verduras variadas + 1 cda AOVE" },
    { type: "Merienda", items: "10 olivas" },
    { type: "Cena", items: "150g Pavo al sartén + Ensalada remolacha/zanahoria/brócoli + 1 cda AOVE" },
  ]},
  { day: 6, label: "Menu 6 — Rest Day", meals: [
    { type: "Almuerzo", items: "Rúcula/Espinacas + 2 Crackers + Tortilla 2 huevos + 1 cda AOVE" },
    { type: "Comida", items: "200g Estofado lentejas + Verduras variadas + 1 cda AOVE" },
    { type: "Merienda", items: "15g almendras" },
    { type: "Cena", items: "150g Pavo al sartén + Wok verduras con brotes soja + 1 cda AOVE" },
  ]},
  { day: 7, label: "Menu 7 — Free Day", meals: [
    { type: "Almuerzo", items: "Tomate + 2 Crackers + 4 lonchas pavo + 1 cda AOVE" },
    { type: "Comida", items: "🎉 COMIDA LIBRE (free meal)" },
    { type: "Merienda", items: "10 olivas" },
    { type: "Cena", items: "150g Pechuga pollo con miel + 1 bowl crema zanahoria + 1 cda AOVE" },
  ]},
];

export default function NutritionModule() {
  const fasting = getFastingStatus();
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [todayMeals, setTodayMeals] = useState<Tables<"meal_logs">[]>([]);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(
    new Date().getDay() === 0 ? 7 : new Date().getDay()
  );
  const now = new Date();
  const hour = now.getHours();
  const isPastWindow = hour >= 20;
  const isClosingSoon = hour >= 19 && hour < 20;

  useEffect(() => {
    getTodayWaterLog().then((w) => setWaterGlasses(w?.glasses ?? 0));
    getTodayMeals().then(setTodayMeals);
  }, []);

  const [lastFilled, setLastFilled] = useState<number | null>(null);
  const [goalJustReached, setGoalJustReached] = useState(false);

  const handleWaterClick = useCallback(async (idx: number) => {
    const clickedGlass = idx + 1;
    // Toggle: if clicking the last filled glass, unfill it
    const newVal = clickedGlass === waterGlasses ? waterGlasses - 1 : clickedGlass;
    const increasing = newVal > waterGlasses;

    setWaterGlasses(newVal);
    if (increasing) {
      setLastFilled(idx);
      playWaterSound();
      setTimeout(() => setLastFilled(null), 600);
    }

    await upsertWaterLog(newVal);

    if (newVal >= 12 && waterGlasses < 12) {
      await upsertChecklist({ water_goal_met: true });
      setGoalJustReached(true);
      setTimeout(() => playGoalReachedSound(), 300);
      setTimeout(() => setGoalJustReached(false), 3000);
    }
  }, [waterGlasses]);

  const handleAddGlass = useCallback(async () => {
    if (waterGlasses >= 12) return;
    const newVal = waterGlasses + 1;
    setWaterGlasses(newVal);
    setLastFilled(newVal - 1);
    playWaterSound();
    setTimeout(() => setLastFilled(null), 600);
    await upsertWaterLog(newVal);
    if (newVal >= 12) {
      await upsertChecklist({ water_goal_met: true });
      setGoalJustReached(true);
      setTimeout(() => playGoalReachedSound(), 300);
      setTimeout(() => setGoalJustReached(false), 3000);
    }
  }, [waterGlasses]);

  const handleRemoveGlass = useCallback(async () => {
    if (waterGlasses <= 0) return;
    const newVal = waterGlasses - 1;
    setWaterGlasses(newVal);
    await upsertWaterLog(newVal);
  }, [waterGlasses]);

  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Nutrition</h1>

      {isPastWindow && (
        <div className="danger-gradient rounded-xl p-3 text-destructive-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-semibold">Eating window is now closed — no more food tonight</span>
        </div>
      )}

      {isClosingSoon && !isPastWindow && (
        <div className="warning-gradient rounded-xl p-3 text-warning-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-semibold">Eating window closes in {60 - now.getMinutes()} minutes</span>
        </div>
      )}

      {fasting.state === "eating" && fasting.remainingMinutes <= 60 && fasting.remainingMinutes > 0 && !isPastWindow && !isClosingSoon && (
        <div className="warning-gradient rounded-xl p-3 text-warning-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-semibold">Eating window closes in {fasting.remainingMinutes} minutes</span>
        </div>
      )}

      {/* Water Tracker */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" /> Water Tracker
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{waterGlasses}/12 glasses</span>
            <span className="text-xs text-muted-foreground">({(waterGlasses * 250 / 1000).toFixed(1)}L / 3L)</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
            initial={false}
            animate={{ width: `${(waterGlasses / 12) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
          {waterGlasses >= 12 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/30 to-blue-400/0"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>

        {/* Glass grid */}
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const filled = i < waterGlasses;
            const justFilled = lastFilled === i;
            return (
              <motion.button
                key={i}
                onClick={() => handleWaterClick(i)}
                whileTap={{ scale: 0.9 }}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200 overflow-hidden ${
                  filled
                    ? "bg-blue-500/20 text-blue-400 border-2 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                    : "bg-secondary/80 text-muted-foreground/40 border-2 border-transparent hover:border-blue-500/20 hover:text-blue-400/60 hover:bg-blue-500/5"
                }`}
              >
                {/* Fill animation wave */}
                {justFilled && (
                  <motion.div
                    className="absolute inset-x-0 bottom-0 bg-blue-500/20 rounded-xl"
                    initial={{ height: "0%" }}
                    animate={{ height: "100%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                )}
                {/* Ripple effect */}
                {justFilled && (
                  <motion.div
                    className="absolute inset-0 bg-blue-400/30 rounded-xl"
                    initial={{ opacity: 0.6, scale: 0.5 }}
                    animate={{ opacity: 0, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
                <Droplets className={`w-4 h-4 relative z-10 transition-transform ${filled ? "scale-110" : ""}`} />
                <span className={`text-[9px] mt-0.5 font-medium relative z-10 ${filled ? "text-blue-400" : "text-muted-foreground/30"}`}>
                  {(i + 1) * 250}ml
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Quick add/remove + goal celebration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRemoveGlass}
              disabled={waterGlasses <= 0}
              className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-accent transition disabled:opacity-30"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddGlass}
              disabled={waterGlasses >= 12}
              className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition disabled:opacity-30 shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground ml-1">Quick add</span>
          </div>

          <AnimatePresence>
            {goalJustReached && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-semibold"
              >
                <Trophy className="w-3.5 h-3.5" /> 3L Goal reached!
              </motion.div>
            )}
          </AnimatePresence>

          {waterGlasses >= 12 && !goalJustReached && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
              <Trophy className="w-3.5 h-3.5" /> Goal complete
            </span>
          )}
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MENUS.map((m) => (
          <button key={m.day} onClick={() => setSelectedDay(m.day)} className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${selectedDay === m.day ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-accent"}`}>
            Day {m.day}
          </button>
        ))}
      </div>

      {/* Menu Detail */}
      {MENUS.filter((m) => m.day === selectedDay).map((menu) => (
        <div key={menu.day} className="space-y-3">
          <h3 className="font-display font-semibold text-foreground">{menu.label}</h3>
          {menu.day === 7 && (
            <div className="warning-gradient rounded-lg p-3 text-warning-foreground text-xs flex items-start gap-2">
              <span>⚠️</span>
              <span>Free meal day — be liver-aware. Avoid fried, processed, and high-sugar foods. Your ALT is at 101.</span>
            </div>
          )}
          {menu.meals.map((meal) => (
            <div key={meal.type} className="glass-card rounded-xl p-4 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary uppercase">{meal.type}</span>
                  <Utensils className="w-3 h-3 text-muted-foreground" />
                </div>
                <p className="text-sm text-foreground">{meal.items}</p>
              </div>
              <img src={getMealImage(meal.type, meal.items)} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" loading="lazy" />
            </div>
          ))}
        </div>
      ))}

      {/* Today's Logged Meals */}
      {todayMeals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-foreground">Today's Logged Meals</h3>
          {todayMeals.map((meal) => (
            <div key={meal.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-primary uppercase">{meal.meal_type}</span>
                <p className="text-sm text-foreground">{meal.food_name}</p>
              </div>
              <div className="flex items-center gap-2">
                {meal.calories && <span className="text-xs text-muted-foreground">{meal.calories} kcal</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  meal.quality === "good" ? "bg-success/15 text-success" :
                  meal.quality === "bad" ? "bg-destructive/15 text-destructive" :
                  "bg-warning/15 text-warning"
                }`}>
                  {meal.quality === "good" ? "Healthy" : meal.quality === "bad" ? "Unhealthy" : "OK"}
                </span>
              </div>
            </div>
          ))}
          <div className="text-center text-sm text-muted-foreground">Total: <strong className="text-foreground">{totalCalories} kcal</strong></div>
        </div>
      )}

      {/* Log Meal Button */}
      <button onClick={() => setMealModalOpen(true)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition">
        <Plus className="w-4 h-4" /> Log Meal
      </button>

      <LogMealModal open={mealModalOpen} onClose={() => setMealModalOpen(false)} onLogged={() => getTodayMeals().then(setTodayMeals)} />
    </div>
  );
}
