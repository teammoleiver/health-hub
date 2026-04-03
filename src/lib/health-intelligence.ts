/**
 * Health Intelligence Layer
 * 
 * Aggregates data from ALL modules (sleep, nutrition, exercise, fasting,
 * weight, blood tests, checklist) into a unified health context.
 * Provides cross-module insights and AI-ready summaries.
 */

import {
  getTodayWaterLog, getTodayMeals, getTodayExercise, getLatestWeight,
  getTodayChecklist, getAppliedBloodTestRecords, getWeightHistory,
  getWaterHistory, getSleepLogs, getChecklistStats,
  getMonthExerciseLogs,
} from "./supabase-queries";
import { getRecentSnapshots } from "./daily-snapshot";
import { getFastingStatus, getHealthScore, BLOOD_TESTS, type BloodTest } from "./health-data";

// ── Types ──
export interface HealthIntelligence {
  // Today
  today: {
    water: { glasses: number; mlTotal: number; goalMet: boolean };
    meals: { count: number; totalCalories: number; items: string[] };
    exercise: { done: boolean; type: string | null; durationMin: number | null; calories: number | null };
    weight: { current: number; bmi: number | null; changeFromStart: number };
    fasting: { label: string; message: string; inEatingWindow: boolean; hoursElapsed: number };
    checklist: { completed: number; total: number; pct: number; items: Record<string, boolean> };
    sleep: { lastNight: { hours: number; quality: number; bedtime: string; wakeTime: string } | null };
  };
  // Trends (7-day and 30-day)
  trends: {
    weightTrend: { direction: "up" | "down" | "stable"; weeklyChange: number };
    sleepTrend: { avgHours: number; avgQuality: number; consistency: number };
    exerciseTrend: { sessionsThisWeek: number; sessionsThisMonth: number; avgDuration: number };
    waterCompliance: { last7days: number; last30days: number };
    checklistCompliance: { last7days: number; last30days: number };
    caloriesTrend: { avgDaily: number; trend: "up" | "down" | "stable" };
  };
  // Cross-module insights
  insights: Insight[];
  // Health score
  healthScore: number;
  // Blood markers summary
  bloodAlerts: string[];
  // Timestamp
  generatedAt: string;
}

export interface Insight {
  id: string;
  type: "warning" | "suggestion" | "positive" | "critical";
  icon: string;
  title: string;
  message: string;
  modules: string[]; // which modules this insight connects
}

// ── Main function ──
export async function gatherHealthIntelligence(): Promise<HealthIntelligence> {
  const [
    water, meals, exercise, weight, checklist,
    weightHistory, waterHistory, sleepLogs,
    checklistHistory, exerciseLogs, snapshots, bloodRecords,
  ] = await Promise.all([
    getTodayWaterLog(),
    getTodayMeals(),
    getTodayExercise(),
    getLatestWeight(),
    getTodayChecklist(),
    getWeightHistory(),
    getWaterHistory(30),
    getSleepLogs(30),
    getChecklistStats(),
    getMonthExerciseLogs(),
    getRecentSnapshots(30),
    getAppliedBloodTestRecords().catch(() => []),
  ]);

  const fasting = getFastingStatus();

  // ── Today ──
  const waterGlasses = water?.glasses ?? 0;
  const waterMl = water?.ml_total ?? waterGlasses * 250;
  const mealItems = (meals ?? []).map((m: any) => m.food_name);
  const totalCalories = (meals ?? []).reduce((s: number, m: any) => s + (m.calories ?? 0), 0);
  const currentWeight = weight ? Number(weight.weight_kg) : 88;
  const currentBmi = weight?.bmi ? Number(weight.bmi) : null;

  // Last night's sleep
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];
  const todayStr = new Date().toISOString().split("T")[0];
  const lastSleep = (sleepLogs as any[])?.find((s: any) => s.date === todayStr || s.date === yStr) ?? null;

  // Checklist
  const checklistKeys = ["water_goal_met", "exercise_done", "no_alcohol", "no_fried_food", "sunlight_done", "bedtime_ok", "healthy_breakfast"];
  const clItems: Record<string, boolean> = {};
  checklistKeys.forEach(k => { clItems[k] = !!(checklist as any)?.[k]; });
  const clCompleted = Object.values(clItems).filter(Boolean).length;

  // ── Trends ──
  // Weight
  const wh = (weightHistory ?? []) as any[];
  const recentWeights = wh.slice(-7);
  const weeklyWeightChange = recentWeights.length >= 2
    ? Number(recentWeights[recentWeights.length - 1].weight_kg) - Number(recentWeights[0].weight_kg)
    : 0;
  const weightDirection = Math.abs(weeklyWeightChange) < 0.2 ? "stable" : weeklyWeightChange > 0 ? "up" : "down";

  // Sleep
  const sleepArr = (sleepLogs as any[]) ?? [];
  const last7Sleep = sleepArr.slice(0, 7);
  const last30Sleep = sleepArr.slice(0, 30);
  const avgSleepHours = last7Sleep.length > 0 ? last7Sleep.reduce((s: number, l: any) => s + Number(l.total_hours), 0) / last7Sleep.length : 0;
  const avgSleepQuality = last7Sleep.length > 0 ? last7Sleep.reduce((s: number, l: any) => s + (Number(l.quality) || 3), 0) / last7Sleep.length : 0;
  
  // Sleep consistency (variance in bedtime)
  const bedtimes = last7Sleep.map((s: any) => {
    const [h, m] = (s.bedtime || "23:00").split(":").map(Number);
    return h * 60 + m;
  });
  const avgBedtime = bedtimes.length > 0 ? bedtimes.reduce((a: number, b: number) => a + b, 0) / bedtimes.length : 0;
  const bedtimeVariance = bedtimes.length > 0 ? Math.sqrt(bedtimes.reduce((s: number, b: number) => s + Math.pow(b - avgBedtime, 2), 0) / bedtimes.length) : 0;
  const sleepConsistency = Math.max(0, 100 - bedtimeVariance);

  // Exercise
  const exArr = (exerciseLogs ?? []) as any[];
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const exThisWeek = exArr.filter((e: any) => new Date(e.logged_at) >= weekAgo);
  const avgExDuration = exArr.length > 0 ? exArr.reduce((s: number, e: any) => s + (e.duration_min || 0), 0) / exArr.length : 0;

  // Water compliance
  const waterArr = (waterHistory ?? []) as any[];
  const water7 = waterArr.slice(0, 7).filter((w: any) => w.glasses >= 12).length;
  const water30 = waterArr.slice(0, 30).filter((w: any) => w.glasses >= 12).length;

  // Checklist compliance
  const clArr = (checklistHistory ?? []) as any[];
  const cl7 = clArr.slice(0, 7);
  const cl30 = clArr.slice(0, 30);
  const clCompliance7 = cl7.length > 0 ? Math.round(cl7.filter((c: any) => {
    const done = checklistKeys.filter(k => c[k] === true).length;
    return done >= 5;
  }).length / cl7.length * 100) : 0;
  const clCompliance30 = cl30.length > 0 ? Math.round(cl30.filter((c: any) => {
    const done = checklistKeys.filter(k => c[k] === true).length;
    return done >= 5;
  }).length / cl30.length * 100) : 0;

  // Calories trend from snapshots
  const snapshotArr = (snapshots ?? []) as any[];
  const calSnapshots = snapshotArr.filter((s: any) => s.total_calories > 0);
  const avgDailyCal = calSnapshots.length > 0 ? Math.round(calSnapshots.reduce((s: number, snap: any) => s + snap.total_calories, 0) / calSnapshots.length) : 0;

  // ── Blood alerts ──
  const dbTests: BloodTest[] = (bloodRecords as any[]).map((r: any) => ({
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
  const healthScore = getHealthScore(allTests);

  const latestTest = allTests[allTests.length - 1];
  const bloodAlerts = latestTest
    ? latestTest.markers.filter(m => m.status === "high" || m.status === "critical").map(m => `${m.testName}: ${m.value} ${m.unit} (${m.status})`)
    : [];

  // ── Cross-module Insights ──
  const insights = generateInsights({
    avgSleepHours, avgSleepQuality, sleepConsistency,
    lastSleep, exerciseDone: !!exercise, exThisWeek: exThisWeek.length,
    waterGlasses, totalCalories, currentWeight, currentBmi,
    fasting, bloodAlerts, weightDirection, weeklyWeightChange,
    avgDailyCal, clCompleted,
  });

  return {
    today: {
      water: { glasses: waterGlasses, mlTotal: waterMl, goalMet: waterMl >= 3000 },
      meals: { count: mealItems.length, totalCalories, items: mealItems },
      exercise: { done: !!exercise, type: exercise?.exercise_type ?? null, durationMin: exercise?.duration_min ?? null, calories: exercise?.calories ?? null },
      weight: { current: currentWeight, bmi: currentBmi, changeFromStart: currentWeight - 88 },
      fasting: { label: fasting.label, message: fasting.message, inEatingWindow: fasting.phase === "eating", hoursElapsed: fasting.elapsed ?? 0 },
      checklist: { completed: clCompleted, total: 7, pct: Math.round((clCompleted / 7) * 100), items: clItems },
      sleep: lastSleep ? { hours: Number(lastSleep.total_hours), quality: Number(lastSleep.quality) || 3, bedtime: lastSleep.bedtime, wakeTime: lastSleep.wake_time } : null,
    },
    trends: {
      weightTrend: { direction: weightDirection as any, weeklyChange: parseFloat(weeklyWeightChange.toFixed(1)) },
      sleepTrend: { avgHours: parseFloat(avgSleepHours.toFixed(1)), avgQuality: parseFloat(avgSleepQuality.toFixed(1)), consistency: parseFloat(sleepConsistency.toFixed(0)) },
      exerciseTrend: { sessionsThisWeek: exThisWeek.length, sessionsThisMonth: exArr.length, avgDuration: Math.round(avgExDuration) },
      waterCompliance: { last7days: Math.round((water7 / 7) * 100), last30days: Math.round((water30 / Math.max(waterArr.length, 1)) * 100) },
      checklistCompliance: { last7days: clCompliance7, last30days: clCompliance30 },
      caloriesTrend: { avgDaily: avgDailyCal, trend: "stable" },
    },
    insights,
    healthScore,
    bloodAlerts,
    generatedAt: new Date().toISOString(),
  };
}

// ── Build AI context string ──
export function buildAIContextFromIntelligence(intel: HealthIntelligence): string {
  const t = intel.today;
  const tr = intel.trends;

  return `
═══ REAL-TIME HEALTH INTELLIGENCE ═══
Generated: ${new Date(intel.generatedAt).toLocaleString()}

📊 HEALTH SCORE: ${intel.healthScore}/100

── TODAY'S STATUS ──
💧 Water: ${t.water.glasses}/12 glasses (${t.water.mlTotal}ml) — Goal ${t.water.goalMet ? "MET ✅" : "NOT met ❌"}
🍽️ Meals: ${t.meals.count} logged (${t.meals.totalCalories} kcal) — ${t.meals.items.join(", ") || "none"}
🏋️ Exercise: ${t.exercise.done ? `YES — ${t.exercise.type} ${t.exercise.durationMin}min ${t.exercise.calories ? t.exercise.calories + "kcal" : ""}` : "Not yet"}
⚖️ Weight: ${t.weight.current}kg (BMI: ${t.weight.bmi ?? "?"}) — ${t.weight.changeFromStart > 0 ? "+" : ""}${t.weight.changeFromStart.toFixed(1)}kg from start
⏱️ Fasting: ${t.fasting.label} — ${t.fasting.message}
😴 Last night sleep: ${t.sleep ? `${t.sleep.hours}h, quality ${t.sleep.quality}/5, bed ${t.sleep.bedtime}, wake ${t.sleep.wakeTime}` : "No data"}
✅ Checklist: ${t.checklist.completed}/${t.checklist.total} (${t.checklist.pct}%)

── 7-DAY TRENDS ──
⚖️ Weight trend: ${tr.weightTrend.direction} (${tr.weightTrend.weeklyChange > 0 ? "+" : ""}${tr.weightTrend.weeklyChange}kg this week)
😴 Sleep: avg ${tr.sleepTrend.avgHours}h, quality ${tr.sleepTrend.avgQuality}/5, consistency ${tr.sleepTrend.consistency}%
🏋️ Exercise: ${tr.exerciseTrend.sessionsThisWeek} sessions this week, ${tr.exerciseTrend.sessionsThisMonth} this month, avg ${tr.exerciseTrend.avgDuration}min
💧 Water compliance: ${tr.waterCompliance.last7days}% (7d), ${tr.waterCompliance.last30days}% (30d)
✅ Checklist compliance: ${tr.checklistCompliance.last7days}% (7d), ${tr.checklistCompliance.last30days}% (30d)
🔥 Avg daily calories: ${tr.caloriesTrend.avgDaily} kcal

── BLOOD MARKER ALERTS ──
${intel.bloodAlerts.length > 0 ? intel.bloodAlerts.join("\n") : "No critical alerts"}

── CROSS-MODULE INSIGHTS ──
${intel.insights.map(i => `[${i.type.toUpperCase()}] ${i.title}: ${i.message} (modules: ${i.modules.join(", ")})`).join("\n")}

── CURRENT TIME ──
${new Date().toLocaleString()}
`;
}

// ── Insight generator ──
interface InsightInput {
  avgSleepHours: number;
  avgSleepQuality: number;
  sleepConsistency: number;
  lastSleep: any;
  exerciseDone: boolean;
  exThisWeek: number;
  waterGlasses: number;
  totalCalories: number;
  currentWeight: number;
  currentBmi: number | null;
  fasting: any;
  bloodAlerts: string[];
  weightDirection: string;
  weeklyWeightChange: number;
  avgDailyCal: number;
  clCompleted: number;
}

function generateInsights(d: InsightInput): Insight[] {
  const insights: Insight[] = [];
  let id = 0;

  // Sleep ↔ Exercise connection
  if (d.avgSleepHours < 7 && d.exThisWeek < 3) {
    insights.push({
      id: `insight-${id++}`, type: "warning", icon: "😴",
      title: "Low sleep + low exercise",
      message: `You're averaging ${d.avgSleepHours}h sleep and only ${d.exThisWeek} workouts this week. Poor sleep reduces recovery and exercise motivation. Try a 30-min walk today to improve tonight's sleep.`,
      modules: ["sleep", "exercise"],
    });
  } else if (d.avgSleepHours >= 7.5 && d.exThisWeek >= 4) {
    insights.push({
      id: `insight-${id++}`, type: "positive", icon: "🌟",
      title: "Great sleep-exercise balance",
      message: `${d.avgSleepHours}h avg sleep + ${d.exThisWeek} workouts = excellent recovery cycle. Keep it up!`,
      modules: ["sleep", "exercise"],
    });
  }

  // Sleep ↔ Nutrition
  if (d.lastSleep && Number(d.lastSleep.late_eating) && d.avgSleepQuality < 3) {
    insights.push({
      id: `insight-${id++}`, type: "warning", icon: "🍽️",
      title: "Late eating affecting sleep",
      message: "Eating late correlates with your lower sleep quality. Stick to the 8PM cutoff — your IF window ends then anyway.",
      modules: ["sleep", "nutrition", "fasting"],
    });
  }

  // Hydration ↔ Sleep ↔ Exercise
  if (d.waterGlasses < 8 && d.avgSleepHours < 7) {
    insights.push({
      id: `insight-${id++}`, type: "suggestion", icon: "💧",
      title: "Dehydration may worsen sleep",
      message: `Only ${d.waterGlasses} glasses today. Dehydration can cause nighttime awakenings. Aim for 12 glasses, but stop 1h before bed.`,
      modules: ["nutrition", "sleep"],
    });
  }

  // Liver ↔ Exercise ↔ Nutrition
  if (d.bloodAlerts.some(a => a.includes("ALT"))) {
    insights.push({
      id: `insight-${id++}`, type: "critical", icon: "🫀",
      title: "Liver protection priority",
      message: "ALT remains critical. Combination needed: no alcohol, no fried foods, regular aerobic exercise (proven to reduce ALT), and Mediterranean-style eating. Your nutrition plan supports this.",
      modules: ["health", "nutrition", "exercise"],
    });
  }

  // Weight ↔ Sleep ↔ Exercise
  if (d.weightDirection === "up" && d.avgSleepHours < 7) {
    insights.push({
      id: `insight-${id++}`, type: "warning", icon: "⚖️",
      title: "Weight gain + poor sleep",
      message: `Weight trending up (+${d.weeklyWeightChange}kg) while sleeping <7h. Sleep deprivation increases ghrelin (hunger hormone) by up to 28%. Prioritize 7.5h+ tonight.`,
      modules: ["body", "sleep"],
    });
  }

  // Fasting ↔ Exercise timing
  if (d.fasting.phase === "fasting" && d.exerciseDone) {
    insights.push({
      id: `insight-${id++}`, type: "positive", icon: "⏱️",
      title: "Fasted exercise completed",
      message: "Exercising during fasting window enhances fat oxidation. Great strategy for your weight loss and liver health goals.",
      modules: ["fasting", "exercise", "body"],
    });
  }

  // Sleep consistency
  if (d.sleepConsistency < 70) {
    insights.push({
      id: `insight-${id++}`, type: "suggestion", icon: "🕐",
      title: "Irregular bedtime pattern",
      message: `Sleep consistency is ${d.sleepConsistency.toFixed(0)}%. Irregular bedtimes disrupt circadian rhythm, affecting metabolism and liver repair. Try setting a consistent 23:00 bedtime.`,
      modules: ["sleep"],
    });
  }

  // BMI ↔ Exercise priority
  if (d.currentBmi && d.currentBmi >= 30 && d.exThisWeek < 3) {
    insights.push({
      id: `insight-${id++}`, type: "suggestion", icon: "🏃",
      title: "Increase exercise for BMI reduction",
      message: `BMI is ${d.currentBmi.toFixed(1)} (obese range). With ${d.exThisWeek} sessions this week, try adding 2 more moderate sessions. Focus on lower body (EGYM BioAge: 70y) and core (63y).`,
      modules: ["exercise", "body", "health"],
    });
  }

  // Positive: good day overall
  if (d.clCompleted >= 5 && d.waterGlasses >= 10 && d.exerciseDone) {
    insights.push({
      id: `insight-${id++}`, type: "positive", icon: "🏆",
      title: "Excellent day so far!",
      message: `${d.clCompleted}/7 checklist items done, well hydrated, and exercised. This consistency is what drives real health improvements.`,
      modules: ["dashboard"],
    });
  }

  // Calorie suggestion based on exercise
  if (d.avgDailyCal > 0 && d.avgDailyCal > 1800 && d.exThisWeek < 3) {
    insights.push({
      id: `insight-${id++}`, type: "suggestion", icon: "🔥",
      title: "Calorie-exercise imbalance",
      message: `Averaging ${d.avgDailyCal} kcal/day with only ${d.exThisWeek} exercise sessions. Consider increasing activity or reducing portion sizes on rest days.`,
      modules: ["nutrition", "exercise"],
    });
  }

  return insights;
}
