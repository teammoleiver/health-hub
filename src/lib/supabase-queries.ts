import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { emitSync } from "./sync-events";

// ── Helpers ──
const today = () => new Date().toISOString().split("T")[0];

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};

// ── User Profile ──
export async function getUserProfile() {
  const { data, error } = await supabase.from("user_profile").select("*").limit(1).single();
  if (error && error.code !== "PGRST116") console.error("getUserProfile", error);
  return data;
}

export async function updateUserProfile(updates: TablesUpdate<"user_profile">) {
  const profile = await getUserProfile();
  if (!profile) return null;
  const { data, error } = await supabase.from("user_profile").update(updates).eq("id", profile.id).select().single();
  if (error) console.error("updateUserProfile", error);
  return data;
}

// ── Water Logs ──
export async function getTodayWaterLog() {
  const { data, error } = await supabase.from("water_logs").select("*").eq("logged_date", today()).maybeSingle();
  if (error) console.error("getTodayWaterLog", error);
  return data;
}

export async function upsertWaterLog(glasses: number, mlTotal?: number) {
  const ml = mlTotal ?? glasses * 250;
  const existing = await getTodayWaterLog();
  if (existing) {
    const { data, error } = await supabase
      .from("water_logs")
      .update({ glasses, ml_total: ml })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) console.error("upsertWaterLog update", error);
    if (data) emitSync("water:updated");
    return data;
  }
  const { data, error } = await supabase
    .from("water_logs")
    .insert({ glasses, ml_total: ml, logged_date: today() })
    .select()
    .single();
  if (error) console.error("upsertWaterLog insert", error);
  if (data) emitSync("water:updated");
  return data;
}

export async function getWaterHistory(limit = 30) {
  const { data, error } = await supabase
    .from("water_logs")
    .select("*")
    .order("logged_date", { ascending: false })
    .limit(limit);
  if (error) console.error("getWaterHistory", error);
  return data ?? [];
}

// ── Weight Logs ──
export async function getWeightHistory() {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .order("logged_at", { ascending: true });
  if (error) console.error("getWeightHistory", error);
  return data ?? [];
}

export async function getLatestWeight() {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) console.error("getLatestWeight", error);
  return data;
}

export async function logWeight(weightKg: number, options?: { waist_cm?: number; notes?: string; body_fat_pct?: number }, loggedAt?: string) {
  const heightM = 1.71;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  const { data, error } = await supabase
    .from("weight_logs")
    .insert({ weight_kg: weightKg, bmi, ...options, ...(loggedAt ? { logged_at: loggedAt } : {}) })
    .select()
    .single();
  if (error) console.error("logWeight", error);
  if (data) emitSync("weight:logged");
  return data;
}

// ── Exercise Logs ──
export async function logExercise(entry: TablesInsert<"exercise_logs">) {
  const { data, error } = await supabase.from("exercise_logs").insert(entry).select().single();
  if (error) console.error("logExercise", error);
  if (data) {
    await upsertChecklist({ exercise_done: true });
    emitSync("exercise:logged");
  }
  return data;
}

export async function getTodayExercise() {
  const { data, error } = await supabase
    .from("exercise_logs")
    .select("*")
    .gte("logged_at", today() + "T00:00:00")
    .lte("logged_at", today() + "T23:59:59")
    .limit(1)
    .maybeSingle();
  if (error) console.error("getTodayExercise", error);
  return data;
}

export async function getMonthExerciseLogs() {
  const { data, error } = await supabase
    .from("exercise_logs")
    .select("*")
    .gte("logged_at", startOfMonth())
    .order("logged_at", { ascending: false });
  if (error) console.error("getMonthExerciseLogs", error);
  return data ?? [];
}

export async function getAllExerciseLogs(limit = 90) {
  const { data, error } = await supabase
    .from("exercise_logs")
    .select("*")
    .order("logged_at", { ascending: false })
    .limit(limit);
  if (error) console.error("getAllExerciseLogs", error);
  return data ?? [];
}

// ── Meal Logs ──
export async function logMeal(entry: TablesInsert<"meal_logs">) {
  const { data, error } = await supabase.from("meal_logs").insert(entry).select().single();
  if (error) console.error("logMeal", error);
  if (data) emitSync("meal:logged");
  return data;
}

export async function getTodayMeals() {
  const { data, error } = await supabase
    .from("meal_logs")
    .select("*")
    .gte("logged_at", today() + "T00:00:00")
    .lte("logged_at", today() + "T23:59:59")
    .order("logged_at", { ascending: true });
  if (error) console.error("getTodayMeals", error);
  return data ?? [];
}

export async function getAllMealLogs(limit = 90) {
  const { data, error } = await supabase
    .from("meal_logs")
    .select("*")
    .order("logged_at", { ascending: false })
    .limit(limit);
  if (error) console.error("getAllMealLogs", error);
  return data ?? [];
}

// ── Daily Checklist ──
export async function getTodayChecklist() {
  const { data, error } = await supabase
    .from("daily_checklist")
    .select("*")
    .eq("checklist_date", today())
    .maybeSingle();
  if (error) console.error("getTodayChecklist", error);
  return data;
}

export async function upsertChecklist(updates: Partial<TablesUpdate<"daily_checklist">>) {
  const existing = await getTodayChecklist();
  if (existing) {
    const { data, error } = await supabase
      .from("daily_checklist")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) console.error("upsertChecklist update", error);
    if (data) emitSync("checklist:updated");
    return data;
  }
  const { data, error } = await supabase
    .from("daily_checklist")
    .insert({ checklist_date: today(), ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) console.error("upsertChecklist insert", error);
  if (data) emitSync("checklist:updated");
  return data;
}

// ── Fasting Logs ──
export async function getFastingLogs(limit = 30) {
  const { data, error } = await supabase
    .from("fasting_logs")
    .select("*")
    .order("logged_date", { ascending: false })
    .limit(limit);
  if (error) console.error("getFastingLogs", error);
  return data ?? [];
}

// ── Fasting 5:2 Schedule ──
export function getWeekStartDate(d = new Date()) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().split("T")[0];
}

export async function getFasting52Schedule(weekStart?: string) {
  const ws = weekStart ?? getWeekStartDate();
  const { data, error } = await supabase
    .from("fasting_52_schedule")
    .select("*")
    .eq("week_start_date", ws)
    .maybeSingle();
  if (error) console.error("getFasting52Schedule", error);
  return data;
}

export async function upsertFasting52Schedule(schedule: TablesInsert<"fasting_52_schedule">) {
  const existing = await getFasting52Schedule(schedule.week_start_date);
  if (existing) {
    const { data, error } = await supabase
      .from("fasting_52_schedule")
      .update(schedule)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) console.error("upsertFasting52Schedule", error);
    return data;
  }
  const { data, error } = await supabase
    .from("fasting_52_schedule")
    .insert(schedule)
    .select()
    .single();
  if (error) console.error("upsertFasting52Schedule insert", error);
  return data;
}

// ── AI Chat History ──
export async function getChatHistory(limit = 50) {
  const { data, error } = await supabase
    .from("ai_chat_history")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) console.error("getChatHistory", error);
  return data ?? [];
}

export async function saveChatMessage(role: string, content: string, module_context?: string) {
  const { data, error } = await supabase
    .from("ai_chat_history")
    .insert({ role, content, module_context })
    .select()
    .single();
  if (error) console.error("saveChatMessage", error);
  return data;
}

export async function clearChatHistory() {
  const { error } = await supabase.from("ai_chat_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) console.error("clearChatHistory", error);
}

// ── Goals ──
export async function getGoals() {
  const { data, error } = await supabase.from("goals").select("*").order("created_at", { ascending: true });
  if (error) console.error("getGoals", error);
  return data ?? [];
}

export async function updateGoal(id: string, updates: TablesUpdate<"goals">) {
  const { data, error } = await supabase.from("goals").update(updates).eq("id", id).select().single();
  if (error) console.error("updateGoal", error);
  return data;
}

// ── Blood Test Records ──
export async function getBloodTestRecords() {
  const { data, error } = await supabase
    .from("blood_test_records")
    .select("*")
    .order("test_date", { ascending: true });
  if (error) console.error("getBloodTestRecords", error);
  return data ?? [];
}

export async function getAppliedBloodTestRecords() {
  const { data, error } = await supabase
    .from("blood_test_records")
    .select("*")
    .eq("applied", true)
    .order("test_date", { ascending: true });
  if (error) console.error("getAppliedBloodTestRecords", error);
  return data ?? [];
}

export async function saveBloodTestRecord(record: {
  test_date: string;
  source: string;
  file_name?: string;
  weight_kg?: number | null;
  bmi?: number | null;
  markers: any;
  summary?: string;
  recommendations?: string[];
  risk_factors?: string[];
  pdf_storage_path?: string;
}) {
  const { data, error } = await supabase
    .from("blood_test_records")
    .insert({
      test_date: record.test_date,
      source: record.source,
      file_name: record.file_name,
      weight_kg: record.weight_kg,
      bmi: record.bmi,
      markers: record.markers,
      summary: record.summary,
      recommendations: record.recommendations ?? [],
      risk_factors: record.risk_factors ?? [],
      pdf_storage_path: record.pdf_storage_path,
      applied: false,
      analyzed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) console.error("saveBloodTestRecord", error);
  return data;
}

export async function applyBloodTestRecord(id: string) {
  const { data, error } = await supabase
    .from("blood_test_records")
    .update({ applied: true })
    .eq("id", id)
    .select()
    .single();
  if (error) console.error("applyBloodTestRecord", error);
  return data;
}

export async function declineBloodTestRecord(id: string) {
  const { data, error } = await supabase
    .from("blood_test_records")
    .update({ applied: false })
    .eq("id", id)
    .select()
    .single();
  if (error) console.error("declineBloodTestRecord", error);
  return data;
}

export async function deleteBloodTestRecord(id: string) {
  const { error } = await supabase.from("blood_test_records").delete().eq("id", id);
  if (error) console.error("deleteBloodTestRecord", error);
}

// ── Sleep Logs ──
export async function getSleepLogs(limit = 30) {
  const { data, error } = await supabase
    .from("sleep_logs")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);
  if (error) console.error("getSleepLogs", error);
  return data ?? [];
}

export async function saveSleepLog(log: {
  date: string;
  bedtime: string;
  wake_time: string;
  total_hours: number;
  quality: number;
  wake_ups?: number;
  notes?: string;
  late_eating?: boolean;
  exercise_today?: boolean;
  screen_before_bed?: boolean;
  caffeine_after_2pm?: boolean;
  stress_level?: number;
  morning_feeling?: number;
}) {
  // Upsert by date (unique)
  const { data: existing } = await supabase
    .from("sleep_logs")
    .select("id")
    .eq("date", log.date)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("sleep_logs")
      .update(log)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) console.error("saveSleepLog update", error);
    return data;
  }
  const { data, error } = await supabase
    .from("sleep_logs")
    .insert(log)
    .select()
    .single();
  if (error) console.error("saveSleepLog insert", error);
  return data;
}

// ── Checklist Stats ──
export async function getChecklistStats() {
  const { data, error } = await supabase
    .from("daily_checklist")
    .select("*")
    .order("checklist_date", { ascending: false })
    .limit(90);
  if (error) console.error("getChecklistStats", error);
  return data ?? [];
}
