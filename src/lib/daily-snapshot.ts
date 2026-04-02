import { supabase } from "@/integrations/supabase/client";
import {
  getTodayWaterLog, getTodayMeals, getTodayExercise,
  getLatestWeight, getTodayChecklist, getAppliedBloodTestRecords,
} from "./supabase-queries";
import { BLOOD_TESTS, getHealthScore, type BloodTest } from "./health-data";

const today = () => new Date().toISOString().split("T")[0];

/** Gather all daily data and save a snapshot */
export async function takeDailySnapshot(dateOverride?: string): Promise<boolean> {
  const snapshotDate = dateOverride || today();

  try {
    const [water, meals, exercise, weight, checklist] = await Promise.all([
      getTodayWaterLog(),
      getTodayMeals(),
      getTodayExercise(),
      getLatestWeight(),
      getTodayChecklist(),
    ]);

    // Water
    const waterMl = water?.ml_total ?? (water?.glasses ?? 0) * 250;
    const waterGlasses = water?.glasses ?? 0;
    const waterGoalMet = waterMl >= 3000;

    // Meals
    const mealsLogged = meals?.length ?? 0;
    const totalCalories = (meals ?? []).reduce((sum: number, m: any) => sum + (m.calories ?? 0), 0);

    // Exercise
    const exerciseDone = !!exercise;
    const exerciseType = exercise?.exercise_type ?? null;
    const exerciseDurationMin = exercise?.duration_min ?? null;
    const exerciseCalories = exercise?.calories ?? null;

    // Weight
    const weightKg = weight ? Number(weight.weight_kg) : null;
    const bmi = weight?.bmi ? Number(weight.bmi) : null;

    // Checklist
    const checklistKeys = [
      "water_goal_met", "exercise_done", "no_alcohol",
      "no_fried_food", "sunlight_done", "bedtime_ok", "healthy_breakfast",
    ] as const;
    const checklistCompleted = checklist
      ? checklistKeys.filter((k) => (checklist as any)[k] === true).length
      : 0;
    const checklistPct = Math.round((checklistCompleted / 7) * 100);

    // Health score (from applied blood tests)
    let healthScore: number | null = null;
    try {
      const dbRecords = await getAppliedBloodTestRecords();
      const dbTests: BloodTest[] = dbRecords.map((r: any) => ({
        id: r.id, date: r.test_date, source: r.source,
        weightKg: Number(r.weight_kg) || 0, bmi: Number(r.bmi) || 0,
        markers: (Array.isArray(r.markers) ? r.markers : []).map((m: any) => ({
          testName: m.testName, value: Number(m.value), unit: m.unit,
          referenceMin: m.referenceMin != null ? Number(m.referenceMin) : undefined,
          referenceMax: m.referenceMax != null ? Number(m.referenceMax) : undefined,
          status: m.status || "normal", category: m.category || "Other",
        })),
      }));
      const allTests = [...BLOOD_TESTS, ...dbTests].sort((a, b) => a.date.localeCompare(b.date));
      healthScore = getHealthScore(allTests);
    } catch {
      healthScore = getHealthScore();
    }

    // Upsert snapshot
    const { data: existing } = await supabase
      .from("daily_snapshots")
      .select("id")
      .eq("snapshot_date", snapshotDate)
      .maybeSingle();

    const snapshot = {
      snapshot_date: snapshotDate,
      water_ml: waterMl,
      water_glasses: waterGlasses,
      water_goal_met: waterGoalMet,
      meals_logged: mealsLogged,
      total_calories: totalCalories,
      exercise_done: exerciseDone,
      exercise_type: exerciseType,
      exercise_duration_min: exerciseDurationMin,
      exercise_calories: exerciseCalories,
      weight_kg: weightKg,
      bmi,
      fasting_completed: !!(checklist as any)?.if_16_8_completed || !!(checklist as any)?.healthy_breakfast,
      fasting_hours: null as number | null,
      checklist_completed: checklistCompleted,
      checklist_total: 7,
      checklist_pct: checklistPct,
      no_alcohol: !!(checklist as any)?.no_alcohol,
      no_fried_food: !!(checklist as any)?.no_fried_food,
      health_score: healthScore,
    };

    if (existing) {
      const { error } = await supabase
        .from("daily_snapshots")
        .update(snapshot)
        .eq("id", existing.id);
      if (error) { console.error("updateSnapshot", error); return false; }
    } else {
      const { error } = await supabase
        .from("daily_snapshots")
        .insert(snapshot);
      if (error) { console.error("insertSnapshot", error); return false; }
    }

    // Update goals with latest values
    await updateGoalsFromSnapshot(snapshot);

    console.log(`[DailySnapshot] Saved for ${snapshotDate}`);
    return true;
  } catch (err) {
    console.error("[DailySnapshot] Failed:", err);
    return false;
  }
}

/** Update goal current_values based on snapshot data */
async function updateGoalsFromSnapshot(snap: any) {
  try {
    const { data: goals } = await supabase.from("goals").select("*");
    if (!goals) return;

    for (const goal of goals) {
      let currentValue: number | null = null;

      switch (goal.goal_type) {
        case "weight_loss_m1":
        case "weight_loss_final":
          currentValue = snap.weight_kg ?? null;
          break;
        case "water_daily":
          currentValue = snap.water_glasses;
          break;
        case "if_compliance":
          currentValue = snap.fasting_completed ? 100 : 0;
          break;
      }

      if (currentValue !== null) {
        const achieved = goal.target_value !== null &&
          (goal.goal_type.startsWith("weight_loss")
            ? currentValue <= goal.target_value
            : currentValue >= goal.target_value);

        await supabase.from("goals").update({
          current_value: currentValue,
          ...(achieved && !goal.achieved ? { achieved: true, achieved_at: new Date().toISOString() } : {}),
        }).eq("id", goal.id);
      }
    }
  } catch (err) {
    console.error("[Goals] Update failed:", err);
  }
}

/** Get recent snapshots for trending */
export async function getRecentSnapshots(days = 30) {
  const { data, error } = await supabase
    .from("daily_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(days);
  if (error) console.error("getRecentSnapshots", error);
  return data ?? [];
}

/** Schedule the snapshot at 23:59 — call this once from app init */
let snapshotTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleEndOfDaySnapshot() {
  if (snapshotTimer) clearTimeout(snapshotTimer);

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0);

  // If 23:59 already passed today, schedule for tomorrow
  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }

  const msUntil = target.getTime() - now.getTime();
  console.log(`[DailySnapshot] Scheduled in ${Math.round(msUntil / 60000)} minutes (${target.toLocaleTimeString()})`);

  snapshotTimer = setTimeout(async () => {
    await takeDailySnapshot();
    // Schedule next day
    scheduleEndOfDaySnapshot();
  }, msUntil);
}

/** Also take a snapshot if the user opens the app and yesterday has no snapshot */
export async function checkMissedSnapshot() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];

  const { data } = await supabase
    .from("daily_snapshots")
    .select("id")
    .eq("snapshot_date", yStr)
    .maybeSingle();

  if (!data) {
    console.log("[DailySnapshot] Yesterday missing, taking snapshot now");
    // We can't get yesterday's exact data, but we save what we have as a marker
    await supabase.from("daily_snapshots").insert({
      snapshot_date: yStr,
      notes: "Auto-generated (missed end-of-day)",
    }).select().maybeSingle();
  }
}
