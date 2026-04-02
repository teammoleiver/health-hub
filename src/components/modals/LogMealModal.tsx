import { useState, useMemo } from "react";
import { Utensils, X, AlertTriangle, Search, Plus, Trash2, Check, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logMeal } from "@/lib/supabase-queries";
import { toast } from "@/hooks/use-toast";

// ── Ingredient database (flat list from Nutreya portions) ──

interface FoodItem {
  name: string;
  category: string;
  calories: number;
  portion: string;
  maxPerWeek?: number;
}

const FOOD_DATABASE: FoodItem[] = [
  // Vegetables
  { name: "Chard", category: "Vegetable", calories: 22, portion: "300g" },
  { name: "Artichoke", category: "Vegetable", calories: 53, portion: "150g" },
  { name: "Eggplant", category: "Vegetable", calories: 51, portion: "300g" },
  { name: "Broccoli", category: "Vegetable", calories: 51, portion: "150g" },
  { name: "Zucchini", category: "Vegetable", calories: 27, portion: "150g" },
  { name: "Pumpkin", category: "Vegetable", calories: 37, portion: "150g" },
  { name: "Onion", category: "Vegetable", calories: 60, portion: "150g" },
  { name: "Mushrooms", category: "Vegetable", calories: 33, portion: "150g" },
  { name: "Cabbage", category: "Vegetable", calories: 75, portion: "300g" },
  { name: "Brussels sprouts", category: "Vegetable", calories: 63, portion: "150g" },
  { name: "Cauliflower", category: "Vegetable", calories: 37, portion: "150g" },
  { name: "Asparagus", category: "Vegetable", calories: 66, portion: "300g" },
  { name: "Spinach", category: "Vegetable", calories: 69, portion: "300g" },
  { name: "Green beans", category: "Vegetable", calories: 93, portion: "300g" },
  { name: "Lettuce", category: "Vegetable", calories: 51, portion: "300g" },
  { name: "Cucumber", category: "Vegetable", calories: 45, portion: "300g" },
  { name: "Bell pepper", category: "Vegetable", calories: 75, portion: "300g" },
  { name: "Beetroot", category: "Vegetable", calories: 64, portion: "150g" },
  { name: "Tomato", category: "Vegetable", calories: 54, portion: "300g" },
  { name: "Carrot", category: "Vegetable", calories: 62, portion: "150g" },
  // Proteins
  { name: "Chicken breast", category: "Protein", calories: 85, portion: "50g" },
  { name: "Turkey", category: "Protein", calories: 80, portion: "50g" },
  { name: "Veal", category: "Protein", calories: 90, portion: "50g" },
  { name: "Beef", category: "Protein", calories: 95, portion: "50g", maxPerWeek: 3 },
  { name: "Pork", category: "Protein", calories: 122, portion: "50g", maxPerWeek: 3 },
  { name: "Lamb", category: "Protein", calories: 110, portion: "50g", maxPerWeek: 3 },
  { name: "Rabbit", category: "Protein", calories: 75, portion: "50g" },
  { name: "Egg", category: "Protein", calories: 70, portion: "1 unit" },
  { name: "Salmon", category: "Protein", calories: 130, portion: "75g" },
  { name: "Tuna", category: "Protein", calories: 130, portion: "75g" },
  { name: "Cod", category: "Protein", calories: 65, portion: "75g" },
  { name: "Hake", category: "Protein", calories: 65, portion: "75g" },
  { name: "Sea bass", category: "Protein", calories: 65, portion: "75g" },
  { name: "Canned tuna", category: "Protein", calories: 62, portion: "60g" },
  { name: "Seafood", category: "Protein", calories: 60, portion: "75g" },
  { name: "Mussels", category: "Protein", calories: 65, portion: "75g" },
  { name: "Smoked salmon", category: "Protein", calories: 85, portion: "50g" },
  { name: "Tofu", category: "Protein", calories: 80, portion: "100g" },
  { name: "Tempeh", category: "Protein", calories: 95, portion: "50g" },
  { name: "Cheese", category: "Protein", calories: 130, portion: "40g", maxPerWeek: 3 },
  // Carbs
  { name: "Rice (cooked)", category: "Carb", calories: 55, portion: "40g" },
  { name: "Sweet potato", category: "Carb", calories: 45, portion: "50g" },
  { name: "Potato", category: "Carb", calories: 43, portion: "50g" },
  { name: "Quinoa (cooked)", category: "Carb", calories: 55, portion: "40g" },
  { name: "Pasta (cooked)", category: "Carb", calories: 55, portion: "50g" },
  { name: "Bread", category: "Carb", calories: 55, portion: "20g" },
  { name: "Buckwheat crackers", category: "Carb", calories: 46, portion: "1 unit" },
  { name: "Lentils (cooked)", category: "Carb", calories: 68, portion: "50g" },
  { name: "Chickpeas (cooked)", category: "Carb", calories: 68, portion: "50g" },
  { name: "Hummus", category: "Carb", calories: 140, portion: "70g" },
  { name: "Green peas", category: "Carb", calories: 50, portion: "60g" },
  // Fats
  { name: "EVOO (olive oil)", category: "Fat", calories: 90, portion: "1 tbsp" },
  { name: "Olives", category: "Fat", calories: 60, portion: "10 units" },
  { name: "Avocado (half)", category: "Fat", calories: 95, portion: "60g" },
  { name: "Almonds", category: "Fat", calories: 90, portion: "15g" },
  { name: "Walnuts", category: "Fat", calories: 90, portion: "15g" },
  { name: "Peanut butter", category: "Fat", calories: 90, portion: "1 tbsp" },
  { name: "Chia seeds", category: "Fat", calories: 145, portion: "30g" },
  // Fruits
  { name: "Apple", category: "Fruit", calories: 52, portion: "100g" },
  { name: "Orange", category: "Fruit", calories: 47, portion: "100g" },
  { name: "Banana", category: "Fruit", calories: 89, portion: "100g" },
  { name: "Strawberries", category: "Fruit", calories: 48, portion: "150g" },
  { name: "Blueberries", category: "Fruit", calories: 28, portion: "50g" },
  { name: "Kiwi", category: "Fruit", calories: 61, portion: "100g" },
  { name: "Pear", category: "Fruit", calories: 57, portion: "100g" },
  { name: "Persimmon", category: "Fruit", calories: 34, portion: "50g" },
  { name: "Watermelon", category: "Fruit", calories: 60, portion: "200g" },
  { name: "Grapes", category: "Fruit", calories: 55, portion: "80g" },
  { name: "Mango", category: "Fruit", calories: 60, portion: "100g" },
  { name: "Pineapple", category: "Fruit", calories: 50, portion: "100g" },
  { name: "Peach", category: "Fruit", calories: 39, portion: "100g" },
  // Dairy
  { name: "Greek yogurt", category: "Dairy", calories: 130, portion: "150g" },
  { name: "Natural yogurt", category: "Dairy", calories: 150, portion: "250g" },
  { name: "Fresh cheese", category: "Dairy", calories: 98, portion: "100g" },
  { name: "Skyr", category: "Dairy", calories: 95, portion: "150g" },
  // Other
  { name: "Cake (slice)", category: "Other", calories: 280, portion: "1 slice" },
  { name: "Cookie", category: "Other", calories: 60, portion: "1 unit" },
  { name: "Ice cream", category: "Other", calories: 200, portion: "100g" },
  { name: "Chocolate (dark)", category: "Other", calories: 170, portion: "30g" },
  { name: "Pizza (slice)", category: "Other", calories: 270, portion: "1 slice" },
  { name: "Sandwich", category: "Other", calories: 350, portion: "1 unit" },
  { name: "Coffee (black)", category: "Other", calories: 2, portion: "1 cup" },
  { name: "Coffee with milk", category: "Other", calories: 50, portion: "1 cup" },
  { name: "Tea", category: "Other", calories: 0, portion: "1 cup" },
  { name: "Juice (natural)", category: "Other", calories: 45, portion: "200ml" },
];

const MEAL_TYPES = [
  { value: "Lunch", label: "Lunch (12pm)" },
  { value: "Main Meal", label: "Main Meal (2-3pm)" },
  { value: "Snack", label: "Snack (5pm)" },
  { value: "Dinner", label: "Dinner (7:30pm)" },
];

const QUALITY_OPTIONS = [
  { value: "good", label: "Healthy", color: "bg-success/20 text-success border-success/30" },
  { value: "ok", label: "OK", color: "bg-warning/20 text-warning border-warning/30" },
  { value: "bad", label: "Unhealthy", color: "bg-destructive/20 text-destructive border-destructive/30" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Vegetable: "bg-success/10 text-success",
  Protein: "bg-blue-500/10 text-blue-400",
  Carb: "bg-warning/10 text-warning",
  Fat: "bg-orange-500/10 text-orange-400",
  Fruit: "bg-purple-500/10 text-purple-400",
  Dairy: "bg-cyan-500/10 text-cyan-400",
  Other: "bg-secondary text-muted-foreground",
};

interface SelectedIngredient {
  name: string;
  calories: number;
  portion: string;
  category: string;
  qty: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
  isFastDay?: boolean;
  fastDayCalories?: number;
}

export default function LogMealModal({ open, onClose, onLogged, isFastDay = false, fastDayCalories = 0 }: Props) {
  const [mealType, setMealType] = useState(MEAL_TYPES[0].value);
  const [ingredients, setIngredients] = useState<SelectedIngredient[]>([]);
  const [customName, setCustomName] = useState("");
  const [quality, setQuality] = useState("ok");
  const [saving, setSaving] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);

  // Ingredient picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredFoods = useMemo(() => {
    if (!search.trim()) return FOOD_DATABASE;
    const q = search.toLowerCase();
    return FOOD_DATABASE.filter((f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
  }, [search]);

  const totalCalories = ingredients.reduce((s, i) => s + i.calories * i.qty, 0);
  const foodName = ingredients.length > 0
    ? ingredients.map((i) => `${i.qty > 1 ? i.qty + "x " : ""}${i.name}`).join(" + ")
    : customName;

  if (!open) return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = logDate === todayStr;
  const now = new Date();
  const hour = now.getHours();
  const isOutsideWindow = isToday && (hour < 12 || hour >= 20);

  const addIngredient = (food: FoodItem) => {
    const existing = ingredients.find((i) => i.name === food.name);
    if (existing) {
      setIngredients(ingredients.map((i) => i.name === food.name ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setIngredients([...ingredients, { name: food.name, calories: food.calories, portion: food.portion, category: food.category, qty: 1 }]);
    }
    setPickerOpen(false);
    setSearch("");
  };

  const removeIngredient = (name: string) => {
    setIngredients(ingredients.filter((i) => i.name !== name));
  };

  const save = async () => {
    if (!foodName.trim()) {
      toast({ title: "Add ingredients or enter a food name", variant: "destructive" });
      return;
    }
    if (isOutsideWindow && !showOverride) {
      setShowOverride(true);
      return;
    }
    setSaving(true);
    // Build timestamp for selected date
    const d = new Date(logDate);
    const logTimestamp = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 13, 0, 0).toISOString();

    const result = await logMeal({
      meal_type: mealType,
      food_name: foodName,
      calories: totalCalories || undefined,
      quality,
      is_healthy: quality === "good",
      protein_g: undefined,
      carbs_g: undefined,
      fat_g: undefined,
      is_fast_day_meal: isFastDay,
      fast_day_running_calories: isFastDay ? fastDayCalories + totalCalories : undefined,
      logged_at: logTimestamp,
    });
    setSaving(false);
    if (result) {
      toast({ title: "Meal logged", description: `${mealType}: ${foodName}${!isToday ? ` (${new Date(logDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })})` : ""}` });
      onLogged();
      onClose();
      setIngredients([]);
      setCustomName("");
      setShowOverride(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-xl p-6 max-w-md w-full shadow-xl border border-border max-h-[90vh] overflow-y-auto">
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
          </div>
        )}

        <div className="space-y-4">
          {/* Date picker */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Date
            </label>
            <input
              type="date"
              value={logDate}
              max={todayStr}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {!isToday && (
              <p className="text-[10px] text-warning mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Logging for: {new Date(logDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            )}
          </div>

          {/* Meal type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Meal Type *</label>
            <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30">
              {MEAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Selected ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Ingredients</label>
              {totalCalories > 0 && (
                <span className="text-xs font-bold text-primary">{totalCalories} kcal total</span>
              )}
            </div>

            {ingredients.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {ingredients.map((ing) => (
                  <div key={ing.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[ing.category] || CATEGORY_COLORS.Other}`}>
                        {ing.category}
                      </span>
                      <span className="text-sm text-foreground truncate">{ing.qty > 1 ? `${ing.qty}x ` : ""}{ing.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">({ing.portion})</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="text-xs font-medium text-foreground">{ing.calories * ing.qty} kcal</span>
                      <button onClick={() => removeIngredient(ing.name)} className="text-muted-foreground hover:text-destructive transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add ingredient button */}
            <button
              onClick={() => setPickerOpen(true)}
              className="w-full py-2.5 rounded-lg border-2 border-dashed border-border hover:border-primary/40 text-sm text-muted-foreground hover:text-primary transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add ingredient
            </button>
          </div>

          {/* Or type custom food */}
          {ingredients.length === 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Or type food name</label>
              <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Grilled chicken salad..." className="w-full mt-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          )}

          {/* Quality */}
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
        </div>

        {showOverride && (
          <div className="mt-3 p-3 bg-warning/10 rounded-lg text-xs text-foreground">
            You're logging outside the 12pm-8pm eating window. Click again to confirm.
          </div>
        )}

        <button onClick={save} disabled={saving} className="w-full mt-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition disabled:opacity-50">
          {saving ? "Saving..." : showOverride ? "Confirm Override & Log" : "Log Meal"}
        </button>
      </motion.div>

      {/* ── Ingredient Picker Modal ── */}
      <AnimatePresence>
        {pickerOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => { setPickerOpen(false); setSearch(""); }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search header */}
              <div className="p-4 border-b border-border">
                <p className="text-sm font-display font-bold text-foreground mb-2">Add ingredient</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search... e.g. chicken, eggplant, cake"
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="overflow-y-auto max-h-[50vh]">
                {filteredFoods.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No results for "{search}"
                  </div>
                ) : (
                  filteredFoods.map((food) => {
                    const isAdded = ingredients.some((i) => i.name === food.name);
                    return (
                      <button
                        key={food.name}
                        onClick={() => addIngredient(food)}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-accent/50 transition border-b border-border/50 last:border-0 ${isAdded ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">{food.name}</span>
                            {isAdded && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[food.category] || CATEGORY_COLORS.Other}`}>
                              {food.category}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{food.portion}</span>
                            {food.maxPerWeek && (
                              <span className="text-[9px] text-warning">Max {food.maxPerWeek}x/week</span>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                          food.calories < 60 ? "bg-success/15 text-success" : food.calories < 100 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"
                        }`}>
                          {food.calories} kcal
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Close button */}
              <div className="p-3 border-t border-border">
                <button onClick={() => { setPickerOpen(false); setSearch(""); }} className="w-full py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-accent transition">
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
