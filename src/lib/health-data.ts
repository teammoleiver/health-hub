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
    overall: 48,
    strength: 63,
    upperBody: 55,
    core: 63,
    lowerBody: 70,
    flexibility: 39,
    metabolism: 43,
    cardio: null as number | null,
  },
  strengthMeasurements: [
    { exercise: "Lat Pulldown", weight: 96, trend: "up" as const },
    { exercise: "Shoulder Press", weight: 56, trend: "up" as const },
    { exercise: "Seated Row", weight: 82, trend: "up" as const },
    { exercise: "Triceps", weight: 69, trend: "down" as const },
    { exercise: "Chest Press", weight: 60, trend: "down" as const },
    { exercise: "Butterfly", weight: 22, trend: "stable" as const },
    { exercise: "Bicep Curl", weight: 12, trend: "stable" as const },
    { exercise: "Squat", weight: 40, trend: "stable" as const },
    { exercise: "Leg Extension", weight: 67, trend: "up" as const },
    { exercise: "Leg Press", weight: 100, trend: "up" as const },
    { exercise: "Leg Curl", weight: 38, trend: "down" as const },
    { exercise: "Hip Thrust", weight: 52, trend: "stable" as const },
    { exercise: "Rotary Torso", weight: 31, trend: "up" as const },
    { exercise: "Adductor", weight: 51, trend: "up" as const },
    { exercise: "Abductor", weight: 47, trend: "down" as const },
    { exercise: "Abdominal Crunch", weight: 45, trend: "down" as const },
    { exercise: "Back Extension", weight: 47, trend: "stable" as const },
  ],
  muscleImbalances: [
    { weak: "Biceps", strong: "Triceps", focus: "Biceps" },
    { weak: "Chest", strong: "Upper Back", focus: "Chest" },
  ],
  bodyComposition: {
    bmr: 1708,
    bodyFatKg: 23.6,
    bodyFatPct: 27.6,
    fatFreeMassKg: 61.9,
    muscleMassKg: 35.4,
    bodyWaterL: 45.3,
    bodyProteinKg: 12.5,
    visceralFatLevel: 9,
    fatTorsoKg: 12.5,
    waistToHipRatio: 0.9,
  },
};

export const KEY_TRENDS = [
  { marker: "Weight", from: 84, to: 88, unit: "kg", change: +4, changePct: 4.8, direction: "up" as const, severity: "critical" as const },
  { marker: "ALT/GPT", from: 55, to: 101, unit: "UI/L", change: +46, changePct: 83.6, direction: "up" as const, severity: "critical" as const },
  { marker: "BMI", from: 29.07, to: 30.1, unit: "", change: +1.03, changePct: 3.5, direction: "up" as const, severity: "critical" as const },
  { marker: "Triglycerides", from: 153, to: 98, unit: "mg/dL", change: -55, changePct: -35.9, direction: "down" as const, severity: "improved" as const },
  { marker: "Cholesterol", from: 212, to: 197, unit: "mg/dL", change: -15, changePct: -7.1, direction: "down" as const, severity: "improved" as const },
];

export function getHealthScore(allTests?: BloodTest[]): number {
  const tests = allTests && allTests.length > 0 ? allTests : BLOOD_TESTS;
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

  // BioAge gap (static for now)
  score -= 8;

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
  if (score < 50) return "Your health needs attention, but every step forward counts. Focus on what you can control today.";
  if (score < 70) return "You're making progress! Keep up with your fasting window and gym routine.";
  return "Great work, Saleh! Your dedication is showing in the numbers.";
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
  const tests = allTests && allTests.length >= 2 ? allTests : BLOOD_TESTS;
  if (tests.length < 2) return KEY_TRENDS;

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
