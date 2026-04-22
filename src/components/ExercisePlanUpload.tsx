import { useState, useRef } from "react";
import { FileUp, Loader2, Sparkles, X, FileText, Dumbbell, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logExercise } from "@/lib/supabase-queries";
import { useToast } from "@/hooks/use-toast";
import { emitSync } from "@/lib/sync-events";

interface PlanExercise {
  name: string;
  sets?: number | null;
  reps?: number | string | null;
  duration_min?: number | null;
  rest_min?: number | null;
  notes?: string | null;
}
interface PlanDay {
  day: string; // e.g. "Upper body 1", "Day 1"
  focus?: string | null;
  exercises: PlanExercise[];
}
interface ExercisePlan {
  planName: string;
  trainer?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  durationWeeks?: number | null;
  frequency?: string | null;
  goal?: string | null;
  summary?: string | null;
  days: PlanDay[];
}

const STORAGE_KEY = "syncvida.exercisePlan";

function loadStoredPlan(): ExercisePlan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ExercisePlan) : null;
  } catch {
    return null;
  }
}

export default function ExercisePlanUpload({ onLogged }: { onLogged?: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [plan, setPlan] = useState<ExercisePlan | null>(loadStoredPlan());
  const [loggingKey, setLoggingKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const savePlan = (p: ExercisePlan | null) => {
    setPlan(p);
    if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setUploading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
      setUploading(false);

      if (fullText.trim().length < 50) {
        toast({ title: "Could not read PDF", description: "The PDF appears to be empty or image-based.", variant: "destructive" });
        return;
      }

      setAnalyzing(true);
      const res = await supabase.functions.invoke("analyze-exercise-plan", {
        body: { pdfText: fullText },
      });

      if (res.error) {
        const errMsg = (res.error as any)?.message || "AI analysis failed";
        throw new Error(errMsg);
      }
      const parsed: ExercisePlan | undefined = (res.data as any)?.plan;
      if (!parsed) {
        const apiErr = (res.data as any)?.error;
        throw new Error(apiErr || "AI did not return a plan");
      }
      if (!parsed.days?.length) {
        toast({ title: "No sessions found", description: "AI couldn't identify training sessions in this PDF.", variant: "destructive" });
        return;
      }
      savePlan(parsed);
      toast({ title: "Plan imported!", description: `${parsed.days.length} training sessions ready to log.` });
    } catch (err: any) {
      console.error("Exercise PDF analysis error:", err);
      toast({ title: "Analysis failed", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setUploading(false);
      setAnalyzing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const logSessionAsToday = async (day: PlanDay, idx: number) => {
    const key = `${idx}`;
    setLoggingKey(key);
    // Estimate duration: sum of (sets × ~45s/rep) + rest, fallback per-exercise 5min
    let estMin = 0;
    for (const ex of day.exercises) {
      if (ex.duration_min) estMin += ex.duration_min;
      else estMin += Math.max(3, (ex.sets ?? 3) * 2 + (ex.rest_min ?? 1));
    }
    const est = Math.min(120, Math.max(15, Math.round(estMin)));
    const exerciseList = day.exercises.map((e) => e.name).join(", ");
    const result = await logExercise({
      exercise_type: `Gym — ${day.day}`,
      duration_min: est,
      is_training_day: true,
      notes: exerciseList.slice(0, 240),
      logged_at: new Date().toISOString(),
    });
    setLoggingKey(null);
    if (result) {
      toast({ title: "Session logged", description: `${day.day} — ${est} min` });
      emitSync("exercise:logged");
      onLogged?.();
    }
  };

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Gym Training Plan
          {plan && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary ml-2">{plan.days.length} sessions</span>}
        </h3>
        {plan && (
          <button onClick={() => { savePlan(null); setFileName(null); }} className="text-muted-foreground hover:text-destructive p-1 rounded" title="Remove plan">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {!plan ? (
        <div>
          <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || analyzing}
            className="w-full py-8 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Reading PDF...</span>
              </>
            ) : analyzing ? (
              <>
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">AI is analyzing your training plan...</span>
              </>
            ) : (
              <>
                <FileUp className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Upload Gym/Exercise Plan PDF</span>
                <span className="text-xs text-muted-foreground">AI extracts sessions, exercises, sets & reps</span>
              </>
            )}
          </button>
          {fileName && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <FileText className="w-3 h-3" /> {fileName}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg bg-secondary/40 p-3 space-y-1">
            <div className="text-sm font-bold text-foreground">{plan.planName}</div>
            {plan.summary && <p className="text-xs text-muted-foreground">{plan.summary}</p>}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-1">
              {plan.goal && <span>🎯 {plan.goal}</span>}
              {plan.frequency && <span>📅 {plan.frequency}</span>}
              {plan.durationWeeks && <span>⏱ {plan.durationWeeks} weeks</span>}
              {plan.trainer && <span>👤 {plan.trainer}</span>}
            </div>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {plan.days.map((day, di) => (
              <details key={di} className="rounded-lg bg-secondary/30 border border-border/40 group" open={di === 0}>
                <summary className="cursor-pointer list-none p-3 flex items-center justify-between hover:bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <Dumbbell className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{day.day}</div>
                      {day.focus && <div className="text-[10px] text-muted-foreground">{day.focus} · {day.exercises.length} exercises</div>}
                      {!day.focus && <div className="text-[10px] text-muted-foreground">{day.exercises.length} exercises</div>}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); logSessionAsToday(day, di); }}
                    disabled={loggingKey === `${di}`}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition flex items-center gap-1 shrink-0 disabled:opacity-50"
                  >
                    {loggingKey === `${di}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    Log today
                  </button>
                </summary>
                <div className="px-3 pb-3 space-y-1.5">
                  {day.exercises.map((ex, ei) => (
                    <div key={ei} className="flex items-start justify-between py-1.5 border-t border-border/30 text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-foreground">{ei + 1}. {ex.name}</p>
                        {ex.notes && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{ex.notes}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-0.5 text-[10px] text-muted-foreground shrink-0">
                        {ex.sets && ex.reps && <span className="font-medium text-foreground">{ex.sets}×{ex.reps}</span>}
                        {!ex.sets && ex.reps && <span>{ex.reps} reps</span>}
                        {ex.duration_min && <span>{ex.duration_min} min</span>}
                        {ex.rest_min && <span>rest {ex.rest_min}m</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}