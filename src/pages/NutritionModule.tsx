import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Clock, Droplets, Plus, Minus, Trophy, Info, X, ChevronDown, Dumbbell, Moon as MoonIcon, PartyPopper, AlertTriangle, Flame } from "lucide-react";
import { getFastingStatus } from "@/lib/health-data";
import { getTodayWaterLog, upsertWaterLog, getTodayMeals, upsertChecklist } from "@/lib/supabase-queries";
import { playWaterSound, playGoalReachedSound } from "@/lib/water-sound";
import { VossBottle, VossBottleMini } from "@/components/ui/VossBottle";
import { Celebration } from "@/components/ui/Celebration";
import LogMealModal from "@/components/modals/LogMealModal";
import { MENU_VERSIONS, isMealTimeNow, type MealItem, type DayMenu, type MenuVersion } from "@/lib/menu-data";
import type { Tables } from "@/integrations/supabase/types";

const BOTTLE_ML = 800;
const GOAL_ML = 3000;
const SIP_ML = 400;

// ── Meal Info Panel ──

function MealInfoPanel({ meal, onClose }: { meal: MealItem; onClose: () => void }) {
  const [scienceOpen, setScienceOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, y: 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-0 top-0 z-30 w-[360px] max-h-[480px] overflow-y-auto bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl p-4 space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase">{meal.type}</p>
          <p className="text-sm font-display font-bold text-foreground mt-0.5">{meal.items}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X className="w-4 h-4" /></button>
      </div>

      {/* Liver badge */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
        <p className="text-[11px] text-destructive leading-tight">{meal.liverBenefit}</p>
      </div>

      {/* Why this meal */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Why this meal?</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{meal.whyExplanation}</p>
      </div>

      {/* Key nutrients */}
      <div className="flex flex-wrap gap-1.5">
        {meal.keyNutrients.map((n) => (
          <span key={n} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">{n}</span>
        ))}
      </div>

      {/* Timing */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Why at this time?</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{meal.timingReason}</p>
      </div>

      {/* Nutritional science (collapsible) */}
      <button onClick={() => setScienceOpen(!scienceOpen)} className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider hover:underline">
        Nutritional Science <ChevronDown className={`w-3 h-3 transition-transform ${scienceOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {scienceOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="text-xs text-muted-foreground leading-relaxed">{meal.nutritionExplanation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calories */}
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <Flame className="w-3.5 h-3.5 text-warning" />
        <span className="text-xs text-muted-foreground">Approx. <strong className="text-foreground">{meal.calories} kcal</strong></span>
      </div>
    </motion.div>
  );
}

// ── Meal Card ──

function MealCard({ meal }: { meal: MealItem }) {
  const [showPhoto, setShowPhoto] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const isTimeNow = isMealTimeNow(meal.timeWindow);

  return (
    <div
      className="glass-card rounded-xl overflow-hidden relative group"
      onMouseEnter={() => setShowPhoto(true)}
      onMouseLeave={() => { setShowPhoto(false); setShowInfo(false); }}
    >
      <div className="p-4 flex items-start gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold text-primary uppercase">{meal.type}</span>
            <span className="text-[10px] text-muted-foreground/60">({meal.typeEs})</span>
            {/* Timing pill */}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              isTimeNow
                ? "bg-primary/20 text-primary animate-pulse"
                : meal.timingUrgency === "warn"
                  ? "bg-warning/10 text-warning border border-warning/20"
                  : "bg-success/10 text-success border border-success/20"
            }`}>
              {meal.timeWindow}{meal.timingUrgency === "warn" && meal.type === "DINNER" ? " (before 8pm)" : ""}
            </span>
            {/* Calories */}
            <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0">{meal.calories} kcal</span>
          </div>
          <p className="text-sm text-foreground leading-snug">{meal.items}</p>
        </div>

        {/* Info button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
          className="shrink-0 w-7 h-7 rounded-full bg-secondary hover:bg-accent flex items-center justify-center transition text-muted-foreground hover:text-primary"
          title="Why this meal?"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hover photo overlay */}
      <AnimatePresence>
        {showPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-y-0 right-0 w-[40%] z-0 hidden md:block"
          >
            <img src={meal.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/80 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info panel */}
      <AnimatePresence>
        {showInfo && (
          <MealInfoPanel meal={meal} onClose={() => setShowInfo(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ──

export default function NutritionModule() {
  const fasting = getFastingStatus();
  const [waterMl, setWaterMl] = useState(0);
  const [todayMeals, setTodayMeals] = useState<Tables<"meal_logs">[]>([]);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 7 : new Date().getDay());

  // Menu version
  const [menuVersionId, setMenuVersionId] = useState<"v1" | "v2">(() => {
    return (localStorage.getItem("ht-menu-version") as "v1" | "v2") || "v2";
  });
  const menuVersion = MENU_VERSIONS.find((v) => v.id === menuVersionId) ?? MENU_VERSIONS[1];

  const switchMenu = (id: "v1" | "v2") => {
    setMenuVersionId(id);
    localStorage.setItem("ht-menu-version", id);
  };

  const now = new Date();
  const hour = now.getHours();
  const isPastWindow = hour >= 20;
  const isClosingSoon = hour >= 19 && hour < 20;

  useEffect(() => {
    getTodayWaterLog().then((w) => {
      setWaterMl(w?.ml_total ?? (w?.glasses ?? 0) * 250);
    });
    getTodayMeals().then(setTodayMeals);
  }, []);

  const [justDrank, setJustDrank] = useState(false);
  const [goalJustReached, setGoalJustReached] = useState(false);

  const completedBottles = Math.floor(waterMl / BOTTLE_ML);
  const currentBottleMl = waterMl % BOTTLE_ML;
  const currentBottleFill = currentBottleMl / BOTTLE_ML;
  const goalReached = waterMl >= GOAL_ML;

  const persistWater = useCallback(async (ml: number) => {
    const glasses = Math.round(ml / 250);
    await upsertWaterLog(glasses, ml);
    if (ml >= GOAL_ML) await upsertChecklist({ water_goal_met: true });
  }, []);

  const handleDrink = useCallback(async () => {
    const newMl = Math.min(waterMl + SIP_ML, 5000);
    setWaterMl(newMl);
    setJustDrank(true);
    playWaterSound();
    setTimeout(() => setJustDrank(false), 600);
    if (newMl >= GOAL_ML && waterMl < GOAL_ML) {
      setGoalJustReached(true);
      setTimeout(() => playGoalReachedSound(), 400);
    }
    await persistWater(newMl);
  }, [waterMl, persistWater]);

  const handleRemove = useCallback(async () => {
    if (waterMl <= 0) return;
    const newMl = Math.max(0, waterMl - SIP_ML);
    setWaterMl(newMl);
    await persistWater(newMl);
  }, [waterMl, persistWater]);

  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
  const selectedMenu = menuVersion.days.find((d) => d.day === selectedDay);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Nutrition</h1>

      {/* Fasting warnings */}
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

      {/* ── Water Tracker ── */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" /> Water Tracker
          </h3>
          <div className="text-right">
            <span className="text-sm font-medium text-foreground">{(waterMl / 1000).toFixed(1)}L</span>
            <span className="text-sm text-muted-foreground"> / {GOAL_ML / 1000}L</span>
          </div>
        </div>
        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-500" initial={false} animate={{ width: `${Math.min((waterMl / GOAL_ML) * 100, 100)}%` }} transition={{ type: "spring", stiffness: 300, damping: 25 }} />
          {goalReached && <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/30 to-blue-400/0" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />}
        </div>
        <div className="flex items-end gap-5">
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] text-muted-foreground font-medium">VOSS 800ml</p>
            <motion.button onClick={handleDrink} whileTap={{ scale: 0.95 }} className="relative cursor-pointer group">
              <VossBottle fillLevel={currentBottleFill} size={180} interactive />
              <AnimatePresence>{justDrank && <motion.div className="absolute inset-0 rounded-lg border-2 border-blue-400/50" initial={{ opacity: 0.8, scale: 0.9 }} animate={{ opacity: 0, scale: 1.15 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} />}</AnimatePresence>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-bold text-blue-300 bg-background/80 px-2 py-0.5 rounded-full">+{SIP_ML}ml</span></div>
            </motion.button>
            <div className="text-center"><p className="text-xs font-bold text-blue-400">{currentBottleMl}ml</p><p className="text-[10px] text-muted-foreground">of 800ml</p></div>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">Bottles finished</p>
              <div className="flex items-end gap-1.5 flex-wrap min-h-[52px]">
                {completedBottles > 0 ? Array.from({ length: completedBottles }).map((_, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.5, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: i * 0.1, type: "spring" }}><VossBottleMini /></motion.div>
                )) : <span className="text-xs text-muted-foreground/50 italic">None yet — tap the bottle!</span>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/50 rounded-lg p-2 text-center"><div className="text-lg font-display font-bold text-foreground">{completedBottles}</div><div className="text-[9px] text-muted-foreground">bottles</div></div>
              <div className="bg-secondary/50 rounded-lg p-2 text-center"><div className="text-lg font-display font-bold text-blue-400">{waterMl}</div><div className="text-[9px] text-muted-foreground">ml total</div></div>
              <div className="bg-secondary/50 rounded-lg p-2 text-center"><div className="text-lg font-display font-bold text-foreground">{Math.max(0, GOAL_ML - waterMl)}</div><div className="text-[9px] text-muted-foreground">ml left</div></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRemove} disabled={waterMl <= 0} className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-accent transition disabled:opacity-30"><Minus className="w-4 h-4" /></button>
              <button onClick={handleDrink} className="flex-1 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center gap-2 hover:bg-blue-600 transition shadow-lg shadow-blue-500/20 font-medium text-sm"><Droplets className="w-4 h-4" /> +{SIP_ML}ml</button>
            </div>
          </div>
        </div>
        {goalReached && <div className="flex items-center justify-center gap-2 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium"><Trophy className="w-3.5 h-3.5" /> Daily goal complete</div>}
      </div>
      <Celebration show={goalJustReached} title="3L Goal Reached!" subtitle="Amazing hydration today! Your body thanks you." onClose={() => setGoalJustReached(false)} duration={5000} />

      {/* ── Menu Plan Switcher ── */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">Menu Plan</h3>
          <span className="text-[10px] text-muted-foreground">Nutritionist: Yadismira Mendoza (Nutreya)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MENU_VERSIONS.map((v) => (
            <button
              key={v.id}
              onClick={() => switchMenu(v.id)}
              className={`p-3 rounded-lg text-left transition-all border-2 ${
                menuVersionId === v.id
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-secondary hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border-2 ${menuVersionId === v.id ? "border-primary bg-primary" : "border-muted-foreground/30"}`} />
                <span className="text-sm font-medium text-foreground">{v.name}</span>
                {v.id === "v2" && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">NEW</span>}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ml-5">{v.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Day Selector ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {menuVersion.days.map((d) => (
          <button
            key={d.day}
            onClick={() => setSelectedDay(d.day)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedDay === d.day ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-accent"
            }`}
          >
            {d.isTrainingDay && <Dumbbell className="w-3 h-3" />}
            {d.isFreeDay && <PartyPopper className="w-3 h-3" />}
            Day {d.day}
          </button>
        ))}
      </div>

      {/* ── Menu Detail ── */}
      <AnimatePresence mode="wait">
        {selectedMenu && (
          <motion.div
            key={`${menuVersionId}-${selectedDay}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Day label + badge */}
            <div className="flex items-center gap-3">
              <h3 className="font-display font-semibold text-foreground">{selectedMenu.label}</h3>
              {selectedMenu.isTrainingDay && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold flex items-center gap-1">
                  <Dumbbell className="w-3 h-3" /> Training Day
                </span>
              )}
              {!selectedMenu.isTrainingDay && !selectedMenu.isFreeDay && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-semibold flex items-center gap-1">
                  <MoonIcon className="w-3 h-3" /> Rest Day
                </span>
              )}
              {selectedMenu.isFreeDay && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning font-semibold flex items-center gap-1">
                  <PartyPopper className="w-3 h-3" /> Free Day
                </span>
              )}
            </div>

            {/* Free day liver warning */}
            {selectedMenu.isFreeDay && (
              <div className="warning-gradient rounded-lg p-3 text-warning-foreground text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Free meal day — be liver-conscious. Avoid alcohol, fried foods, and high-sugar items. Your ALT is at 101 — these directly worsen fatty liver.</span>
              </div>
            )}

            {/* Daily total */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Flame className="w-3.5 h-3.5 text-warning" />
              <span>Day total: ~<strong className="text-foreground">{selectedMenu.meals.reduce((s, m) => s + m.calories, 0)} kcal</strong></span>
            </div>

            {/* Meal cards */}
            {selectedMenu.meals.map((m) => (
              <MealCard key={m.type} meal={m} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Today's Logged Meals ── */}
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
                <span className={`text-xs px-2 py-0.5 rounded-full ${meal.quality === "good" ? "bg-success/15 text-success" : meal.quality === "bad" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>
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
