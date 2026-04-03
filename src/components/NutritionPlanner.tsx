import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileUp, Download, Loader2, Sparkles, X, CalendarDays, ChefHat,
  Info, Utensils, FileText, Upload, Table, FileSearch
} from "lucide-react";
import { generateMenuCsvTemplate, parseMenuCsv, saveMenuPlan, getActiveMenuPlan } from "@/lib/food-queries";
import { getUserProfile } from "@/lib/supabase-queries";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FoodSearchInput from "./FoodSearchInput";
import type { FoodDbItem } from "@/lib/food-queries";

type Tab = "weekly" | "pdf";

export default function NutritionPlanner() {
  const [activeTab, setActiveTab] = useState<Tab>("weekly");

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header with tabs */}
      <div className="flex items-center border-b border-border">
        <button
          onClick={() => setActiveTab("weekly")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all relative ${
            activeTab === "weekly"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Weekly Menu
          {activeTab === "weekly" && (
            <motion.div
              layoutId="nutrition-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
        <div className="w-px h-6 bg-border" />
        <button
          onClick={() => setActiveTab("pdf")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all relative ${
            activeTab === "pdf"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSearch className="w-4 h-4" />
          PDF Plan
          {activeTab === "pdf" && (
            <motion.div
              layoutId="nutrition-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "weekly" ? (
          <motion.div
            key="weekly"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <WeeklyMenuTab />
          </motion.div>
        ) : (
          <motion.div
            key="pdf"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <PdfPlanTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Weekly Menu Tab ─── */
function WeeklyMenuTab() {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showSample, setShowSample] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      if (errors.length > 0) { toast({ title: "CSV errors", description: errors.join(". "), variant: "destructive" }); setUploading(false); return; }
      if (days.length === 0) { toast({ title: "Empty CSV", description: "No meal data found.", variant: "destructive" }); setUploading(false); return; }
      setUploading(false);
      setAnalyzing(true);

      let aiAnalysis = null;
      try {
        const profile = await getUserProfile();
        const apiKey = profile?.openai_api_key;
        if (apiKey) {
          const { data: res } = await supabase.functions.invoke("health-chat", {
            body: {
              messages: [
                { role: "system", content: `You are a nutrition analyst. Analyze this weekly meal plan and return JSON:\n{\n  "overallScore": number (1-10),\n  "dailyCalorieAvg": number,\n  "macroBalance": { "protein_pct": number, "carbs_pct": number, "fat_pct": number },\n  "strengths": ["string"],\n  "improvements": ["string"],\n  "dayNotes": { "Monday": "note", ... }\n}\nOnly return valid JSON.` },
                { role: "user", content: `Analyze this weekly menu plan:\n${JSON.stringify(days)}` }
              ],
              apiKey,
            },
          });
          const responseText = typeof res === "string" ? res : res?.reply || res?.content || JSON.stringify(res);
          const jsonMatch = responseText?.match(/\{[\s\S]*\}/);
          if (jsonMatch) aiAnalysis = JSON.parse(jsonMatch[0]);
        }
      } catch (err) { console.warn("AI analysis skipped:", err); }

      const weekLabel = `Week of ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
      await saveMenuPlan(days, weekLabel, aiAnalysis);
      setPlan({ days, aiAnalysis, weekLabel });
      setSelectedDay(days[0]?.day || null);
      toast({ title: "Menu uploaded!", description: `${days.length} days with ${days.reduce((s: number, d: any) => s + d.meals.length, 0)} meals.` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploading(false); setAnalyzing(false); }
  };

  const addFoodToDay = (day: string, food: FoodDbItem) => {
    if (!plan) return;
    const updatedDays = plan.days.map((d: any) => {
      if (d.day === day) {
        return { ...d, meals: [...d.meals, { mealType: "Meal", foodName: food.food_name, calories: food.kcal_per_serving || food.kcal_per_100g, protein_g: food.protein_per_serving || food.protein_g, carbs_g: food.carbs_per_serving || food.carbs_g, fat_g: food.fat_per_serving || food.fat_g, quantity: food.serving_g, unit: "g", notes: food.serving_description || "" }] };
      }
      return d;
    });
    setPlan({ ...plan, days: updatedDays });
    saveMenuPlan(updatedDays, plan.weekLabel, plan.aiAnalysis);
  };

  const removeMeal = (dayName: string, mealIdx: number) => {
    if (!plan) return;
    const updatedDays = plan.days.map((d: any) => {
      if (d.day === dayName) return { ...d, meals: d.meals.filter((_: any, i: number) => i !== mealIdx) };
      return d;
    });
    setPlan({ ...plan, days: updatedDays });
    saveMenuPlan(updatedDays, plan.weekLabel, plan.aiAnalysis);
  };

  const currentDay = plan?.days?.find((d: any) => d.day === selectedDay);

  return (
    <div className="p-5 space-y-4">
      {plan && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{plan.weekLabel}</span>
          <button onClick={() => { setPlan(null); setSelectedDay(null); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      )}

      {!plan ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Upload a CSV file with your weekly meals</p>
            <button onClick={() => setShowSample(!showSample)} className="text-[11px] text-primary hover:underline flex items-center gap-1">
              <Info className="w-3 h-3" /> {showSample ? "Hide" : "CSV"} format
            </button>
          </div>

          <AnimatePresence>
            {showSample && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-secondary/40 rounded-lg p-4 space-y-3 border border-border/50">
                  <p className="text-[11px] font-semibold text-foreground">Required columns:</p>
                  <div className="overflow-x-auto -mx-1 px-1">
                    <table className="text-[10px] text-muted-foreground w-full">
                      <thead>
                        <tr className="border-b border-border">
                          {["Day", "Meal Type", "Food Item", "Qty", "Unit", "Cal", "P(g)", "C(g)", "F(g)", "Notes"].map(h => (
                            <th key={h} className="px-1.5 py-1 text-left font-semibold text-foreground whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/30">
                          <td className="px-1.5 py-1">Mon</td><td className="px-1.5 py-1">Lunch</td><td className="px-1.5 py-1">Grilled Chicken</td>
                          <td className="px-1.5 py-1">150</td><td className="px-1.5 py-1">g</td><td className="px-1.5 py-1">248</td>
                          <td className="px-1.5 py-1">46</td><td className="px-1.5 py-1">0</td><td className="px-1.5 py-1">5</td><td className="px-1.5 py-1">With salad</td>
                        </tr>
                        <tr>
                          <td className="px-1.5 py-1">Mon</td><td className="px-1.5 py-1">Dinner</td><td className="px-1.5 py-1">Salmon</td>
                          <td className="px-1.5 py-1">120</td><td className="px-1.5 py-1">g</td><td className="px-1.5 py-1">250</td>
                          <td className="px-1.5 py-1">25</td><td className="px-1.5 py-1">0</td><td className="px-1.5 py-1">16</td><td className="px-1.5 py-1">Baked</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button onClick={downloadTemplate} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition">
                    <Download className="w-3.5 h-3.5" /> Download Template
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <input ref={fileRef} type="file" accept=".csv" onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || analyzing}
            className="w-full py-10 border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center gap-2.5 hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-50 group"
          >
            {uploading ? (
              <><Loader2 className="w-7 h-7 text-primary animate-spin" /><span className="text-sm text-muted-foreground">Reading CSV...</span></>
            ) : analyzing ? (
              <><Sparkles className="w-7 h-7 text-primary animate-pulse" /><span className="text-sm text-muted-foreground">AI analyzing your menu...</span></>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                  <Table className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Upload Weekly Menu CSV</span>
                <span className="text-[11px] text-muted-foreground">AI will analyze nutrition & balance</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* AI Analysis */}
          {plan.aiAnalysis && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">AI Analysis</span>
                <span className="text-xs font-bold text-primary">{plan.aiAnalysis.overallScore}/10</span>
              </div>
              {plan.aiAnalysis.dailyCalorieAvg && <p className="text-[10px] text-muted-foreground">Avg daily: {plan.aiAnalysis.dailyCalorieAvg} kcal</p>}
              {plan.aiAnalysis.macroBalance && (
                <div className="flex gap-3 text-[10px]">
                  <span className="text-blue-400">P: {plan.aiAnalysis.macroBalance.protein_pct}%</span>
                  <span className="text-warning">C: {plan.aiAnalysis.macroBalance.carbs_pct}%</span>
                  <span className="text-orange-400">F: {plan.aiAnalysis.macroBalance.fat_pct}%</span>
                </div>
              )}
              {plan.aiAnalysis.strengths?.length > 0 && <div className="text-[10px] text-success">✓ {plan.aiAnalysis.strengths.slice(0, 2).join(" • ")}</div>}
              {plan.aiAnalysis.improvements?.length > 0 && <div className="text-[10px] text-warning">↑ {plan.aiAnalysis.improvements.slice(0, 2).join(" • ")}</div>}
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
                {d.day.slice(0, 3)} <span className="opacity-70">({d.meals.length})</span>
              </button>
            ))}
          </div>

          {currentDay && (
            <div className="space-y-2">
              {plan.aiAnalysis?.dayNotes?.[currentDay.day] && (
                <p className="text-[10px] text-muted-foreground italic bg-secondary/30 rounded-lg px-3 py-1.5">💡 {plan.aiAnalysis.dayNotes[currentDay.day]}</p>
              )}
              {currentDay.meals.map((meal: any, mi: number) => (
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
              ))}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 text-xs">
                <span className="font-medium text-foreground">{currentDay.day} Total</span>
                <span className="font-bold text-primary">{currentDay.meals.reduce((s: number, m: any) => s + (m.calories || 0), 0)} kcal</span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Add food from database:</p>
                <FoodSearchInput onSelect={(food) => addFoodToDay(currentDay.day, food)} placeholder={`Add food to ${currentDay.day}...`} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── PDF Plan Tab ─── */
function PdfPlanTab() {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" }); return; }
    setFileName(file.name);
    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
      setUploading(false);
      if (fullText.trim().length < 50) { toast({ title: "Could not read PDF", description: "The PDF appears empty or image-based.", variant: "destructive" }); return; }
      setAnalyzing(true);
      const profile = await getUserProfile();
      const apiKey = profile?.openai_api_key;
      if (!apiKey) { toast({ title: "API Key required", description: "Add your OpenAI API key in Settings.", variant: "destructive" }); setAnalyzing(false); return; }
      const res = await supabase.functions.invoke("health-chat", {
        body: {
          messages: [
            { role: "system", content: `You are a nutrition plan analyzer. Extract the meal plan and return JSON:\n{\n  "planName": "string",\n  "summary": "brief description",\n  "dailyCalorieTarget": number or null,\n  "days": [{ "day": "Monday", "meals": [{ "type": "Breakfast", "name": "desc", "calories": null, "protein_g": null, "carbs_g": null, "fat_g": null, "notes": "" }] }]\n}\nOnly valid JSON.` },
            { role: "user", content: `Analyze this nutrition plan:\n\n${fullText.substring(0, 8000)}` }
          ],
          apiKey,
        },
      });
      if (res.error) throw new Error(res.error.message);
      const responseText = typeof res.data === "string" ? res.data : res.data?.reply || res.data?.content || JSON.stringify(res.data);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setPlan(parsed);
        toast({ title: "Plan analyzed!", description: `Found ${parsed.days?.length || 0} days of meals.` });
      } else {
        toast({ title: "Could not parse plan", description: "AI could not extract a structured plan.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally { setUploading(false); setAnalyzing(false); }
  };

  return (
    <div className="p-5 space-y-4">
      {plan && (
        <div className="flex items-center justify-between">
          {plan.planName && <span className="text-sm font-medium text-foreground">{plan.planName}</span>}
          <button onClick={() => { setPlan(null); setFileName(null); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      )}

      {!plan ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Upload a nutrition plan PDF — AI will extract meals, macros & schedule</p>
          <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || analyzing}
            className="w-full py-10 border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center gap-2.5 hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-50 group"
          >
            {uploading ? (
              <><Loader2 className="w-7 h-7 text-primary animate-spin" /><span className="text-sm text-muted-foreground">Reading PDF...</span></>
            ) : analyzing ? (
              <><Sparkles className="w-7 h-7 text-primary animate-pulse" /><span className="text-sm text-muted-foreground">AI analyzing your plan...</span></>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                  <FileUp className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Upload Nutrition Plan PDF</span>
                <span className="text-[11px] text-muted-foreground">Supports meal plans, diet sheets & more</span>
              </>
            )}
          </button>
          {fileName && !plan && (
            <p className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> {fileName}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {plan.summary && <p className="text-xs text-muted-foreground">{plan.summary}</p>}
          {plan.dailyCalorieTarget && (
            <div className="text-xs text-muted-foreground">Daily target: <span className="font-medium text-foreground">{plan.dailyCalorieTarget} kcal</span></div>
          )}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {plan.days?.map((day: any, di: number) => (
              <div key={di} className="rounded-lg bg-secondary/30 p-3">
                <div className="text-xs font-bold text-primary uppercase mb-2">{day.day}</div>
                {day.meals?.map((meal: any, mi: number) => (
                  <div key={mi} className="flex items-start justify-between py-1.5 border-b border-border/30 last:border-0">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-muted-foreground">{meal.type}</span>
                      <p className="text-xs text-foreground">{meal.name}</p>
                      {(meal.protein_g || meal.carbs_g || meal.fat_g) && (
                        <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          {meal.protein_g && <span>P: {meal.protein_g}g</span>}
                          {meal.carbs_g && <span>C: {meal.carbs_g}g</span>}
                          {meal.fat_g && <span>F: {meal.fat_g}g</span>}
                        </div>
                      )}
                    </div>
                    {meal.calories && <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{meal.calories} kcal</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
