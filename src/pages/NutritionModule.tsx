import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Clock, Droplets, Plus, Minus, Trophy, Info, X, ChevronDown, Dumbbell, Moon as MoonIcon, PartyPopper, AlertTriangle, Flame, Check, ChefHat, CircleAlert, Loader2, Circle, CheckCircle2 } from "lucide-react";
import { getFastingStatus } from "@/lib/health-data";
import { getTodayWaterLog, upsertWaterLog, getTodayMeals, getAllMealLogs, upsertChecklist } from "@/lib/supabase-queries";
import { onSync } from "@/lib/sync-events";
import { playWaterSound, playGoalReachedSound } from "@/lib/water-sound";
import { VossBottle, VossBottleMini } from "@/components/ui/VossBottle";
import { Celebration } from "@/components/ui/Celebration";
import LogMealModal from "@/components/modals/LogMealModal";
import { MENU_VERSIONS, isMealTimeNow, type MealItem, type DayMenu, type MenuVersion } from "@/lib/menu-data";
import type { Tables } from "@/integrations/supabase/types";

const BOTTLE_ML = 800;
const GOAL_ML = 3000;
const SIP_ML = 400;

// ============================================================
// NUTREYA PORTION LIST — Lista de Raciones (1 ración = 1 portion)
// ============================================================

const NUTREYA_PORTIONS = {
  vegetables: [
    { name: "Chard (Acelgas)", portionGrams: 300, unit: "300gr", calories: 22 },
    { name: "Artichoke (Alcachofa)", portionGrams: 150, unit: "150gr", calories: 53 },
    { name: "Eggplant (Berenjena)", portionGrams: 300, unit: "300gr", calories: 51 },
    { name: "Broccoli", portionGrams: 150, unit: "150gr", calories: 51 },
    { name: "Zucchini cooked", portionGrams: 150, unit: "150gr", calories: 27 },
    { name: "Pumpkin cooked", portionGrams: 150, unit: "150gr", calories: 37 },
    { name: "Lamb's lettuce", portionGrams: 300, unit: "300gr", calories: 66 },
    { name: "Onion", portionGrams: 150, unit: "150gr", calories: 60 },
    { name: "Mushrooms cooked", portionGrams: 150, unit: "150gr", calories: 33 },
    { name: "Cabbage", portionGrams: 300, unit: "300gr", calories: 75 },
    { name: "Brussels sprouts", portionGrams: 150, unit: "150gr", calories: 63 },
    { name: "Cauliflower", portionGrams: 150, unit: "150gr", calories: 37 },
    { name: "Endives", portionGrams: 300, unit: "300gr", calories: 51 },
    { name: "Escarole", portionGrams: 300, unit: "300gr", calories: 57 },
    { name: "Asparagus", portionGrams: 300, unit: "300gr", calories: 66 },
    { name: "Spinach", portionGrams: 300, unit: "300gr", calories: 69 },
    { name: "Green beans", portionGrams: 300, unit: "300gr", calories: 93 },
    { name: "Lettuce", portionGrams: 300, unit: "300gr", calories: 51 },
    { name: "Turnip", portionGrams: 150, unit: "150gr", calories: 40 },
    { name: "Cucumber", portionGrams: 300, unit: "300gr", calories: 45 },
    { name: "Bell pepper", portionGrams: 300, unit: "300gr", calories: 75 },
    { name: "Leek", portionGrams: 70, unit: "70gr", calories: 42 },
    { name: "Beetroot", portionGrams: 150, unit: "150gr", calories: 64 },
    { name: "Tomato", portionGrams: 300, unit: "300gr", calories: 54 },
    { name: "Carrot", portionGrams: 150, unit: "150gr", calories: 62 },
  ],
  proteins: [
    { name: "Canned tuna", portionGrams: 60, unit: "60gr", calories: 62 },
    { name: "Beef", portionGrams: 50, unit: "50gr", calories: 95, maxPerWeek: 3 },
    { name: "Pork", portionGrams: 50, unit: "50gr", calories: 122, maxPerWeek: 3 },
    { name: "Rabbit", portionGrams: 50, unit: "50gr", calories: 75 },
    { name: "Lamb", portionGrams: 50, unit: "50gr", calories: 110, maxPerWeek: 3 },
    { name: "Cold cuts", portionGrams: 40, unit: "40gr", calories: 130, maxPerWeek: 3 },
    { name: "Egg", portionGrams: 1, unit: "1 unit", calories: 70 },
    { name: "Seafood", portionGrams: 75, unit: "75gr", calories: 60 },
    { name: "Mussels", portionGrams: 75, unit: "75gr", calories: 65 },
    { name: "Oily fish (salmon, tuna)", portionGrams: 75, unit: "75gr", calories: 130 },
    { name: "White fish (cod, hake)", portionGrams: 75, unit: "75gr", calories: 65 },
    { name: "Chicken", portionGrams: 50, unit: "50gr", calories: 85 },
    { name: "Cheese", portionGrams: 40, unit: "40gr", calories: 130, maxPerWeek: 3 },
    { name: "Smoked salmon", portionGrams: 50, unit: "50gr", calories: 85 },
    { name: "Veal", portionGrams: 50, unit: "50gr", calories: 90 },
    { name: "Turkey", portionGrams: 50, unit: "50gr", calories: 80 },
    { name: "Tofu", portionGrams: 100, unit: "100gr", calories: 80 },
    { name: "Tempeh", portionGrams: 50, unit: "50gr", calories: 95 },
    { name: "Seitan", portionGrams: 50, unit: "50gr", calories: 105 },
  ],
  carbs: [
    { name: "Rice (40gr cooked)", portionGrams: 40, unit: "40gr cooked", calories: 55 },
    { name: "Sweet potato", portionGrams: 50, unit: "50gr", calories: 45 },
    { name: "Couscous (40gr cooked)", portionGrams: 40, unit: "40gr cooked", calories: 55 },
    { name: "Green peas", portionGrams: 60, unit: "60gr", calories: 50 },
    { name: "Hummus", portionGrams: 70, unit: "70gr", calories: 140 },
    { name: "Legumes (50gr cooked)", portionGrams: 50, unit: "50gr cooked", calories: 68 },
    { name: "Potato", portionGrams: 50, unit: "50gr", calories: 43 },
    { name: "Quinoa (40gr cooked)", portionGrams: 40, unit: "40gr cooked", calories: 55 },
    { name: "Pasta (50gr cooked)", portionGrams: 50, unit: "50gr cooked", calories: 55 },
    { name: "Rice crackers (2 units)", portionGrams: 15, unit: "2 units", calories: 55 },
    { name: "Buckwheat crackers", portionGrams: 14, unit: "1 unit (14gr)", calories: 46 },
    { name: "Bread", portionGrams: 20, unit: "20gr", calories: 55 },
    { name: "Corn tortilla (1/2)", portionGrams: 30, unit: "1/2 unit", calories: 55 },
  ],
  fats: [
    { name: "EVOO", portionGrams: 10, unit: "1 tbsp (10gr)", calories: 90 },
    { name: "Olives (10 units)", portionGrams: 40, unit: "40gr ≈ 10 units", calories: 60 },
    { name: "Avocado (1/2)", portionGrams: 60, unit: "60gr = 1/2 unit", calories: 95 },
    { name: "Nuts (15gr)", portionGrams: 15, unit: "15gr", calories: 90 },
    { name: "Chia seeds", portionGrams: 30, unit: "30gr", calories: 145 },
    { name: "Peanut butter (1 tbsp)", portionGrams: 15, unit: "1 tbsp", calories: 90 },
    { name: "Butter", portionGrams: 10, unit: "10gr", calories: 74, maxPerWeek: 3 },
  ],
  fruits: [
    { name: "Apricot", portionGrams: 100, unit: "100gr", calories: 48 },
    { name: "Blueberries", portionGrams: 50, unit: "50gr", calories: 28 },
    { name: "Persimmon", portionGrams: 50, unit: "50gr", calories: 34 },
    { name: "Cherry", portionGrams: 50, unit: "50gr", calories: 30 },
    { name: "Plum", portionGrams: 100, unit: "100gr", calories: 46 },
    { name: "Raspberries", portionGrams: 100, unit: "100gr", calories: 52 },
    { name: "Strawberries", portionGrams: 150, unit: "150gr", calories: 48 },
    { name: "Kiwi", portionGrams: 100, unit: "100gr", calories: 61 },
    { name: "Apple", portionGrams: 100, unit: "100gr", calories: 52 },
    { name: "Mango", portionGrams: 100, unit: "100gr", calories: 60 },
    { name: "Peach", portionGrams: 100, unit: "100gr", calories: 39 },
    { name: "Orange", portionGrams: 100, unit: "100gr", calories: 47 },
    { name: "Pear", portionGrams: 100, unit: "100gr", calories: 57 },
    { name: "Pineapple", portionGrams: 100, unit: "100gr", calories: 50 },
    { name: "Watermelon", portionGrams: 200, unit: "200gr", calories: 60 },
    { name: "Grapes", portionGrams: 80, unit: "80gr", calories: 55 },
  ],
};

type PortionCategory = "protein" | "vegetable" | "carb" | "fat" | "fruit" | null;

const SUBSTITUTION_MAP: Record<string, { name: string; unit: string; calories: number; maxPerWeek?: number }[]> = {
  protein: NUTREYA_PORTIONS.proteins,
  vegetable: NUTREYA_PORTIONS.vegetables,
  carb: NUTREYA_PORTIONS.carbs,
  fat: NUTREYA_PORTIONS.fats,
  fruit: NUTREYA_PORTIONS.fruits,
};

// ── Meal parser → ingredient chips ──

interface ChipData { text: string; category: PortionCategory; calories: number; }

function parseMealIntoChips(items: string): ChipData[] {
  const parts = items.split(" + ").map((p) => p.trim()).filter(Boolean);
  return parts.map((part): ChipData => {
    const l = part.toLowerCase();
    // Proteins
    if (l.includes("egg") || l.includes("huevo") || l.includes("omelette") || l.includes("tortilla") || l.includes("scramble")) {
      return { text: part, category: "protein", calories: l.includes("3") ? 210 : 140 };
    }
    if (l.includes("salmon") || l.includes("salmón") || l.includes("tuna") || l.includes("atún") || l.includes("cod") || l.includes("bacalao") || l.includes("hake") || l.includes("merluza") || l.includes("sea bass") || l.includes("lubina") || l.includes("fish")) {
      return { text: part, category: "protein", calories: l.includes("300") ? 330 : l.includes("225") ? 280 : l.includes("150") ? 165 : 95 };
    }
    if (l.includes("chicken") || l.includes("pollo") || l.includes("turkey") || l.includes("pavo") || l.includes("veal") || l.includes("ternera") || l.includes("beef") || l.includes("meatball") || l.includes("albóndigas") || l.includes("pechuga") || l.includes("breast")) {
      return { text: part, category: "protein", calories: l.includes("200") ? 220 : l.includes("150") ? 165 : 130 };
    }
    // Carbs (legumes are carbs in Nutreya's system)
    if (l.includes("legume") || l.includes("legumbres") || l.includes("lentil") || l.includes("lentejas")) {
      return { text: part, category: "carb", calories: l.includes("200") ? 240 : 160 };
    }
    if (l.includes("cracker") || l.includes("rice") || l.includes("arroz") || l.includes("potato") || l.includes("patata") || l.includes("sweet potato") || l.includes("boniato") || l.includes("quinoa") || l.includes("quínoa")) {
      return { text: part, category: "carb", calories: l.includes("100") ? 90 : l.includes("80") ? 70 : 55 };
    }
    // Fats
    if (l.includes("evoo") || l.includes("aove") || l.includes("olive oil") || l.includes("tbsp")) {
      return { text: part, category: "fat", calories: 90 };
    }
    if (l.includes("avocado") || l.includes("aguacate")) {
      return { text: part, category: "fat", calories: 95 };
    }
    if (l.includes("olive") || l.includes("oliva")) {
      return { text: part, category: "fat", calories: 60 };
    }
    if (l.includes("almond") || l.includes("almendra") || l.includes("walnut") || l.includes("nueces") || l.includes("nuts") || l.includes("frutos secos")) {
      return { text: part, category: "fat", calories: 90 };
    }
    // Fruits
    if (l.includes("persimmon") || l.includes("caqui") || l.includes("plum") || l.includes("ciruela") || l.includes("apple") || l.includes("fruit")) {
      return { text: part, category: "fruit", calories: 50 };
    }
    // Vegetables
    if (l.includes("arugula") || l.includes("rúcula") || l.includes("spinach") || l.includes("espinaca") || l.includes("alfalfa") || l.includes("lettuce") || l.includes("lechuga") || l.includes("salad") || l.includes("ensalada") || l.includes("vegetable") || l.includes("verdura") || l.includes("tomato") || l.includes("tomate") || l.includes("asparagus") || l.includes("espárrago") || l.includes("eggplant") || l.includes("berenjena") || l.includes("zucchini") || l.includes("calabacín") || l.includes("carrot") || l.includes("zanahoria") || l.includes("beet") || l.includes("mushroom") || l.includes("setas") || l.includes("pepper") || l.includes("pimiento") || l.includes("bean sprout") || l.includes("stir-fry") || l.includes("ratatouille") || l.includes("green bean") || l.includes("wrap")) {
      return { text: part, category: "vegetable", calories: 45 };
    }
    // Non-substitutable (broths, soups, free meal)
    return { text: part, category: null, calories: l.includes("broth") || l.includes("caldo") || l.includes("soup") || l.includes("cream") || l.includes("crema") || l.includes("puré") || l.includes("puree") ? 30 : 0 };
  });
}

// ── Ingredient Chip with substitution dropdown ──

function IngredientChip({ text, category, defaultCalories }: { text: string; category: PortionCategory; defaultCalories: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedCalories, setSelectedCalories] = useState(defaultCalories);

  useEffect(() => {
    const close = () => setIsOpen(false);
    document.addEventListener("close-ingredient-dropdowns", close);
    return () => document.removeEventListener("close-ingredient-dropdowns", close);
  }, []);

  const substitutions = category ? SUBSTITUTION_MAP[category] ?? [] : [];
  const hasChanged = selected !== null;
  const displayText = selected ?? text;
  const categoryLabel = category === "protein" ? "Proteins" : category === "vegetable" ? "Vegetables" : category === "carb" ? "Carbohydrates" : category === "fat" ? "Fats" : category === "fruit" ? "Fruits" : "";

  return (
    <>
      <button
        onClick={() => category && setIsOpen(true)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
          hasChanged ? "bg-primary/20 text-primary border border-primary/40" : "bg-secondary/80 text-foreground border border-border hover:border-primary/30"
        } ${category ? "cursor-pointer" : "cursor-default opacity-70"}`}
      >
        {displayText}
        {hasChanged && <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20">{selectedCalories} kcal</span>}
        {category && <ChevronDown className="w-2.5 h-2.5" />}
      </button>

      {/* Centered modal */}
      <AnimatePresence>
        {isOpen && category && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-display font-bold text-foreground">Swap ingredient</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {categoryLabel} — 1 portion = equivalent serving
                    </p>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Current selection */}
                <div className="mt-3 px-3 py-2 rounded-lg bg-secondary/50 flex items-center justify-between">
                  <span className="text-xs text-foreground font-medium">{displayText}</span>
                  <span className="text-xs text-primary font-bold">{selectedCalories} kcal</span>
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto max-h-[50vh]">
                {hasChanged && (
                  <button onClick={() => { setSelected(null); setSelectedCalories(defaultCalories); setIsOpen(false); }} className="w-full px-5 py-3 text-left flex items-center justify-between hover:bg-accent/50 border-b border-border">
                    <span className="text-sm text-primary font-medium">Reset to original</span>
                    <span className="text-xs text-muted-foreground">{text} · {defaultCalories} kcal</span>
                  </button>
                )}
                {substitutions.map((item) => {
                  const isActive = selected === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => { setSelected(item.name); setSelectedCalories(item.calories); setIsOpen(false); }}
                      className={`w-full px-5 py-3 text-left flex items-center justify-between hover:bg-accent/50 transition border-b border-border/50 last:border-0 ${isActive ? "bg-primary/10" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{item.name}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{item.unit}</span>
                        {(item as any).maxPerWeek && (
                          <span className="text-[10px] text-warning flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Max {(item as any).maxPerWeek}x per week
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-3 shrink-0 ${
                        item.calories < 80 ? "bg-success/15 text-success" : item.calories < 130 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"
                      }`}>
                        {item.calories} kcal
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Meal Card (clickable → expands inline with photo, info, substitutions) ──

function MealCard({ meal, onLogged }: { meal: MealItem; onLogged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [scienceOpen, setScienceOpen] = useState(false);
  const [logged, setLogged] = useState(false);
  const [logging, setLogging] = useState(false);
  const isTimeNow = isMealTimeNow(meal.timeWindow);

  const handleLog = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (logged || logging) return;
    setLogging(true);
    const { logMeal } = await import("@/lib/supabase-queries");
    await logMeal({
      meal_type: meal.type,
      food_name: meal.items,
      calories: meal.calories,
      quality: "good",
      is_healthy: true,
    });
    setLogging(false);
    setLogged(true);
    onLogged();
    const { toast } = await import("@/hooks/use-toast");
    toast({ title: "Meal logged", description: `${meal.type}: ${meal.items.slice(0, 40)}...` });
  };

  return (
    <div className={`rounded-xl transition-all ${logged ? "bg-success/5 border-2 border-success/20" : "glass-card"}`}>
      {/* ── Collapsed: clickable summary row ── */}
      <div className="flex items-start">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 p-4 flex items-start gap-3 text-left hover:bg-accent/30 transition rounded-l-xl"
        >
          {/* Food photo thumbnail */}
          <img
            src={meal.imageUrl}
            alt=""
            className="w-14 h-14 rounded-lg object-cover shrink-0 bg-secondary"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-semibold uppercase ${logged ? "text-success" : "text-primary"}`}>{meal.type}</span>
              <span className="text-[10px] text-muted-foreground/60">({meal.typeEs})</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                isTimeNow
                  ? "bg-primary/20 text-primary animate-pulse"
                  : meal.timingUrgency === "warn"
                    ? "bg-warning/10 text-warning border border-warning/20"
                    : "bg-success/10 text-success border border-success/20"
              }`}>
                {meal.timeWindow}{meal.timingUrgency === "warn" && meal.type === "DINNER" ? " (before 8pm)" : ""}
              </span>
              {logged && <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">Logged</span>}
            </div>
            <p className={`text-sm leading-snug ${logged ? "text-muted-foreground line-through" : "text-foreground"}`}>{meal.items}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground">{meal.calories} kcal</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </button>

        {/* Log button on right side */}
        <button
          onClick={handleLog}
          disabled={logged || logging}
          className={`self-stretch px-3 flex items-center justify-center rounded-r-xl transition-all border-l ${
            logged
              ? "bg-success/10 border-success/20 text-success"
              : "border-border hover:bg-success/10 text-muted-foreground hover:text-success"
          }`}
          title={logged ? "Logged" : "Log this meal"}
        >
          {logging ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : logged ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* ── Expanded: full detail panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              {/* Large photo */}
              <div className="relative rounded-lg overflow-hidden h-40 bg-secondary">
                <img
                  src={meal.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3 flex flex-wrap gap-1.5">
                  {meal.keyNutrients.slice(0, 5).map((n) => (
                    <span key={n} className="text-[9px] px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm font-medium">{n}</span>
                  ))}
                </div>
              </div>

              {/* Ingredient chips with substitution */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Ingredients — tap to substitute</p>
                <div className="flex flex-wrap gap-1.5">
                  {parseMealIntoChips(meal.items).map((chip, i) => (
                    <IngredientChip key={i} text={chip.text} category={chip.category} defaultCalories={chip.calories} />
                  ))}
                </div>
              </div>

              {/* Liver benefit */}
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-[11px] text-destructive leading-snug">{meal.liverBenefit}</p>
              </div>

              {/* Why this meal */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Why this meal?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{meal.whyExplanation}</p>
              </div>

              {/* Why at this time */}
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

              {/* Cooking guide */}
              {meal.cooking && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">How to cook</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{meal.cooking.method}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{meal.cooking.whyHealthiest}</p>

                  {/* Steps */}
                  <div className="space-y-1.5 pl-1">
                    {meal.cooking.steps.map((s) => (
                      <div key={s.step} className="flex gap-2 text-xs">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">{s.step}</span>
                        <span className="text-muted-foreground leading-snug pt-0.5">{s.instruction}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tips */}
                  {meal.cooking.tips.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {meal.cooking.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-success">
                          <span className="shrink-0 mt-0.5">+</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* What to avoid */}
                  {meal.cooking.avoidMethod && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/15">
                      <CircleAlert className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                      <p className="text-[11px] text-destructive/80 leading-snug">{meal.cooking.avoidMethod}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Calories footer */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Flame className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs text-muted-foreground">Approx. <strong className="text-foreground">{meal.calories} kcal</strong></span>
              </div>
            </div>
          </motion.div>
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
  const [mealHistory, setMealHistory] = useState<any[]>([]);
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
    getAllMealLogs(60).then(setMealHistory);
  }, []);

  // Close substitution dropdowns on scroll
  useEffect(() => {
    const handleScroll = () => document.dispatchEvent(new CustomEvent("close-ingredient-dropdowns"));
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
              <MealCard key={m.type} meal={m} onLogged={() => { getTodayMeals().then(setTodayMeals); getAllMealLogs(60).then(setMealHistory); }} />
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

      {/* ── Meal History ── */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-foreground">Meal History</h3>
          <span className="text-xs text-muted-foreground">{mealHistory.length} meals logged</span>
        </div>
        {mealHistory.length > 0 ? (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {(() => {
              // Group meals by date
              const grouped: Record<string, any[]> = {};
              mealHistory.forEach((m: any) => {
                const d = new Date(m.logged_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
                if (!grouped[d]) grouped[d] = [];
                grouped[d].push(m);
              });
              return Object.entries(grouped).map(([date, meals]) => (
                <div key={date}>
                  <div className="sticky top-0 bg-card/95 backdrop-blur-sm py-1.5 px-1 z-10">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{date}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                      {meals.reduce((s: number, m: any) => s + (m.calories ?? 0), 0)} kcal total
                    </span>
                  </div>
                  {meals.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-accent/30 transition">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                          m.quality === "good" ? "bg-success/15 text-success" : m.quality === "bad" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"
                        }`}>{m.meal_type}</span>
                        <span className="text-xs text-foreground truncate">{m.food_name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{m.calories ?? "—"} kcal</span>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">No meals logged yet. Use the "Log Meal" button to start tracking.</p>
        )}
      </div>

      <LogMealModal open={mealModalOpen} onClose={() => setMealModalOpen(false)} onLogged={() => { getTodayMeals().then(setTodayMeals); getAllMealLogs(60).then(setMealHistory); }} />
    </div>
  );
}
