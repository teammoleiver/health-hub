import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Flame, Plus } from "lucide-react";
import { getMonthExerciseLogs, getAllExerciseLogs } from "@/lib/supabase-queries";
import { onSync } from "@/lib/sync-events";
import LogExerciseModal from "@/components/modals/LogExerciseModal";
import TreadmillTimer from "@/components/TreadmillTimer";

export default function ExerciseModule() {
  const [modalOpen, setModalOpen] = useState(false);
  const [monthCount, setMonthCount] = useState(0);
  const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);

  const loadHistory = () => {
    getMonthExerciseLogs().then((logs) => setMonthCount(logs.length));
    getAllExerciseLogs(60).then(setExerciseHistory);
  };

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => onSync("exercise:logged", loadHistory), []);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Exercise & Gym</h1>
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{monthCount} sessions this month</span>
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

      {/* Exercise History */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-foreground">Exercise History</h3>
          <span className="text-xs text-muted-foreground">{exerciseHistory.length} sessions logged</span>
        </div>
        {exerciseHistory.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {exerciseHistory.map((log: any) => {
              const date = new Date(log.logged_at);
              return (
                <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg border-b border-border/50 last:border-0 hover:bg-accent/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Dumbbell className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{log.exercise_type}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {log.duration_min && <span>{log.duration_min} min</span>}
                    {log.calories && <span className="text-warning font-medium">{log.calories} kcal</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <Dumbbell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No exercises logged yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Use the treadmill timer above or log a custom exercise below</p>
          </div>
        )}
      </div>

      {/* Log Custom Exercise */}
      <button onClick={() => setModalOpen(true)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition">
        <Plus className="w-4 h-4" /> Log Exercise
      </button>

      <LogExerciseModal open={modalOpen} onClose={() => setModalOpen(false)} onLogged={loadHistory} />
    </div>
  );
}
