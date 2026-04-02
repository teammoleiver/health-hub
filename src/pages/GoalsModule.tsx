import { useState, useEffect } from "react";
import { Target, Check, Award } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { getLatestWeight, getMonthExerciseLogs, getChecklistStats, getFastingLogs, getFasting52Schedule, getWeightHistory } from "@/lib/supabase-queries";

interface GoalData {
  name: string;
  current: number;
  target: number;
  unit: string;
  progress: number;
}

interface BadgeData {
  name: string;
  earned: boolean;
}

export default function GoalsModule() {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [latestWeight, monthExercise, checklistStats, fastingLogs, weightHistory] = await Promise.all([
        getLatestWeight(),
        getMonthExerciseLogs(),
        getChecklistStats(),
        getFastingLogs(90),
        getWeightHistory(),
      ]);

      const currentWeight = latestWeight ? Number(latestWeight.weight_kg) : 88;
      const weightLost = 88 - currentWeight;
      const weightProgress = Math.max(0, Math.min(100, (weightLost / (88 - 84)) * 100));

      const exerciseCount = monthExercise.length;
      const exerciseProgress = Math.min(100, (exerciseCount / 20) * 100);

      const waterDays = checklistStats.filter((c) => c.water_goal_met).length;
      const totalDays = Math.max(1, checklistStats.length);
      const waterCompliance = Math.round((waterDays / totalDays) * 100);

      const completedFasts = fastingLogs.filter((f) => f.completed).length;
      const ifCompliance = Math.min(100, Math.round((completedFasts / Math.max(1, fastingLogs.length)) * 100));

      // Alcohol-free streak
      let alcoholStreak = 0;
      for (const c of checklistStats) {
        if (c.no_alcohol) alcoholStreak++;
        else break;
      }

      setGoals([
        { name: "Weight → 84kg", current: currentWeight, target: 84, unit: "kg", progress: weightProgress },
        { name: "Exercise", current: exerciseCount, target: 20, unit: "sessions/month", progress: exerciseProgress },
        { name: "Water Compliance", current: waterCompliance, target: 80, unit: "%", progress: Math.min(100, (waterCompliance / 80) * 100) },
        { name: "IF Compliance", current: completedFasts, target: 30, unit: "days", progress: Math.min(100, (completedFasts / 30) * 100) },
        { name: "Alcohol-Free", current: alcoholStreak, target: 30, unit: "days", progress: Math.min(100, (alcoholStreak / 30) * 100) },
      ]);

      // Badges
      const hasFirstWorkout = monthExercise.length > 0 || (await getMonthExerciseLogs()).length > 0;
      const has7DayStreak = completedFasts >= 7;
      const has1kgLost = weightHistory.some((w) => Number(w.weight_kg) <= 87);
      const firstWeekDone = checklistStats.length >= 7;

      setBadges([
        { name: "First Workout", earned: hasFirstWorkout },
        { name: "7-Day IF Streak", earned: has7DayStreak },
        { name: "1kg Lost", earned: has1kgLost },
        { name: "Alcohol-Free Month", earned: alcoholStreak >= 30 },
        { name: "ALT Improved", earned: false },
        { name: "First 5:2 Fast", earned: false },
      ]);

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
        <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Goals & Progress</h1>
        <div className="text-center text-muted-foreground py-12">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Goals & Progress</h1>

      <div className="health-gradient rounded-xl p-4 text-primary-foreground">
        <p className="text-sm font-semibold">30-Day Challenge: March 31 → April 30, 2026</p>
        <p className="text-xs opacity-90 mt-1">Transform your health markers with consistent daily action.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => (
          <div key={g.name} className="glass-card rounded-xl p-4 flex items-center gap-4">
            <ProgressRing progress={g.progress} size={60} strokeWidth={6} color={g.progress === 100 ? "hsl(var(--primary))" : g.progress < 30 ? "hsl(var(--destructive))" : "hsl(var(--warning))"}>
              <span className="text-xs font-bold text-foreground">{Math.round(g.progress)}%</span>
            </ProgressRing>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{g.name}</p>
              <p className="text-xs text-muted-foreground">{g.current} / {g.target} {g.unit}</p>
            </div>
            {g.progress >= 100 && <Check className="w-5 h-5 text-primary" />}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-3">Achievement Badges</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div key={b.name} className={`p-3 rounded-lg text-center border transition ${b.earned ? "bg-primary/10 border-primary/20" : "bg-muted/50 border-border opacity-50"}`}>
              <Award className={`w-6 h-6 mx-auto mb-1 ${b.earned ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-xs font-medium text-foreground">{b.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
