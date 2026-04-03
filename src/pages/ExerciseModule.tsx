import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Flame, Plus, ArrowLeft } from "lucide-react";
import { getMonthExerciseLogs, getAllExerciseLogs } from "@/lib/supabase-queries";
import { onSync } from "@/lib/sync-events";
import LogExerciseModal from "@/components/modals/LogExerciseModal";
import TreadmillTimer from "@/components/TreadmillTimer";

export default function ExerciseModule() {
  const [modalOpen, setModalOpen] = useState(false);
  const [monthCount, setMonthCount] = useState(0);
  const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);
  const [view, setView] = useState<"main" | "history">("main");

  const loadHistory = () => {
    getMonthExerciseLogs().then((logs) => setMonthCount(logs.length));
    getAllExerciseLogs(60).then(setExerciseHistory);
  };

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => onSync("exercise:logged", loadHistory), []);

  // ── History View ──
  if (view === "history") {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("main")} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Exercise History</h1>
          <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground ml-auto">{exerciseHistory.length} sessions</span>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          {exerciseHistory.length > 0 ? (
            <div className="divide-y divide-border/50">
              {exerciseHistory.map((log: any) => {
                const date = new Date(log.logged_at);
                return (
                  <div key={log.id} className="flex items-center justify-between py-3 px-5 hover:bg-accent/20 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{log.exercise_type}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} at {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {log.duration_min && <span>{log.duration_min} min</span>}
                      {log.speed_kmh && <span>{log.speed_kmh} km/h</span>}
                      {log.distance_km && <span>{log.distance_km} km</span>}
                      {log.calories && <span className="text-warning font-medium">{log.calories} kcal</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Dumbbell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No exercises logged yet</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main View ──
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Exercise & Gym</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{monthCount} this month</span>
          <button
            onClick={() => setView("history")}
            className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground font-medium transition"
          >
            History
          </button>
          <button onClick={() => setModalOpen(true)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-dark transition flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Log Exercise
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {exerciseHistory.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl font-display font-bold text-foreground">{monthCount}</div>
            <div className="text-[10px] text-muted-foreground">This month</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl font-display font-bold text-warning">
              {exerciseHistory.reduce((s, l) => s + (l.calories ?? 0), 0)}
            </div>
            <div className="text-[10px] text-muted-foreground">Total kcal burned</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl font-display font-bold text-primary">
              {exerciseHistory.reduce((s, l) => s + (l.duration_min ?? 0), 0)}
            </div>
            <div className="text-[10px] text-muted-foreground">Total minutes</div>
          </div>
        </div>
      )}

      {/* Home Treadmill Timer */}
      <TreadmillTimer onLogged={loadHistory} />

      <LogExerciseModal open={modalOpen} onClose={() => setModalOpen(false)} onLogged={loadHistory} />
    </div>
  );
}
