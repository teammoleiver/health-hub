import { Scale, TrendingDown } from "lucide-react";
import { EGYM_DATA, USER_PROFILE } from "@/lib/health-data";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

const weightData = [
  { date: "Feb 4", weight: 84, bmi: 29.07 },
  { date: "Mar 27", weight: 88, bmi: 30.1 },
];

const bodyCompData = [
  { label: "BMR", value: `${EGYM_DATA.bodyComposition.bmr} kcal` },
  { label: "Body Fat", value: `${EGYM_DATA.bodyComposition.bodyFatKg}kg (${EGYM_DATA.bodyComposition.bodyFatPct}%)` },
  { label: "Fat-Free Mass", value: `${EGYM_DATA.bodyComposition.fatFreeMassKg}kg` },
  { label: "Muscle Mass", value: `${EGYM_DATA.bodyComposition.muscleMassKg}kg` },
  { label: "Body Water", value: `${EGYM_DATA.bodyComposition.bodyWaterL}L` },
  { label: "Body Protein", value: `${EGYM_DATA.bodyComposition.bodyProteinKg}kg` },
  { label: "Visceral Fat", value: `Level ${EGYM_DATA.bodyComposition.visceralFatLevel}` },
  { label: "Waist-to-Hip", value: `${EGYM_DATA.bodyComposition.waistToHipRatio}` },
];

export default function BodyMetrics() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Body Metrics</h1>

      {/* Weight Chart */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-1">Weight Journey</h3>
        <p className="text-xs text-muted-foreground mb-4">Current: 88kg → Target: 78kg</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[75, 92]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <ReferenceLine y={78} stroke="hsl(var(--primary))" strokeDasharray="5 5" label={{ value: "Goal: 78kg", fill: "hsl(var(--primary))", fontSize: 10 }} />
              <ReferenceLine y={84} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ value: "Month 1: 84kg", fill: "hsl(var(--warning))", fontSize: 10 }} />
              <Line type="monotone" dataKey="weight" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Body Composition */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-3">Body Composition (EGYM Jan 2026)</h3>
        <div className="grid grid-cols-2 gap-3">
          {bodyCompData.map((item) => (
            <div key={item.label} className="p-3 bg-secondary/50 rounded-lg">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="text-sm font-semibold text-foreground mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Weight */}
      <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition">
        <Scale className="w-4 h-4" /> Log Weight
      </button>
    </div>
  );
}
