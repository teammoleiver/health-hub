import { useState, useEffect } from "react";
import { Scale, TrendingDown, TrendingUp, Calendar, Sun, Clock, Sunset, Moon, ArrowRight, Target } from "lucide-react";
import { EGYM_DATA } from "@/lib/health-data";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { getWeightHistory, getAppliedBloodTestRecords, getProfile } from "@/lib/supabase-queries";
import type { BloodTest, HealthMarker } from "@/lib/health-data";
import { onSync } from "@/lib/sync-events";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  Area, ComposedChart, Dot,
} from "recharts";
import LogWeightModal from "@/components/modals/LogWeightModal";
import { Link } from "react-router-dom";

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

type TimeOfDay = "Morning" | "Midday" | "Evening" | "Night" | "Unknown";

function getTimeOfDay(loggedAt: string, notes: string | null): TimeOfDay {
  // Try to get from notes first (more reliable since we store it there)
  if (notes) {
    const lower = notes.toLowerCase();
    if (lower.startsWith("morning")) return "Morning";
    if (lower.startsWith("midday")) return "Midday";
    if (lower.startsWith("evening")) return "Evening";
    if (lower.startsWith("night")) return "Night";
  }
  // Fallback to hour
  const h = new Date(loggedAt).getHours();
  if (h < 12) return "Morning";
  if (h < 15) return "Midday";
  if (h < 20) return "Evening";
  return "Night";
}

const timeIcon: Record<TimeOfDay, typeof Sun> = {
  Morning: Sun, Midday: Clock, Evening: Sunset, Night: Moon, Unknown: Clock,
};

const timeColor: Record<TimeOfDay, string> = {
  Morning: "text-warning", Midday: "text-blue-400", Evening: "text-orange-400", Night: "text-indigo-400", Unknown: "text-muted-foreground",
};

interface WeightEntry {
  date: string;
  fullDate: string;
  weight: number;
  bmi: number;
  waist: number | null;
  timeOfDay: TimeOfDay;
  notes: string | null;
  isProjection?: boolean;
}

function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (payload.isProjection) {
    return <Dot cx={cx} cy={cy} r={5} fill="hsl(var(--primary))" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="3 3" />;
  }
  const colors: Record<TimeOfDay, string> = {
    Morning: "#f59e0b", Midday: "#60a5fa", Evening: "#f97316", Night: "#818cf8", Unknown: "#6b7280",
  };
  return <Dot cx={cx} cy={cy} r={5} fill={colors[payload.timeOfDay] || "#6b7280"} stroke="hsl(var(--card))" strokeWidth={2} />;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as WeightEntry;
  const Icon = timeIcon[d.timeOfDay];
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm space-y-1">
      <div className="font-semibold text-foreground flex items-center gap-2">
        {d.isProjection ? <Target className="w-3.5 h-3.5 text-primary" /> : <Icon className={`w-3.5 h-3.5 ${timeColor[d.timeOfDay]}`} />}
        {d.date} {d.isProjection ? "(Projected)" : `— ${d.timeOfDay}`}
      </div>
      <div className="text-foreground"><strong>{d.weight}kg</strong> <span className="text-muted-foreground text-xs">BMI {d.bmi}</span></div>
      {d.waist && <div className="text-xs text-muted-foreground">Waist: {d.waist}cm</div>}
      {d.notes && !d.isProjection && <div className="text-xs text-muted-foreground italic">{d.notes}</div>}
    </div>
  );
}

export default function BodyMetrics() {
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [latestBmi, setLatestBmi] = useState<number | null>(null);

  const loadWeights = async () => {
    const history = await getWeightHistory();
    const mapped: WeightEntry[] = history.map((w) => {
      const tod = getTimeOfDay(w.logged_at || "", w.notes);
      return {
        date: new Date(w.logged_at!).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        fullDate: w.logged_at!,
        weight: Number(w.weight_kg),
        bmi: Number(w.bmi ?? (Number(w.weight_kg) / (1.71 * 1.71)).toFixed(1)),
        waist: w.waist_cm ? Number(w.waist_cm) : null,
        timeOfDay: tod,
        notes: w.notes,
      };
    });

    // Add projection line to goal
    if (mapped.length > 0) {
      const latest = mapped[mapped.length - 1];
      const weeksToGoal = (latest.weight - 78) / 0.5;
      if (weeksToGoal > 0 && weeksToGoal < 52) {
        const projDate = new Date();
        projDate.setDate(projDate.getDate() + weeksToGoal * 7);
        mapped.push({
          date: projDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          fullDate: projDate.toISOString(),
          weight: 78,
          bmi: parseFloat((78 / (1.71 * 1.71)).toFixed(1)),
          waist: null,
          timeOfDay: "Unknown",
          notes: null,
          isProjection: true,
        });
      }
      setLatestBmi(latest.bmi);
    }
    setWeightData(mapped);
  };

  useEffect(() => { loadWeights(); }, []);
  useEffect(() => onSync("weight:logged", loadWeights), []);

  const realEntries = weightData.filter((w) => !w.isProjection);
  const latestWeight = realEntries.length > 0 ? realEntries[realEntries.length - 1].weight : 88;
  const firstWeight = realEntries.length > 0 ? realEntries[0].weight : 88;
  const totalChange = latestWeight - firstWeight;
  const toGoal = latestWeight - 78;
  const progressPct = Math.max(0, Math.min(100, ((88 - latestWeight) / (88 - 78)) * 100));

  // Stats cards
  const stats = [
    {
      label: "Current",
      value: `${latestWeight}kg`,
      sub: `BMI ${latestBmi?.toFixed(1) ?? "—"}`,
      color: latestWeight > 88 ? "text-destructive" : latestWeight <= 84 ? "text-success" : "text-warning",
    },
    {
      label: "Change",
      value: `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)}kg`,
      sub: `since ${realEntries[0]?.date ?? "start"}`,
      color: totalChange > 0 ? "text-destructive" : totalChange < 0 ? "text-success" : "text-muted-foreground",
    },
    {
      label: "To Goal",
      value: `${toGoal.toFixed(1)}kg`,
      sub: "to reach 78kg",
      color: toGoal > 5 ? "text-destructive" : toGoal > 0 ? "text-warning" : "text-success",
    },
    {
      label: "Entries",
      value: `${realEntries.length}`,
      sub: "weigh-ins",
      color: "text-foreground",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Body Metrics</h1>
        {realEntries.length > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Last: {realEntries[realEntries.length - 1].date}
          </span>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-lg font-display font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress to Goal */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">Goal Progress</h3>
          <span className="text-xs text-muted-foreground">88kg → 78kg</span>
        </div>
        <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${
              progressPct >= 100 ? "bg-gradient-to-r from-success to-primary" :
              progressPct >= 50 ? "bg-gradient-to-r from-warning to-primary" :
              "bg-gradient-to-r from-destructive to-warning"
            }`}
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>88kg (start)</span>
          <span className="font-medium text-primary">{progressPct.toFixed(0)}%</span>
          <span>78kg (goal)</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Month 1 target: 84kg</span>
          <span className={`font-medium ${latestWeight <= 84 ? "text-success" : "text-warning"}`}>
            {latestWeight <= 84 ? "Reached!" : `${(latestWeight - 84).toFixed(1)}kg to go`}
          </span>
        </div>
      </div>

      {/* Weight Chart */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-semibold text-foreground">Weight Journey</h3>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Sun className="w-3 h-3 text-warning" /> AM</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400" /> Mid</span>
            <span className="flex items-center gap-1"><Sunset className="w-3 h-3 text-orange-400" /> PM</span>
            <span className="flex items-center gap-1"><Moon className="w-3 h-3 text-indigo-400" /> Night</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {latestWeight}kg → Target: 78kg · Dot color = time of day
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weightData}>
              <defs>
                <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[75, "auto"]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={78} stroke="hsl(var(--primary))" strokeDasharray="5 5" label={{ value: "Goal: 78kg", fill: "hsl(var(--primary))", fontSize: 10 }} />
              <ReferenceLine y={84} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ value: "M1: 84kg", fill: "hsl(var(--warning))", fontSize: 10 }} />
              <Area type="monotone" dataKey="weight" fill="url(#weightFill)" stroke="none" />
              <Line type="monotone" dataKey="weight" stroke="hsl(var(--destructive))" strokeWidth={2} dot={<CustomDot />} activeDot={{ r: 7, strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Weigh-ins */}
      {realEntries.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-3">Recent Weigh-ins</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...realEntries].reverse().slice(0, 10).map((entry, i) => {
              const Icon = timeIcon[entry.timeOfDay];
              const prev = i < realEntries.length - 1 ? [...realEntries].reverse()[i + 1] : null;
              const diff = prev ? entry.weight - prev.weight : null;
              return (
                <div key={entry.fullDate} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-secondary`}>
                      <Icon className={`w-4 h-4 ${timeColor[entry.timeOfDay]}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{entry.weight}kg</div>
                      <div className="text-[10px] text-muted-foreground">{entry.date} · {entry.timeOfDay}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.waist && <span className="text-xs text-muted-foreground">{entry.waist}cm</span>}
                    <span className="text-xs text-muted-foreground">BMI {entry.bmi}</span>
                    {diff !== null && (
                      <span className={`text-xs font-medium flex items-center gap-0.5 ${diff > 0 ? "text-destructive" : diff < 0 ? "text-success" : "text-muted-foreground"}`}>
                        {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BMI Cross-reference with Health Records */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-foreground">BMI Across Blood Tests</h3>
          <Link to="/health" className="text-xs text-primary flex items-center gap-1 hover:underline">View records <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <div className="space-y-2">
          {[...BLOOD_TESTS].reverse().map((bt) => (
            <div key={bt.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <div className="text-sm text-foreground">{new Date(bt.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                <div className="text-[10px] text-muted-foreground">{bt.source}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground">{bt.weightKg}kg</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  bt.bmi >= 30 ? "bg-destructive/10 text-destructive" :
                  bt.bmi >= 25 ? "bg-warning/10 text-warning" :
                  "bg-success/10 text-success"
                }`}>
                  BMI {bt.bmi}
                </span>
              </div>
            </div>
          ))}
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
