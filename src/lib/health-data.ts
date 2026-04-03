// Centralized health data store — will be replaced with Supabase queries
export const USER_PROFILE = {
  name: "Saleh Seddik",
  fullName: "Saleh Said Mohammed Seddik Ali",
  dateOfBirth: new Date("1992-10-20"),
  age: 33,
  heightCm: 171,
  startingWeightKg: 88,
  targetWeightMonth1: 84,
  targetWeightFinal: 78,
  bmiAtStart: 30.1,
  bodyFatPct: 27.6,
  visceralFatLevel: 9,
  dietProtocol: "Intermittent Fasting 16:8",
  eatingWindowStart: 12, // 12:00pm
  eatingWindowEnd: 20, // 8:00pm
  fasting52Enabled: false,
  nutritionist: "Yadismira Mendoza (Nutreya — nutreya.es)",
  gymSystem: "EGYM smart gym",
  familyDoctor: "Dr. Pujol Ruiz (EAP Horta 7D, Barcelona)",
  occupationalDoctor: "Dr. Carles Vilanova Casadesus (Prevenactiva)",
  employer: "PICVISA MACHINE VISION SYSTEMS, S.L.",
  conditions: [
    "Myopia/Astigmatism (corrected)",
    "Mild restrictive spirometry pattern (under review)",
    "Thalassemia trait likely (small red blood cells, no anemia)",
    "Early fatty liver (NAFLD suspected)",
  ],
  lifestyle: "Ex-smoker, no alcohol, regular physical activity, normal sleep",
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

export const BLOOD_TESTS: BloodTest[] = [
  {
    id: "bt1",
    date: "2026-02-04",
    source: "Occupational Health — Prevenactiva",
    weightKg: 84,
    bmi: 29.07,
    markers: [
      { testName: "Blood Pressure (Sys)", value: 127, unit: "mmHg", referenceMax: 130, status: "normal", category: "Cardiovascular" },
      { testName: "Blood Pressure (Dia)", value: 74, unit: "mmHg", referenceMax: 85, status: "normal", category: "Cardiovascular" },
      { testName: "Heart Rate", value: 58, unit: "bpm", referenceMin: 60, referenceMax: 100, status: "low", category: "Cardiovascular" },
      { testName: "Glucose", value: 89, unit: "mg/dL", referenceMin: 70, referenceMax: 100, status: "normal", category: "Metabolic" },
      { testName: "Total Cholesterol", value: 212, unit: "mg/dL", referenceMax: 200, status: "borderline", category: "Lipids" },
      { testName: "Triglycerides", value: 153, unit: "mg/dL", referenceMax: 150, status: "borderline", category: "Lipids" },
      { testName: "VLDL", value: 31, unit: "mg/dL", referenceMax: 30, status: "high", category: "Lipids" },
      { testName: "ALT/GPT", value: 55, unit: "UI/L", referenceMax: 49, status: "high", category: "Liver" },
      { testName: "AST/GOT", value: 30, unit: "UI/L", referenceMax: 34, status: "normal", category: "Liver" },
      { testName: "GGT", value: 54, unit: "UI/L", referenceMax: 55, status: "borderline", category: "Liver" },
      { testName: "Creatinine", value: 0.91, unit: "mg/dL", referenceMin: 0.7, referenceMax: 1.2, status: "normal", category: "Kidney" },
      { testName: "Uric Acid", value: 6.0, unit: "mg/dL", referenceMax: 7.0, status: "normal", category: "Kidney" },
      { testName: "MCV", value: 76, unit: "fL", referenceMin: 80, referenceMax: 100, status: "low", category: "Blood" },
      { testName: "HCM", value: 25.1, unit: "pg", referenceMin: 27, referenceMax: 33, status: "low", category: "Blood" },
      { testName: "Hemoglobin", value: 14, unit: "g/dL", referenceMin: 13.5, referenceMax: 17.5, status: "normal", category: "Blood" },
      { testName: "FVC", value: 3.55, unit: "L", status: "low", category: "Spirometry" },
      { testName: "FVC %", value: 73, unit: "%", referenceMin: 80, status: "low", category: "Spirometry" },
      { testName: "FEV1", value: 3.49, unit: "L", status: "normal", category: "Spirometry" },
      { testName: "FEV1 %", value: 88, unit: "%", referenceMin: 80, status: "normal", category: "Spirometry" },
      { testName: "FEV1/FVC", value: 98, unit: "%", referenceMin: 70, status: "normal", category: "Spirometry" },
    ],
  },
  {
    id: "bt2",
    date: "2026-03-27",
    source: "Vall d'Hebron Hospital",
    weightKg: 88,
    bmi: 30.1,
    markers: [
      { testName: "ALT/GPT", value: 101, unit: "UI/L", referenceMin: 10, referenceMax: 49, status: "critical", category: "Liver" },
      { testName: "AST/GOT", value: 43, unit: "UI/L", referenceMin: 8, referenceMax: 34, status: "high", category: "Liver" },
      { testName: "GGT", value: 56, unit: "UI/L", referenceMax: 60, status: "normal", category: "Liver" },
      { testName: "Alkaline Phosphatase", value: 82, unit: "UI/L", referenceMax: 120, status: "normal", category: "Liver" },
      { testName: "Bilirubin", value: 0.67, unit: "mg/dL", referenceMax: 1.2, status: "normal", category: "Liver" },
      { testName: "FIB-4 Score", value: 0.43, unit: "", referenceMax: 1.3, status: "normal", category: "Liver" },
      { testName: "Glucose", value: 94, unit: "mg/dL", referenceMin: 70, referenceMax: 100, status: "normal", category: "Metabolic" },
      { testName: "Creatinine", value: 0.84, unit: "mg/dL", referenceMin: 0.7, referenceMax: 1.2, status: "normal", category: "Kidney" },
      { testName: "Sodium", value: 141, unit: "mmol/L", referenceMin: 136, referenceMax: 145, status: "normal", category: "Electrolytes" },
      { testName: "Potassium", value: 4.59, unit: "mmol/L", referenceMin: 3.5, referenceMax: 5.1, status: "normal", category: "Electrolytes" },
      { testName: "Total Cholesterol", value: 197, unit: "mg/dL", referenceMax: 200, status: "normal", category: "Lipids" },
      { testName: "LDL", value: 127, unit: "mg/dL", referenceMax: 130, status: "borderline", category: "Lipids" },
      { testName: "HDL", value: 51, unit: "mg/dL", referenceMin: 40, status: "normal", category: "Lipids" },
      { testName: "Triglycerides", value: 98, unit: "mg/dL", referenceMax: 150, status: "normal", category: "Lipids" },
      { testName: "Ferritin", value: 62, unit: "ng/mL", referenceMin: 30, referenceMax: 400, status: "normal", category: "Blood" },
      { testName: "Hemoglobin", value: 14.4, unit: "g/dL", referenceMin: 13.5, referenceMax: 17.5, status: "normal", category: "Blood" },
      { testName: "MCV", value: 75.2, unit: "fL", referenceMin: 80, referenceMax: 100, status: "low", category: "Blood" },
      { testName: "HCM", value: 24.4, unit: "pg", referenceMin: 27, referenceMax: 33, status: "low", category: "Blood" },
      { testName: "WBC", value: 8.33, unit: "x10E9/L", referenceMin: 4, referenceMax: 11, status: "normal", category: "Blood" },
      { testName: "Platelets", value: 330, unit: "x10E9/L", referenceMin: 150, referenceMax: 400, status: "normal", category: "Blood" },
      { testName: "TSH", value: 2.875, unit: "mU/L", referenceMin: 0.4, referenceMax: 4.0, status: "normal", category: "Thyroid" },
      { testName: "Free T4", value: 1.39, unit: "ng/dL", referenceMin: 0.8, referenceMax: 1.8, status: "normal", category: "Thyroid" },
    ],
  },
];

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
