import { useState, useRef, useEffect } from "react";
import { FileUp, Download, Loader2, Sparkles, X, CalendarDays, ChefHat, Info, Utensils } from "lucide-react";
import { generateMenuCsvTemplate, parseMenuCsv, saveMenuPlan, getActiveMenuPlan } from "@/lib/food-queries";
import { getUserProfile } from "@/lib/supabase-queries";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FoodSearchInput from "./FoodSearchInput";
import type { FoodDbItem } from "@/lib/food-queries";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeeklyMenuUpload() {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showSample, setShowSample] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load existing plan
  useEffect(() => {
    getActiveMenuPlan().then((p) => {
      if (p?.plan_data) {
        setPlan({ days: p.plan_data, aiAnalysis: p.ai_analysis, id: p.id, weekLabel: p.week_label });
      }
    });
  }, []);

  const downloadTemplate = () => {
    const csv = generateMenuCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "weekly_menu_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const { days, errors } = parseMenuCsv(text);

      if (errors.length > 0) {
        toast({ title: "CSV errors", description: errors.join(". "), variant: "destructive" });
        setUploading(false);
        return;
      }

      if (days.length === 0) {
        toast({ title: "Empty CSV", description: "No meal data found in the file.", variant: "destructive" });
        setUploading(false);
        return;
      }

      setUploading(false);
      setAnalyzing(true);

      // Try AI analysis
      let aiAnalysis = null;
      try {
        const profile = await getUserProfile();
        const apiKey = profile?.openai_api_key;
        if (apiKey) {
          const { data: res } = await supabase.functions.invoke("health-chat", {
            body: {
              messages: [
                {
                  role: "system",
                  content: `You are a nutrition analyst. Analyze this weekly meal plan and return JSON:
{
  "overallScore": number (1-10),
  "dailyCalorieAvg": number,
  "macroBalance": { "protein_pct": number, "carbs_pct": number, "fat_pct": number },
  "strengths": ["string"],
  "improvements": ["string"],
  "dayNotes": { "Monday": "note", ... }
}
Only return valid JSON.`
                },
                { role: "user", content: `Analyze this weekly menu plan:\n${JSON.stringify(days)}` }
              ],
              apiKey,
            },
          });
          const responseText = typeof res === "string" ? res : res?.reply || res?.content || JSON.stringify(res);
          const jsonMatch = responseText?.match(/\{[\s\S]*\}/);
          if (jsonMatch) aiAnalysis = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.warn("AI analysis skipped:", err);
      }

      // Save to DB
      const weekLabel = `Week of ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
      await saveMenuPlan(days, weekLabel, aiAnalysis);
      setPlan({ days, aiAnalysis, weekLabel });
      setSelectedDay(days[0]?.day || null);
      toast({ title: "Menu uploaded!", description: `${days.length} days with ${days.reduce((s: number, d: any) => s + d.meals.length, 0)} meals.` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const addFoodToDay = (day: string, food: FoodDbItem) => {
    if (!plan) return;
    const updatedDays = plan.days.map((d: any) => {
      if (d.day === day) {
        return {
          ...d,
          meals: [...d.meals, {
            mealType: "Meal",
            foodName: food.food_name,
            calories: food.kcal_per_serving || food.kcal_per_100g,
            protein_g: food.protein_per_serving || food.protein_g,
            carbs_g: food.carbs_per_serving || food.carbs_g,
            fat_g: food.fat_per_serving || food.fat_g,
            quantity: food.serving_g,
            unit: "g",
            notes: food.serving_description || "",
          }],
        };
      }
      return d;
    });
    setPlan({ ...plan, days: updatedDays });
    saveMenuPlan(updatedDays, plan.weekLabel, plan.aiAnalysis);
  };

  const removeMeal = (dayName: string, mealIdx: number) => {
    if (!plan) return;
    const updatedDays = plan.days.map((d: any) => {
      if (d.day === dayName) {
        return { ...d, meals: d.meals.filter((_: any, i: number) => i !== mealIdx) };
      }
      return d;
    });
    setPlan({ ...plan, days: updatedDays });
    saveMenuPlan(updatedDays, plan.weekLabel, plan.aiAnalysis);
  };

  const currentDay = plan?.days?.find((d: any) => d.day === selectedDay);

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> Weekly Menu Plan
        </h3>
        {plan && (
          <button onClick={() => { setPlan(null); setSelectedDay(null); }} className="text-xs text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!plan ? (
        <div className="space-y-3">
          {/* Sample popup */}
          <button onClick={() => setShowSample(!showSample)} className="text-xs text-primary hover:underline flex items-center gap-1">
            <Info className="w-3 h-3" /> {showSample ? "Hide" : "View"} CSV format & sample
          </button>

          {showSample && (
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3 border border-border">
              <p className="text-xs font-semibold text-foreground">Required CSV columns:</p>
              <div className="overflow-x-auto">
                <table className="text-[10px] text-muted-foreground w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Day", "Meal Type", "Food Item", "Quantity", "Unit", "Calories", "Protein (g)", "Carbs (g)", "Fat (g)", "Notes"].map(h => (
                        <th key={h} className="px-2 py-1 text-left font-semibold text-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30">
                      <td className="px-2 py-1">Monday</td>
                      <td className="px-2 py-1">Lunch</td>
                      <td className="px-2 py-1">Grilled Chicken</td>
                      <td className="px-2 py-1">150</td>
                      <td className="px-2 py-1">g</td>
                      <td className="px-2 py-1">248</td>
                      <td className="px-2 py-1">46</td>
                      <td className="px-2 py-1">0</td>
                      <td className="px-2 py-1">5</td>
                      <td className="px-2 py-1">With salad</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1">Monday</td>
                      <td className="px-2 py-1">Dinner</td>
                      <td className="px-2 py-1">Salmon</td>
                      <td className="px-2 py-1">120</td>
                      <td className="px-2 py-1">g</td>
                      <td className="px-2 py-1">250</td>
                      <td className="px-2 py-1">25</td>
                      <td className="px-2 py-1">0</td>
                      <td className="px-2 py-1">16</td>
                      <td className="px-2 py-1">Baked</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button onClick={downloadTemplate} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition">
                <Download className="w-3.5 h-3.5" /> Download CSV Template
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept=".csv" onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || analyzing}
            className="w-full py-8 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="w-8 h-8 text-primary animate-spin" /><span className="text-sm text-muted-foreground">Reading CSV...</span></>
            ) : analyzing ? (
              <><Sparkles className="w-8 h-8 text-primary animate-pulse" /><span className="text-sm text-muted-foreground">AI analyzing your menu...</span></>
            ) : (
              <><FileUp className="w-8 h-8 text-muted-foreground" /><span className="text-sm font-medium text-foreground">Upload Weekly Menu CSV</span><span className="text-xs text-muted-foreground">AI will analyze nutrition & balance</span></>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plan.weekLabel && <p className="text-xs text-muted-foreground">{plan.weekLabel}</p>}

          {/* AI Analysis Summary */}
          {plan.aiAnalysis && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">AI Analysis</span>
                <span className="text-xs font-bold text-primary">{plan.aiAnalysis.overallScore}/10</span>
              </div>
              {plan.aiAnalysis.dailyCalorieAvg && (
                <p className="text-[10px] text-muted-foreground">Avg daily: {plan.aiAnalysis.dailyCalorieAvg} kcal</p>
              )}
              {plan.aiAnalysis.macroBalance && (
                <div className="flex gap-3 text-[10px]">
                  <span className="text-blue-400">P: {plan.aiAnalysis.macroBalance.protein_pct}%</span>
                  <span className="text-warning">C: {plan.aiAnalysis.macroBalance.carbs_pct}%</span>
                  <span className="text-orange-400">F: {plan.aiAnalysis.macroBalance.fat_pct}%</span>
                </div>
              )}
              {plan.aiAnalysis.strengths?.length > 0 && (
                <div className="text-[10px] text-success">✓ {plan.aiAnalysis.strengths.slice(0, 2).join(" • ")}</div>
              )}
              {plan.aiAnalysis.improvements?.length > 0 && (
                <div className="text-[10px] text-warning">↑ {plan.aiAnalysis.improvements.slice(0, 2).join(" • ")}</div>
              )}
            </div>
          )}

          {/* Day tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {plan.days.map((d: any) => (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  selectedDay === d.day ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.day.slice(0, 3)}
                <span className="ml-1 opacity-70">({d.meals.length})</span>
              </button>
            ))}
          </div>

          {/* Day meals */}
          {currentDay && (
            <div className="space-y-2">
              {plan.aiAnalysis?.dayNotes?.[currentDay.day] && (
                <p className="text-[10px] text-muted-foreground italic bg-secondary/30 rounded-lg px-3 py-1.5">
                  💡 {plan.aiAnalysis.dayNotes[currentDay.day]}
                </p>
              )}
              {currentDay.meals.map((meal: any, mi: number) => {
                const dayCals = currentDay.meals.reduce((s: number, m: any) => s + (m.calories || 0), 0);
                return (
                  <div key={mi} className="flex items-start justify-between p-3 rounded-lg bg-secondary/30 hover:bg-accent/30 transition group">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-primary uppercase">{meal.mealType}</span>
                        {meal.quantity && <span className="text-[10px] text-muted-foreground">{meal.quantity}{meal.unit}</span>}
                      </div>
                      <p className="text-sm text-foreground">{meal.foodName}</p>
                      {(meal.protein_g || meal.carbs_g || meal.fat_g) && (
                        <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                          {meal.protein_g && <span>P: {meal.protein_g}g</span>}
                          {meal.carbs_g && <span>C: {meal.carbs_g}g</span>}
                          {meal.fat_g && <span>F: {meal.fat_g}g</span>}
                        </div>
                      )}
                      {meal.notes && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{meal.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {meal.calories && <span className="text-xs text-muted-foreground">{meal.calories} kcal</span>}
                      <button onClick={() => removeMeal(currentDay.day, mi)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Day total */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 text-xs">
                <span className="font-medium text-foreground">{currentDay.day} Total</span>
                <span className="font-bold text-primary">
                  {currentDay.meals.reduce((s: number, m: any) => s + (m.calories || 0), 0)} kcal
                </span>
              </div>

              {/* Add food from DB */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Add food from database:</p>
                <FoodSearchInput
                  onSelect={(food) => addFoodToDay(currentDay.day, food)}
                  placeholder={`Add food to ${currentDay.day}...`}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
