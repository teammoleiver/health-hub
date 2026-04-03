import { supabase } from "@/integrations/supabase/client";

export interface FoodDbItem {
  id: string;
  food_name: string;
  category: string;
  kcal_per_100g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  serving_g: number | null;
  serving_description: string | null;
  kcal_per_serving: number | null;
  protein_per_serving: number | null;
  fat_per_serving: number | null;
  carbs_per_serving: number | null;
  pcs_per_kg: string | null;
  source_menu: string | null;
}

export async function searchFoodDatabase(query: string, limit = 30): Promise<FoodDbItem[]> {
  if (!query.trim()) {
    const { data } = await supabase
      .from("food_database")
      .select("*")
      .order("food_name")
      .limit(limit);
    return (data as FoodDbItem[]) ?? [];
  }
  const { data } = await supabase
    .from("food_database")
    .select("*")
    .ilike("food_name", `%${query}%`)
    .order("food_name")
    .limit(limit);
  return (data as FoodDbItem[]) ?? [];
}

export async function getFoodsByCategory(category: string): Promise<FoodDbItem[]> {
  const { data } = await supabase
    .from("food_database")
    .select("*")
    .eq("category", category)
    .order("food_name");
  return (data as FoodDbItem[]) ?? [];
}

export async function getAllCategories(): Promise<string[]> {
  const { data } = await supabase
    .from("food_database")
    .select("category")
    .order("category");
  const cats = new Set<string>();
  (data ?? []).forEach((r: any) => cats.add(r.category));
  return Array.from(cats);
}

// Weekly menu plans
export async function getActiveMenuPlan() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("weekly_menu_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function saveMenuPlan(planData: any[], weekLabel: string, aiAnalysis?: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // Deactivate old plans
  await supabase
    .from("weekly_menu_plans")
    .update({ status: "archived" } as any)
    .eq("user_id", user.id)
    .eq("status", "active");

  const { data, error } = await supabase
    .from("weekly_menu_plans")
    .insert({
      user_id: user.id,
      plan_data: planData,
      week_label: weekLabel,
      ai_analysis: aiAnalysis,
      status: "active",
    } as any)
    .select()
    .single();
  if (error) console.error("saveMenuPlan", error);
  return data;
}

// CSV template generation
export function generateMenuCsvTemplate(): string {
  const headers = ["Day", "Meal Type", "Food Item", "Quantity", "Unit", "Calories", "Protein (g)", "Carbs (g)", "Fat (g)", "Notes"];
  const sampleRows = [
    ["Monday", "Lunch", "Grilled Chicken Breast", "150", "g", "248", "46", "0", "5", "With mixed salad"],
    ["Monday", "Lunch", "Brown Rice", "80", "g", "90", "2", "19", "1", ""],
    ["Monday", "Snack", "Greek Yogurt", "150", "g", "130", "12", "5", "8", "With berries"],
    ["Monday", "Dinner", "Salmon Fillet", "120", "g", "250", "25", "0", "16", "Baked with lemon"],
    ["Tuesday", "Lunch", "Turkey Breast", "120", "g", "158", "30", "0", "3", ""],
    ["Tuesday", "Lunch", "Sweet Potato", "150", "g", "129", "2", "30", "0", "Baked"],
    ["Tuesday", "Dinner", "Eggs", "2", "pcs", "140", "12", "1", "10", "Scrambled"],
  ];
  return [headers.join(","), ...sampleRows.map(r => r.join(","))].join("\n");
}

export function parseMenuCsv(csvText: string): { days: any[]; errors: string[] } {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return { days: [], errors: ["CSV file is empty or has no data rows"] };

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const dayIdx = headers.findIndex(h => h === "day");
  const mealIdx = headers.findIndex(h => h.includes("meal"));
  const foodIdx = headers.findIndex(h => h.includes("food"));
  const qtyIdx = headers.findIndex(h => h.includes("quantity") || h === "qty");
  const unitIdx = headers.findIndex(h => h.includes("unit"));
  const calIdx = headers.findIndex(h => h.includes("calor") || h === "kcal");
  const protIdx = headers.findIndex(h => h.includes("protein"));
  const carbIdx = headers.findIndex(h => h.includes("carb"));
  const fatIdx = headers.findIndex(h => h.includes("fat"));
  const noteIdx = headers.findIndex(h => h.includes("note"));

  if (dayIdx === -1 || mealIdx === -1 || foodIdx === -1) {
    return { days: [], errors: ["Missing required columns: Day, Meal Type, Food Item"] };
  }

  const errors: string[] = [];
  const dayMap: Record<string, any[]> = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim());
    if (cols.length < 3 || !cols[dayIdx] || !cols[foodIdx]) continue;

    const day = cols[dayIdx];
    if (!dayMap[day]) dayMap[day] = [];
    dayMap[day].push({
      mealType: cols[mealIdx] || "Meal",
      foodName: cols[foodIdx],
      quantity: qtyIdx >= 0 ? parseFloat(cols[qtyIdx]) || null : null,
      unit: unitIdx >= 0 ? cols[unitIdx] || "g" : "g",
      calories: calIdx >= 0 ? parseInt(cols[calIdx]) || null : null,
      protein_g: protIdx >= 0 ? parseFloat(cols[protIdx]) || null : null,
      carbs_g: carbIdx >= 0 ? parseFloat(cols[carbIdx]) || null : null,
      fat_g: fatIdx >= 0 ? parseFloat(cols[fatIdx]) || null : null,
      notes: noteIdx >= 0 ? cols[noteIdx] || "" : "",
    });
  }

  const days = Object.entries(dayMap).map(([day, meals]) => ({ day, meals }));
  return { days, errors };
}
