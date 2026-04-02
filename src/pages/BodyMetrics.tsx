import { useState, useEffect } from "react";
import { Scale, TrendingDown, Calendar } from "lucide-react";
import { EGYM_DATA } from "@/lib/health-data";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { getWeightHistory } from "@/lib/supabase-queries";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import LogWeightModal from "@/components/modals/LogWeightModal";

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
  const [weightData, setWeightData] = useState<{ date: string; weight: number; bmi: number }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const loadWeights = async () => {
    const history = await getWeightHistory();
    const mapped = history.map((w) => ({
      date: new Date(w.logged_at!).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      weight: Number(w.weight_kg),
      bmi: Number(w.bmi ?? (Number(w.weight_kg) / (1.71 * 1.71)).toFixed(1)),
    }));
    // Add projection
    if (mapped.length > 0) {
      const latest = mapped[mapped.length - 1];
      const weeksToGoal = (latest.weight - 78) / 0.5;
      if (weeksToGoal > 0 && weeksToGoal < 52) {
        const projDate = new Date();
        projDate.setDate(projDate.getDate() + weeksToGoal * 7);
        mapped.push({
          date: projDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          weight: 78,
          bmi: parseFloat((78 / (1.71 * 1.71)).toFixed(1)),
        });
      }
    }
    setWeightData(mapped);
  };

  useEffect(() => { loadWeights(); }, []);

  const latestWeight = weightData.length > 0 ? weightData[weightData.length > 1 ? weightData.length - 2 : 0].weight : 88;
  const daysSinceWeighIn = weightData.length > 1
    ? Math.floor((Date.now() - new Date().getTime()) / (1000 * 60 * 60 * 24)) || 0
    : 0;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Body Metrics</h1>
        {weightData.length > 1 && (
          <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Last weigh-in: {weightData[weightData.length - (weightData[weightData.length - 1].weight === 78 ? 2 : 1)]?.date}
          </span>
        )}
      </div>

      {/* Weight Chart */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-1">Weight Journey</h3>
        <p className="text-xs text-muted-foreground mb-4">Current: {latestWeight}kg → Target: 78kg</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[75, 92]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <ReferenceLine y={78} stroke="hsl(var(--primary))" strokeDasharray="5 5" label={{ value: "Goal: 78kg", fill: "hsl(var(--primary))", fontSize: 10 }} />
              <ReferenceLine y={84} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ value: "Month 1: 84kg", fill: "hsl(var(--warning))", fontSize: 10 }} />
              <Line type="monotone" dataKey="weight" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 5 }} strokeDasharray={weightData.length > 2 ? "0 0 5 5" : undefined} />
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
      <button onClick={() => setModalOpen(true)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition">
        <Scale className="w-4 h-4" /> Log Weight
      </button>

      <LogWeightModal open={modalOpen} onClose={() => setModalOpen(false)} onLogged={loadWeights} />
    </div>
  );
}
