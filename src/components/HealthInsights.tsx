import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, AlertTriangle, Lightbulb, CheckCircle, Zap, RefreshCw } from "lucide-react";
import { gatherHealthIntelligence, type Insight, type HealthIntelligence } from "@/lib/health-intelligence";

const iconMap: Record<string, React.ReactNode> = {
  "😴": <span className="text-lg">😴</span>,
  "🌟": <span className="text-lg">🌟</span>,
  "🍽️": <span className="text-lg">🍽️</span>,
  "💧": <span className="text-lg">💧</span>,
  "🫀": <span className="text-lg">🫀</span>,
  "⚖️": <span className="text-lg">⚖️</span>,
  "⏱️": <span className="text-lg">⏱️</span>,
  "🕐": <span className="text-lg">🕐</span>,
  "🏃": <span className="text-lg">🏃</span>,
  "🏆": <span className="text-lg">🏆</span>,
  "🔥": <span className="text-lg">🔥</span>,
};

const typeColors = {
  critical: "border-destructive/30 bg-destructive/5",
  warning: "border-warning/30 bg-warning/5",
  suggestion: "border-primary/30 bg-primary/5",
  positive: "border-emerald-500/30 bg-emerald-500/5",
};

const typeIcons = {
  critical: <AlertTriangle className="w-4 h-4 text-destructive" />,
  warning: <AlertTriangle className="w-4 h-4 text-warning" />,
  suggestion: <Lightbulb className="w-4 h-4 text-primary" />,
  positive: <CheckCircle className="w-4 h-4 text-emerald-500" />,
};

export default function HealthInsights() {
  const [intel, setIntel] = useState<HealthIntelligence | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await gatherHealthIntelligence();
      setIntel(data);
    } catch (e) {
      console.error("Failed to gather health intelligence:", e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-display font-bold text-foreground">Analyzing your health data...</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-lg bg-secondary/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!intel || intel.insights.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-foreground">Health Intelligence</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">AI</span>
        </div>
        <button onClick={load} className="text-muted-foreground hover:text-foreground p-1 transition">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary metrics row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-secondary/50">
          <div className="text-lg font-bold text-foreground">{intel.trends.sleepTrend.avgHours}h</div>
          <div className="text-[10px] text-muted-foreground">Avg Sleep</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-secondary/50">
          <div className="text-lg font-bold text-foreground">{intel.trends.exerciseTrend.sessionsThisWeek}</div>
          <div className="text-[10px] text-muted-foreground">Workouts/Week</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-secondary/50">
          <div className="text-lg font-bold text-foreground">{intel.trends.waterCompliance.last7days}%</div>
          <div className="text-[10px] text-muted-foreground">Water Compliance</div>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-2.5">
        {intel.insights.map((insight, i) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-3 rounded-lg border ${typeColors[insight.type]}`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {iconMap[insight.icon] || typeIcons[insight.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground">{insight.title}</span>
                  {typeIcons[insight.type]}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.message}</p>
                <div className="flex gap-1.5 mt-1.5">
                  {insight.modules.map(mod => (
                    <span key={mod} className="text-[9px] px-1.5 py-0.5 rounded-full bg-foreground/5 text-muted-foreground capitalize">
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
