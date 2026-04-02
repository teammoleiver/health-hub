import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Droplets, Utensils, Dumbbell, Scale,
  TrendingUp, TrendingDown, ArrowRight, Heart, Timer, Plus,
} from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  USER_PROFILE, KEY_TRENDS, getHealthScore,
  getFastingStatus, getMotivationalMessage, EGYM_DATA,
} from "@/lib/health-data";
import profilePhoto from "@/assets/profile-photo.jpg";
import { Link } from "react-router-dom";

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function Dashboard() {
  const time = useCurrentTime();
  const fasting = getFastingStatus();
  const healthScore = getHealthScore();
  const motivation = getMotivationalMessage();

  const waterGlasses = 4; // placeholder
  const mealsLogged = 2;
  const exerciseDone = false;
  const currentWeight = 88;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src={profilePhoto}
          alt={USER_PROFILE.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-primary"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">
            Good {time.getHours() < 12 ? "morning" : time.getHours() < 18 ? "afternoon" : "evening"}, Saleh
          </h1>
          <p className="text-sm text-muted-foreground truncate">{motivation}</p>
        </div>
      </div>

      {/* Critical Alert */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="danger-gradient rounded-xl p-4 text-destructive-foreground"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-pulse-glow" />
          <div>
            <p className="font-semibold text-sm">Critical: ALT rose 83% in 52 days</p>
            <p className="text-xs opacity-90 mt-1">
              55 → 101 UI/L (Feb 4 → Mar 27). Immediate lifestyle intervention needed.
              Consult Dr. Pujol Ruiz for follow-up testing.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Health Score + Fasting Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Health Score */}
        <div className="glass-card rounded-xl p-5 flex items-center gap-5">
          <ProgressRing
            progress={healthScore}
            size={100}
            strokeWidth={10}
            color={healthScore < 50 ? "hsl(var(--destructive))" : healthScore < 70 ? "hsl(var(--warning))" : undefined}
          >
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-foreground animate-count-up">{healthScore}</div>
              <div className="text-[10px] text-muted-foreground">/ 100</div>
            </div>
          </ProgressRing>
          <div>
            <h3 className="font-display font-semibold text-foreground">Health Score</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Based on blood work, body metrics, fitness data and lifestyle factors
            </p>
            <div className="flex gap-2 mt-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Liver ⚠</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">BMI 30.1</span>
            </div>
          </div>
        </div>

        {/* Fasting Widget */}
        <Link to="/fasting" className="glass-card rounded-xl p-5 flex items-center gap-5 hover:border-primary/30 transition">
          <ProgressRing
            progress={fasting.progressPct}
            size={100}
            strokeWidth={10}
            color={fasting.state === "fasting" ? "hsl(var(--warning))" : "hsl(var(--primary))"}
          >
            <div className="text-center">
              <Timer className="w-5 h-5 mx-auto text-foreground mb-0.5" />
              <div className="text-[10px] text-muted-foreground">{fasting.state === "fasting" ? "16:8" : "EAT"}</div>
            </div>
          </ProgressRing>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                fasting.state === "fasting"
                  ? "bg-warning/15 text-warning"
                  : "bg-success/15 text-success"
              }`}>
                {fasting.label}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground mt-1.5">{fasting.message}</p>
            <p className="text-xs text-muted-foreground mt-1">Next: {fasting.nextEvent}</p>
          </div>
        </Link>
      </div>

      {/* Today At a Glance */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Droplets, label: "Water", value: `${waterGlasses}/12`, sub: "glasses", color: "text-blue-500" },
          { icon: Utensils, label: "Meals", value: `${mealsLogged}/4`, sub: "logged", color: "text-primary" },
          { icon: Dumbbell, label: "Exercise", value: exerciseDone ? "Done" : "Pending", sub: "today", color: exerciseDone ? "text-success" : "text-muted-foreground" },
          { icon: Scale, label: "Weight", value: `${currentWeight}`, sub: "kg", color: "text-foreground" },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-xl p-4 text-center">
            <item.icon className={`w-5 h-5 mx-auto mb-2 ${item.color}`} />
            <div className="text-lg font-display font-bold text-foreground">{item.value}</div>
            <div className="text-xs text-muted-foreground">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Trend Comparison */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground">
            Trend: Feb 4 → Mar 27 <span className="text-xs text-muted-foreground font-normal">(52 days)</span>
          </h3>
          <Link to="/health" className="text-xs text-primary flex items-center gap-1 hover:underline">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {KEY_TRENDS.map((t) => (
            <div key={t.marker} className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {t.direction === "up" && t.severity === "critical" ? (
                  <TrendingUp className="w-4 h-4 text-destructive shrink-0" />
                ) : t.direction === "down" ? (
                  <TrendingDown className="w-4 h-4 text-success shrink-0" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-warning shrink-0" />
                )}
                <span className="text-sm text-foreground">{t.marker}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {t.from} → {t.to} {t.unit}
                </span>
                <StatusBadge
                  status={t.severity === "critical" ? "critical" : t.severity === "improved" ? "improved" : "borderline"}
                />
                <span className={`text-xs font-medium ${
                  t.changePct > 0 && t.severity === "critical" ? "text-destructive" : t.changePct < 0 ? "text-success" : "text-warning"
                }`}>
                  {t.changePct > 0 ? "+" : ""}{t.changePct.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BioAge Alert */}
      <div className="warning-gradient rounded-xl p-4 text-warning-foreground">
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">BioAge: 48 years (you are 33)</p>
            <p className="text-xs opacity-90 mt-1">
              Your body functions like someone 15 years older. Lower body age: 70 — most critical.
              Focus on legs, core, and cardio to reduce biological age.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Log Water", icon: Droplets, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
          { label: "Log Meal", icon: Utensils, color: "bg-primary/10 text-primary border-primary/20" },
          { label: "Log Exercise", icon: Dumbbell, color: "bg-warning/10 text-warning border-warning/20" },
          { label: "Log Weight", icon: Scale, color: "bg-foreground/10 text-foreground border-foreground/20" },
        ].map((action) => (
          <button
            key={action.label}
            className={`flex items-center gap-2 p-3 rounded-xl border transition hover:scale-[1.02] active:scale-[0.98] ${action.color}`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
