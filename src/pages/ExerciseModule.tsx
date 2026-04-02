import { Dumbbell, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { EGYM_DATA, USER_PROFILE } from "@/lib/health-data";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const bioAgeData = [
  { name: "Strength", age: EGYM_DATA.bioAge.strength, color: "hsl(var(--warning))" },
  { name: "Upper Body", age: EGYM_DATA.bioAge.upperBody, color: "hsl(var(--warning))" },
  { name: "Core", age: EGYM_DATA.bioAge.core, color: "hsl(var(--warning))" },
  { name: "Lower Body", age: EGYM_DATA.bioAge.lowerBody, color: "hsl(var(--destructive))" },
  { name: "Flexibility", age: EGYM_DATA.bioAge.flexibility, color: "hsl(var(--primary))" },
  { name: "Metabolism", age: EGYM_DATA.bioAge.metabolism, color: "hsl(var(--warning))" },
];

export default function ExerciseModule() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Exercise & Gym</h1>

      {/* BioAge Alert */}
      <div className="danger-gradient rounded-xl p-4 text-destructive-foreground">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Your body is 15 years older than you</p>
            <p className="text-xs opacity-90 mt-1">
              BioAge: 48 years (real age: 33). Lower body at age 70 — most critical area.
            </p>
          </div>
        </div>
      </div>

      {/* BioAge Overview */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-4">EGYM BioAge Breakdown</h3>
        <div className="flex items-center gap-4 mb-4">
          <ProgressRing progress={100 - ((EGYM_DATA.bioAge.overall - 33) / 33) * 100} size={90} strokeWidth={8}
            color="hsl(var(--warning))">
            <div className="text-center">
              <div className="text-xl font-display font-bold text-foreground">{EGYM_DATA.bioAge.overall}</div>
              <div className="text-[9px] text-muted-foreground">BioAge</div>
            </div>
          </ProgressRing>
          <div>
            <p className="text-sm text-foreground">Overall BioAge: <strong>{EGYM_DATA.bioAge.overall}</strong> vs real age <strong>33</strong></p>
            <p className="text-xs text-muted-foreground mt-1">Gap: +{EGYM_DATA.bioAge.overall - 33} years</p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bioAgeData} layout="vertical">
              <XAxis type="number" domain={[0, 80]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v} years`, "BioAge"]}
              />
              <Bar dataKey="age" radius={[0, 4, 4, 0]}>
                {bioAgeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Muscle Imbalances */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-3">Muscle Imbalances</h3>
        <div className="space-y-3">
          {EGYM_DATA.muscleImbalances.map((imb) => (
            <div key={imb.weak} className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/15">
              <div>
                <span className="text-sm text-foreground">
                  <strong className="text-destructive">{imb.weak}</strong> weak vs <strong className="text-success">{imb.strong}</strong> strong
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">
                Focus: {imb.focus}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Strength Measurements */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-3">Strength Measurements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EGYM_DATA.strengthMeasurements.map((s) => (
            <div key={s.exercise} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition">
              <span className="text-sm text-foreground">{s.exercise}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{s.weight}kg</span>
                {s.trend === "up" ? (
                  <TrendingUp className="w-3 h-3 text-success" />
                ) : s.trend === "down" ? (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                ) : (
                  <Minus className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Exercise */}
      <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition">
        <Dumbbell className="w-4 h-4" /> Log Exercise
      </button>
    </div>
  );
}
