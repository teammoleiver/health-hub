import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Timer, Flame, TrendingUp } from "lucide-react";
import treadmillImg from "@/assets/treadmill.png";
import { logExercise } from "@/lib/supabase-queries";
import { toast } from "@/hooks/use-toast";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function estimateCalories(durationMin: number, speedKmh: number) {
  // MET ~3.5 for 5km/h walk, ~4.3 for 6km/h. Weight ~88kg
  const met = 2.0 + speedKmh * 0.35;
  return Math.round((met * 88 * durationMin) / 60);
}

export default function TreadmillTimer({ onLogged }: { onLogged?: () => void }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(5.0);
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const durationMin = Math.round(elapsed / 60);
  const calories = estimateCalories(Math.max(durationMin, 1), speed);
  const distanceKm = ((speed * elapsed) / 3600).toFixed(2);

  const handleStart = () => {
    setElapsed(0);
    setRunning(true);
  };

  const handleStop = async () => {
    setRunning(false);
    if (elapsed < 30) {
      toast({ title: "Too short", description: "Walk for at least 30 seconds to log." });
      return;
    }
    setSaving(true);
    await logExercise({
      exercise_type: "Treadmill Walk (Home)",
      duration_min: Math.max(1, durationMin),
      speed_kmh: speed,
      distance_km: parseFloat(distanceKm),
      calories,
      is_training_day: false,
      notes: `Home treadmill — ${formatTime(elapsed)} at ${speed} km/h`,
    });
    setSaving(false);
    toast({
      title: "🏃 Treadmill session logged!",
      description: `${formatTime(elapsed)} · ${distanceKm} km · ${calories} kcal — synced to your health data`,
    });
    setElapsed(0);
    onLogged?.();
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header with treadmill image */}
      <div className="relative h-36 md:h-44 overflow-hidden bg-gradient-to-br from-accent/50 to-background">
        <img
          src={treadmillImg}
          alt="Home walking treadmill"
          className="absolute inset-0 w-full h-full object-contain opacity-60 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        <div className="relative z-10 p-4 flex flex-col justify-end h-full">
          <p className="text-xs font-medium text-primary flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5" /> Home Treadmill
          </p>
          <p className="text-lg font-display font-bold text-foreground">Walking Pad Timer</p>
          <p className="text-[10px] text-muted-foreground">Start your walk and it auto-syncs to your health data</p>
        </div>
      </div>

      {/* Timer + Controls */}
      <div className="p-5 space-y-4">
        {/* Speed selector */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Speed</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSpeed((s) => Math.max(1, +(s - 0.5).toFixed(1)))}
              disabled={running}
              className="w-7 h-7 rounded-lg bg-secondary text-foreground text-sm font-bold flex items-center justify-center hover:bg-accent transition disabled:opacity-40"
            >−</button>
            <span className="text-sm font-semibold text-foreground w-16 text-center">{speed} km/h</span>
            <button
              onClick={() => setSpeed((s) => Math.min(8, +(s + 0.5).toFixed(1)))}
              disabled={running}
              className="w-7 h-7 rounded-lg bg-secondary text-foreground text-sm font-bold flex items-center justify-center hover:bg-accent transition disabled:opacity-40"
            >+</button>
          </div>
        </div>

        {/* Timer display */}
        <div className="text-center">
          <div className={`text-4xl font-display font-bold tabular-nums transition-colors ${running ? "text-primary" : "text-foreground"}`}>
            {formatTime(elapsed)}
          </div>
          {elapsed > 0 && (
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {distanceKm} km</span>
              <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-warning" /> {calories} kcal</span>
            </div>
          )}
        </div>

        {/* Start / Stop button */}
        <AnimatePresence mode="wait">
          {!running ? (
            <motion.button
              key="start"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={handleStart}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> Start Walking
            </motion.button>
          ) : (
            <motion.button
              key="stop"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={handleStop}
              className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold flex items-center justify-center gap-2 hover:bg-destructive/90 transition"
            >
              <Square className="w-4 h-4" /> Stop & Log Session
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
