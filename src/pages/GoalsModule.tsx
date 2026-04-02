import { Target, Check, Award, TrendingDown } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";

const goals = [
  { name: "Weight", current: 88, target: 84, unit: "kg", progress: 0 },
  { name: "ALT", current: 101, target: 70, unit: "UI/L", progress: 0 },
  { name: "Exercise", current: 2, target: 16, unit: "sessions/month", progress: 12.5 },
  { name: "Water Compliance", current: 60, target: 80, unit: "%", progress: 75 },
  { name: "IF Compliance", current: 7, target: 30, unit: "days", progress: 23 },
  { name: "Alcohol-Free", current: 30, target: 30, unit: "days", progress: 100 },
];

const badges = [
  { name: "First Week Done", earned: true },
  { name: "7-Day IF Streak", earned: true },
  { name: "Alcohol-Free Month", earned: true },
  { name: "ALT Improved", earned: false },
  { name: "Target Weight M1", earned: false },
  { name: "First 5:2 Fast", earned: false },
];

export default function GoalsModule() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Goals & Progress</h1>

      <div className="health-gradient rounded-xl p-4 text-primary-foreground">
        <p className="text-sm font-semibold">30-Day Challenge: March 31 → April 30, 2026</p>
        <p className="text-xs opacity-90 mt-1">Transform your health markers with consistent daily action.</p>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => (
          <div key={g.name} className="glass-card rounded-xl p-4 flex items-center gap-4">
            <ProgressRing
              progress={g.progress}
              size={60}
              strokeWidth={6}
              color={g.progress === 100 ? "hsl(var(--primary))" : g.progress < 30 ? "hsl(var(--destructive))" : "hsl(var(--warning))"}
            >
              <span className="text-xs font-bold text-foreground">{Math.round(g.progress)}%</span>
            </ProgressRing>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{g.name}</p>
              <p className="text-xs text-muted-foreground">
                {g.current} / {g.target} {g.unit}
              </p>
            </div>
            {g.progress === 100 && <Check className="w-5 h-5 text-primary" />}
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-3">Achievement Badges</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.name}
              className={`p-3 rounded-lg text-center border transition ${
                b.earned
                  ? "bg-primary/10 border-primary/20"
                  : "bg-muted/50 border-border opacity-50"
              }`}
            >
              <Award className={`w-6 h-6 mx-auto mb-1 ${b.earned ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-xs font-medium text-foreground">{b.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
