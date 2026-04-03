// Centralized health data store — dynamic per user
// USER_PROFILE is kept as a shape reference; actual data comes from DB profiles table
export const USER_PROFILE = {
  name: "",
  fullName: "",
  dateOfBirth: null as Date | null,
  age: 0,
  heightCm: 0,
  startingWeightKg: 0,
  targetWeightMonth1: 0,
  targetWeightFinal: 0,
  bmiAtStart: 0,
  bodyFatPct: 0,
  visceralFatLevel: 0,
  dietProtocol: "Intermittent Fasting 16:8",
  eatingWindowStart: 12,
  eatingWindowEnd: 20,
  fasting52Enabled: false,
  nutritionist: "",
  gymSystem: "",
  familyDoctor: "",
  occupationalDoctor: "",
  employer: "",
  conditions: [] as string[],
  lifestyle: "",
};

export interface HealthMarker {
  testName: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  status: "normal" | "borderline" | "high" | "low" | "critical";
  category: string;
}

export interface BloodTest {
  id: string;
  date: string;
  source: string;
  weightKg: number;
  bmi: number;
  markers: HealthMarker[];
}

// No hardcoded blood tests — all data comes from DB per user
export const BLOOD_TESTS: BloodTest[] = [];

export const EGYM_DATA = {
  bioAge: {
    overall: null as number | null,
    strength: null as number | null,
    upperBody: null as number | null,
    core: null as number | null,
    lowerBody: null as number | null,
    flexibility: null as number | null,
    metabolism: null as number | null,
    cardio: null as number | null,
  },
  strengthMeasurements: [] as { exercise: string; weight: number; trend: "up" | "down" | "stable" }[],
  muscleImbalances: [] as { weak: string; strong: string; focus: string }[],
  bodyComposition: {
    bmr: 0,
    bodyFatKg: 0,
    bodyFatPct: 0,
    fatFreeMassKg: 0,
    muscleMassKg: 0,
    bodyWaterL: 0,
    bodyProteinKg: 0,
    visceralFatLevel: 0,
    fatTorsoKg: 0,
    waistToHipRatio: 0,
  },
};

export const KEY_TRENDS: KeyTrend[] = [];

export function getHealthScore(allTests?: BloodTest[]): number {
  const tests = allTests && allTests.length > 0 ? allTests : BLOOD_TESTS;
  if (tests.length === 0) return 0; // No data yet
  const latest = tests[tests.length - 1];
  let score = 100;

  // Dynamic deductions based on actual markers
  for (const m of latest.markers) {
    if (m.status === "critical") score -= 15;
    else if (m.status === "high") score -= 5;
    else if (m.status === "low") score -= 3;
    else if (m.status === "borderline") score -= 2;
  }

  // BMI deduction
  if (latest.bmi >= 30) score -= 10;
  else if (latest.bmi >= 25) score -= 5;

  return Math.max(0, Math.min(100, score));
}

export function getFastingStatus() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  const eatingStart = 12 * 60; // 12:00pm
  const eatingEnd = 20 * 60; // 8:00pm

  if (currentMinutes >= eatingStart && currentMinutes < eatingEnd) {
    const remaining = eatingEnd - currentMinutes;
    return {
      state: "eating" as const,
      label: "EATING WINDOW",
      remainingMinutes: remaining,
      progressPct: ((currentMinutes - eatingStart) / (eatingEnd - eatingStart)) * 100,
      nextEvent: "8:00 PM",
      message: `${Math.floor(remaining / 60)}h ${remaining % 60}m until window closes`,
    };
  } else {
    // Fasting
    let remaining: number;
    if (currentMinutes >= eatingEnd) {
      remaining = (24 * 60 - currentMinutes) + eatingStart;
    } else {
      remaining = eatingStart - currentMinutes;
    }
    const totalFast = 16 * 60;
    const elapsed = totalFast - remaining;
    return {
      state: "fasting" as const,
      label: "FASTING",
      remainingMinutes: remaining,
      progressPct: (elapsed / totalFast) * 100,
      nextEvent: "12:00 PM",
      message: `${Math.floor(remaining / 60)}h ${remaining % 60}m until eating window`,
    };
  }
}

export function getMotivationalMessage(allTests?: BloodTest[]): string {
  const score = getHealthScore(allTests);
  if (allTests && allTests.length === 0) return "Welcome! Start logging your health data to see personalized insights.";
  if (score < 50) return "Your health needs attention, but every step forward counts. Focus on what you can control today.";
  if (score < 70) return "You're making progress! Keep up with your fasting window and gym routine.";
  return "Great work! Your dedication is showing in the numbers.";
}

export interface KeyTrend {
  marker: string;
  from: number;
  to: number;
  unit: string;
  change: number;
  changePct: number;
  direction: "up" | "down";
  severity: "critical" | "improved" | "warning";
}

export function computeKeyTrends(allTests?: BloodTest[]): KeyTrend[] {
  if (!allTests || allTests.length < 2) return [];

  const prev = tests[tests.length - 2];
  const curr = tests[tests.length - 1];
  const trends: KeyTrend[] = [];

  // Weight/BMI trends
  if (prev.weightKg && curr.weightKg && prev.weightKg > 0) {
    const change = curr.weightKg - prev.weightKg;
    const pct = (change / prev.weightKg) * 100;
    trends.push({
      marker: "Weight",
      from: prev.weightKg, to: curr.weightKg, unit: "kg",
      change, changePct: parseFloat(pct.toFixed(1)),
      direction: change > 0 ? "up" : "down",
      severity: Math.abs(pct) > 3 ? "critical" : change < 0 ? "improved" : "warning",
    });
  }
  if (prev.bmi && curr.bmi && prev.bmi > 0) {
    const change = curr.bmi - prev.bmi;
    const pct = (change / prev.bmi) * 100;
    trends.push({
      marker: "BMI",
      from: prev.bmi, to: curr.bmi, unit: "",
      change: parseFloat(change.toFixed(2)), changePct: parseFloat(pct.toFixed(1)),
      direction: change > 0 ? "up" : "down",
      severity: curr.bmi >= 30 ? "critical" : change < 0 ? "improved" : "warning",
    });
  }

  // Marker trends — find common markers that changed significantly
  for (const cm of curr.markers) {
    const pm = prev.markers.find((m) => m.testName === cm.testName);
    if (!pm || pm.value === 0) continue;
    const change = cm.value - pm.value;
    const pct = (change / pm.value) * 100;
    if (Math.abs(pct) < 5) continue; // skip small changes
    trends.push({
      marker: cm.testName,
      from: pm.value, to: cm.value, unit: cm.unit,
      change: parseFloat(change.toFixed(1)),
      changePct: parseFloat(pct.toFixed(1)),
      direction: change > 0 ? "up" : "down",
      severity: (cm.status as string) === "critical" || (pct > 20 && ((cm.status as string) === "high" || (cm.status as string) === "critical"))
        ? "critical"
        : pct < -10 ? "improved" : "warning",
    });
  }

  // Sort: critical first, then by absolute change %
  trends.sort((a, b) => {
    if (a.severity === "critical" && b.severity !== "critical") return -1;
    if (b.severity === "critical" && a.severity !== "critical") return 1;
    return Math.abs(b.changePct) - Math.abs(a.changePct);
  });

  return trends.slice(0, 7); // Top 7 trends
}
