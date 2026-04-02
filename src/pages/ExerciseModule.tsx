import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronDown,
  Clock, Flame, Target, ArrowRight, CheckCircle2, Circle, Info, Zap,
} from "lucide-react";
import { EGYM_DATA } from "@/lib/health-data";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { getMonthExerciseLogs, getAllExerciseLogs, logExercise } from "@/lib/supabase-queries";
import { onSync } from "@/lib/sync-events";
import { GYM_WORKOUTS, type WorkoutPlan, type Exercise } from "@/lib/exercise-data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import LogExerciseModal from "@/components/modals/LogExerciseModal";
import { toast } from "@/hooks/use-toast";

const bioAgeData = [
  { name: "Lower Body", age: EGYM_DATA.bioAge.lowerBody, color: "hsl(var(--destructive))", target: 33 },
  { name: "Core", age: EGYM_DATA.bioAge.core, color: "hsl(var(--warning))", target: 33 },
  { name: "Upper Body", age: EGYM_DATA.bioAge.upperBody, color: "hsl(var(--warning))", target: 33 },
  { name: "Strength", age: EGYM_DATA.bioAge.strength, color: "hsl(var(--warning))", target: 33 },
  { name: "Flexibility", age: EGYM_DATA.bioAge.flexibility, color: "hsl(var(--primary))", target: 33 },
  { name: "Metabolism", age: EGYM_DATA.bioAge.metabolism, color: "hsl(var(--warning))", target: 33 },
];

// ── Exercise Card ──

function ExerciseCard({ exercise, index }: { exercise: Exercise; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [completed, setCompleted] = useState(false);

  return (
    <div className={`glass-card rounded-xl transition-all ${completed ? "opacity-60 border-l-4 border-l-success" : ""}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-accent/30 transition rounded-xl"
      >
        {/* Number */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
          completed ? "bg-success/20 text-success" : "bg-primary/10 text-primary"
        }`}>
          {completed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-semibold text-foreground">{exercise.name}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
              exercise.type === "EGYM" ? "bg-blue-500/15 text-blue-400" :
              exercise.type === "Free weights" ? "bg-warning/15 text-warning" :
              exercise.type === "Bodyweight" ? "bg-success/15 text-success" :
              "bg-purple-500/15 text-purple-400"
            }`}>
              {exercise.type}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{exercise.sets} sets x {exercise.reps} reps</span>
            <span className="text-[9px] text-muted-foreground/50">{exercise.primaryMuscle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground">{exercise.calories} kcal</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {/* Muscle groups */}
              <div className="flex flex-wrap gap-1.5">
                {exercise.muscleGroups.map((m) => (
                  <span key={m} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{m}</span>
                ))}
              </div>

              {/* Why this exercise */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Why this exercise?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{exercise.whyThisExercise}</p>
              </div>

              {/* Form tips */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Form tips</p>
                <div className="space-y-1">
                  {exercise.formTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Liver note */}
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/15">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-[11px] text-destructive/80 leading-snug">{exercise.liverNote}</p>
              </div>

              {/* Mark complete */}
              <button
                onClick={(e) => { e.stopPropagation(); setCompleted(!completed); }}
                className={`w-full py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
                  completed ? "bg-success/15 text-success" : "bg-secondary text-foreground hover:bg-accent"
                }`}
              >
                {completed ? <><CheckCircle2 className="w-3.5 h-3.5" /> Completed</> : <><Circle className="w-3.5 h-3.5" /> Mark as done</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Workout Session Card ──

function WorkoutSessionCard({ workout, isActive, onStart }: { workout: WorkoutPlan; isActive: boolean; onStart: () => void }) {
  const isLower = workout.category === "lower_body";
  return (
    <button
      onClick={onStart}
      className={`p-4 rounded-xl text-left transition-all border-2 ${
        isActive ? "border-primary bg-primary/5" : "border-transparent glass-card hover:border-primary/20"
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isLower ? "bg-destructive/10" : "bg-blue-500/10"
        }`}>
          <Dumbbell className={`w-5 h-5 ${isLower ? "text-destructive" : "text-blue-400"}`} />
        </div>
        <div>
          <p className="text-sm font-display font-bold text-foreground">{workout.name}</p>
          <p className="text-[10px] text-muted-foreground">{workout.weeklySchedule} · {workout.exercises.length} exercises</p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">{workout.bioAgeFocus}</p>
      <div className="flex items-center gap-3 mt-2 text-[10px]">
        <span className="flex items-center gap-1 text-warning"><Flame className="w-3 h-3" /> {workout.totalKcal} kcal</span>
        <span className={`px-2 py-0.5 rounded-full font-medium ${isLower ? "bg-destructive/10 text-destructive" : "bg-blue-500/10 text-blue-400"}`}>
          {isLower ? "Lower Body" : "Upper Body"} S{workout.sessionNumber}
        </span>
      </div>
    </button>
  );
}

// ── Main Page ──

export default function ExerciseModule() {
  const [modalOpen, setModalOpen] = useState(false);
  const [monthCount, setMonthCount] = useState(0);
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);
  const [loggingSession, setLoggingSession] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);

  const loadHistory = () => {
    getMonthExerciseLogs().then((logs) => setMonthCount(logs.length));
    getAllExerciseLogs(60).then(setExerciseHistory);
  };

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => onSync("exercise:logged", loadHistory), []);

  const selectedWorkout = GYM_WORKOUTS.find((w) => w.id === activeWorkout);

  const handleLogSession = async () => {
    if (!selectedWorkout) return;
    setLoggingSession(true);
    await logExercise({
      exercise_type: `Gym - ${selectedWorkout.name}`,
      duration_min: selectedWorkout.exercises.length * 8,
      calories: selectedWorkout.totalKcal,
      notes: `${selectedWorkout.name}: ${selectedWorkout.exercises.map((e) => e.name).join(", ")}`,
      is_training_day: true,
    });
    setLoggingSession(false);
    toast({ title: "Session logged!", description: `${selectedWorkout.name} — ${selectedWorkout.totalKcal} kcal` });
    loadHistory();
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Exercise & Gym</h1>
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{monthCount} sessions this month</span>
      </div>

      {/* BioAge Alert */}
      <div className="danger-gradient rounded-xl p-4 text-destructive-foreground">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Your body is 15 years older than you</p>
            <p className="text-xs opacity-90 mt-1">BioAge: 48 years (real age: 33). Lower body at age 70 — most critical area. This plan specifically targets reducing these numbers.</p>
          </div>
        </div>
      </div>

      {/* BioAge Breakdown */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-4">EGYM BioAge Breakdown</h3>
        <div className="flex items-center gap-4 mb-4">
          <ProgressRing progress={100 - ((EGYM_DATA.bioAge.overall - 33) / 33) * 100} size={90} strokeWidth={8} color="hsl(var(--warning))">
            <div className="text-center">
              <div className="text-xl font-display font-bold text-foreground">{EGYM_DATA.bioAge.overall}</div>
              <div className="text-[9px] text-muted-foreground">BioAge</div>
            </div>
          </ProgressRing>
          <div>
            <p className="text-sm text-foreground">Overall: <strong>{EGYM_DATA.bioAge.overall}</strong> vs real age <strong>33</strong></p>
            <p className="text-xs text-muted-foreground mt-1">Gap: +{EGYM_DATA.bioAge.overall - 33} years — goal: close to 0</p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bioAgeData} layout="vertical">
              <XAxis type="number" domain={[0, 80]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v} years`, "BioAge"]} />
              <Bar dataKey="age" radius={[0, 4, 4, 0]}>
                {bioAgeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Workout Plans Grid */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold text-foreground">Your Trainer Plan</h3>
        <p className="text-xs text-muted-foreground">4 sessions per week: 2 lower body (priority) + 2 upper body. Tap a session to see the full workout.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {GYM_WORKOUTS.map((w) => (
            <WorkoutSessionCard key={w.id} workout={w} isActive={activeWorkout === w.id} onStart={() => setActiveWorkout(activeWorkout === w.id ? null : w.id)} />
          ))}
        </div>
      </div>

      {/* Active Workout Detail */}
      <AnimatePresence mode="wait">
        {selectedWorkout && (
          <motion.div
            key={selectedWorkout.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-foreground text-lg">{selectedWorkout.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedWorkout.bioAgeFocus}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-warning"><Flame className="w-3 h-3" /> {selectedWorkout.totalKcal} kcal</span>
                <span className="text-muted-foreground">{selectedWorkout.exercises.length} exercises</span>
              </div>
            </div>

            {/* Exercise list */}
            <div className="space-y-2">
              {selectedWorkout.exercises.map((ex, i) => (
                <ExerciseCard key={ex.id} exercise={ex} index={i} />
              ))}
            </div>

            {/* Log session button */}
            <button
              onClick={handleLogSession}
              disabled={loggingSession}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition disabled:opacity-50"
            >
              {loggingSession ? "Logging..." : <><CheckCircle2 className="w-4 h-4" /> Log This Session</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Muscle Imbalances */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-3">Muscle Imbalances</h3>
        <div className="space-y-3">
          {EGYM_DATA.muscleImbalances.map((imb) => (
            <div key={imb.weak} className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/15">
              <span className="text-sm text-foreground"><strong className="text-destructive">{imb.weak}</strong> weak vs <strong className="text-success">{imb.strong}</strong> strong</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">Focus: {imb.focus}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strength Measurements */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display font-semibold text-foreground mb-3">EGYM Strength Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EGYM_DATA.strengthMeasurements.map((s) => (
            <div key={s.exercise} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition">
              <span className="text-sm text-foreground">{s.exercise}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{s.weight}kg</span>
                {s.trend === "up" ? <TrendingUp className="w-3 h-3 text-success" /> : s.trend === "down" ? <TrendingDown className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise History */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-foreground">Exercise History</h3>
          <span className="text-xs text-muted-foreground">{exerciseHistory.length} sessions logged</span>
        </div>
        {exerciseHistory.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
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
          <p className="text-sm text-muted-foreground text-center py-6">No exercises logged yet. Complete a session above or log a custom exercise.</p>
        )}
      </div>

      {/* Log Custom Exercise */}
      <button onClick={() => setModalOpen(true)} className="w-full py-3 rounded-xl bg-secondary text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-accent transition border border-border">
        <Dumbbell className="w-4 h-4" /> Log Custom Exercise
      </button>

      <LogExerciseModal open={modalOpen} onClose={() => setModalOpen(false)} onLogged={loadHistory} />
    </div>
  );
}
