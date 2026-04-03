import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, ChevronLeft, ChevronRight, Dumbbell, Utensils,
  Moon, Droplets, Timer, HeartPulse, CheckSquare, FolderKanban,
  Target, AlertTriangle, Check, Circle, Flame, Scale, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAllExerciseLogs, getAllMealLogs, getSleepLogs, getWaterHistory,
  getFastingLogs, getChecklistStats, getWeightHistory, getTasks, getProjects,
} from "@/lib/supabase-queries";

// ============================================================
// TYPES
// ============================================================

interface DayData {
  date: string; // YYYY-MM-DD
  exercises: any[];
  meals: any[];
  sleep: any | null;
  water: any | null;
  fasting: any | null;
  checklist: any | null;
  weight: any | null;
  tasksDue: any[];
  tasksCompleted: any[];
  projectsDue: any[];
  milestoneDue: boolean;
}

type ViewMode = "month" | "week";

// ============================================================
// HELPERS
// ============================================================

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

function parseDate(s: string): Date {
  return new Date(s + "T00:00:00");
}

function isSameDay(a: string, b: string): boolean {
  return a === b;
}

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0=Sun
  const start = new Date(first);
  start.setDate(start.getDate() - startDay);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + 1); // Monday
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(d);
    dd.setDate(dd.getDate() + i);
    days.push(dd);
  }
  return days;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

// Activity dot colors
const ACTIVITY_COLORS: Record<string, string> = {
  exercise: "#1D9E75",
  meal: "#f59e0b",
  sleep: "#6366f1",
  water: "#3b82f6",
  fasting: "#8b5cf6",
  task: "#ef4444",
  weight: "#ec4899",
  checklist: "#22c55e",
};

// ============================================================
// SCORE CALCULATOR — daily health score 0-100
// ============================================================

function calculateDayScore(day: DayData): number {
  let score = 0;
  let total = 0;

  // Exercise (20 pts)
  if (day.exercises.length > 0) score += 20;
  total += 20;

  // Meals logged (15 pts)
  if (day.meals.length >= 2) score += 15;
  else if (day.meals.length >= 1) score += 8;
  total += 15;

  // Sleep logged (15 pts)
  if (day.sleep) {
    score += 10;
    if (day.sleep.total_hours >= 7) score += 5;
  }
  total += 15;

  // Water (15 pts)
  if (day.water) {
    const ml = day.water.ml_total || (day.water.glasses || 0) * 250;
    if (ml >= 3000) score += 15;
    else if (ml >= 2000) score += 10;
    else if (ml >= 1000) score += 5;
  }
  total += 15;

  // Fasting completed (10 pts)
  if (day.fasting?.completed) score += 10;
  total += 10;

  // Checklist items (15 pts)
  if (day.checklist) {
    const items = ["water_goal_met", "exercise_done", "no_alcohol", "no_fried_food", "sunlight_done", "bedtime_ok"];
    const done = items.filter(k => (day.checklist as any)?.[k]).length;
    score += Math.round((done / items.length) * 15);
  }
  total += 15;

  // Tasks completed (10 pts)
  if (day.tasksCompleted.length > 0) score += 10;
  total += 10;

  return total > 0 ? Math.round((score / total) * 100) : 0;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#1D9E75";
  if (score >= 40) return "#f59e0b";
  if (score >= 20) return "#f97316";
  return "#6b7280";
}

// ============================================================
// DAY DETAIL PANEL
// ============================================================

function DayDetailPanel({
  dayData,
  date,
  onClose,
  onNavigate,
}: {
  dayData: DayData | null;
  date: Date;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const dateStr = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const isToday = fmt(date) === fmt(new Date());
  const score = dayData ? calculateDayScore(dayData) : 0;

  const Section = ({ icon: Icon, title, color, count, path, children }: {
    icon: any; title: string; color: string; count?: number; path?: string; children: React.ReactNode;
  }) => (
    <div className="py-3 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-[13px] font-medium text-foreground">{title}</span>
        {count !== undefined && <span className="text-[12px] text-muted-foreground">{count}</span>}
        {path && (
          <button
            onClick={() => onNavigate(path)}
            className="ml-auto text-[11px] text-primary hover:underline"
          >
            Open
          </button>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-card border-l border-border z-50 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{dateStr}</h2>
            {isToday && <span className="text-[11px] text-primary font-medium">Today</span>}
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {/* Score */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
          </div>
          <span className="text-[13px] font-semibold" style={{ color: scoreColor(score) }}>{score}%</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">Daily health score</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5">
        {!dayData || (
          dayData.exercises.length === 0 &&
          dayData.meals.length === 0 &&
          !dayData.sleep &&
          !dayData.water &&
          !dayData.fasting &&
          !dayData.checklist &&
          !dayData.weight &&
          dayData.tasksDue.length === 0 &&
          dayData.tasksCompleted.length === 0 &&
          dayData.projectsDue.length === 0
        ) ? (
          <div className="py-12 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[13px] text-muted-foreground/60">No activity recorded</p>
          </div>
        ) : (
          <>
            {/* Tasks Due */}
            {dayData.tasksDue.length > 0 && (
              <Section icon={AlertTriangle} title="Tasks Due" color="#ef4444" count={dayData.tasksDue.length} path="/tasks">
                <div className="space-y-1">
                  {dayData.tasksDue.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-2 py-1">
                      {t.status === "done"
                        ? <Check className="w-3.5 h-3.5 text-primary" />
                        : <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
                      }
                      <span className={`text-[13px] ${t.status === "done" ? "line-through text-muted-foreground/50" : "text-foreground"}`}>{t.title}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Tasks Completed */}
            {dayData.tasksCompleted.length > 0 && (
              <Section icon={CheckSquare} title="Completed" color="#22c55e" count={dayData.tasksCompleted.length} path="/tasks">
                <div className="space-y-1">
                  {dayData.tasksCompleted.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-2 py-1">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[13px] text-muted-foreground/60 line-through">{t.title}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Projects Due */}
            {dayData.projectsDue.length > 0 && (
              <Section icon={FolderKanban} title="Projects Due" color="#6366f1" count={dayData.projectsDue.length} path="/projects">
                <div className="space-y-1">
                  {dayData.projectsDue.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 py-1">
                      <Target className="w-3.5 h-3.5" style={{ color: p.color || "#6366f1" }} />
                      <span className="text-[13px] text-foreground">{p.title}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Exercise */}
            {dayData.exercises.length > 0 && (
              <Section icon={Dumbbell} title="Exercise" color={ACTIVITY_COLORS.exercise} count={dayData.exercises.length} path="/exercise">
                <div className="space-y-1">
                  {dayData.exercises.map((e: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-[13px] text-foreground">{e.exercise_type}</span>
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        {e.duration_min && <span>{e.duration_min}min</span>}
                        {e.calories && <span>{e.calories} kcal</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Meals */}
            {dayData.meals.length > 0 && (
              <Section icon={Utensils} title="Meals" color={ACTIVITY_COLORS.meal} count={dayData.meals.length} path="/nutrition">
                <div className="space-y-1">
                  {dayData.meals.map((m: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">{m.meal_type}</span>
                        <p className="text-[13px] text-foreground truncate">{m.food_name}</p>
                      </div>
                      {m.calories && <span className="text-[12px] text-muted-foreground shrink-0 ml-2">{m.calories} kcal</span>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Sleep */}
            {dayData.sleep && (
              <Section icon={Moon} title="Sleep" color={ACTIVITY_COLORS.sleep} path="/sleep">
                <div className="flex items-center gap-4 text-[13px]">
                  <span className="text-foreground font-medium">{dayData.sleep.total_hours?.toFixed(1)}h</span>
                  {dayData.sleep.quality && <span className="text-muted-foreground">Quality: {dayData.sleep.quality}/5</span>}
                  {dayData.sleep.bedtime && <span className="text-muted-foreground">{dayData.sleep.bedtime}</span>}
                </div>
              </Section>
            )}

            {/* Water */}
            {dayData.water && (
              <Section icon={Droplets} title="Water" color={ACTIVITY_COLORS.water} path="/nutrition">
                <div className="flex items-center gap-3 text-[13px]">
                  <span className="text-foreground font-medium">
                    {dayData.water.ml_total ? `${(dayData.water.ml_total / 1000).toFixed(1)}L` : `${dayData.water.glasses} glasses`}
                  </span>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-400"
                      style={{ width: `${Math.min(((dayData.water.ml_total || dayData.water.glasses * 250) / 3000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </Section>
            )}

            {/* Fasting */}
            {dayData.fasting && (
              <Section icon={Timer} title="Fasting" color={ACTIVITY_COLORS.fasting} path="/fasting">
                <div className="flex items-center gap-3 text-[13px]">
                  {dayData.fasting.actual_hours && <span className="text-foreground font-medium">{dayData.fasting.actual_hours}h</span>}
                  <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${dayData.fasting.completed ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {dayData.fasting.completed ? "Completed" : "In progress"}
                  </span>
                  <span className="text-muted-foreground">{dayData.fasting.fast_type}</span>
                </div>
              </Section>
            )}

            {/* Weight */}
            {dayData.weight && (
              <Section icon={Scale} title="Weight" color={ACTIVITY_COLORS.weight} path="/body">
                <span className="text-[13px] text-foreground font-medium">{dayData.weight.weight_kg} kg</span>
              </Section>
            )}

            {/* Checklist */}
            {dayData.checklist && (
              <Section icon={Check} title="Daily Checklist" color={ACTIVITY_COLORS.checklist}>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { key: "water_goal_met", label: "Water goal" },
                    { key: "exercise_done", label: "Exercise" },
                    { key: "no_alcohol", label: "No alcohol" },
                    { key: "no_fried_food", label: "No fried food" },
                    { key: "sunlight_done", label: "Sunlight" },
                    { key: "bedtime_ok", label: "Good bedtime" },
                    { key: "if_16_8_completed", label: "IF 16:8" },
                  ].map(item => {
                    const done = (dayData.checklist as any)?.[item.key];
                    return (
                      <div key={item.key} className="flex items-center gap-1.5 py-0.5">
                        {done
                          ? <Check className="w-3 h-3 text-primary" />
                          : <Circle className="w-3 h-3 text-muted-foreground/30" />
                        }
                        <span className={`text-[12px] ${done ? "text-foreground" : "text-muted-foreground/50"}`}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CalendarModule() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [loading, setLoading] = useState(true);

  // Raw data from all modules
  const [exercises, setExercises] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [sleepLogs, setSleepLogs] = useState<any[]>([]);
  const [waterLogs, setWaterLogs] = useState<any[]>([]);
  const [fastingLogs, setFastingLogs] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [weights, setWeights] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Load all data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [ex, ml, sl, wl, fl, cl, wt, tk, pj] = await Promise.all([
        getAllExerciseLogs(90),
        getAllMealLogs(90),
        getSleepLogs(90),
        getWaterHistory(90),
        getFastingLogs(90),
        getChecklistStats(),
        getWeightHistory(),
        getTasks(),
        getProjects(),
      ]);
      setExercises(ex || []);
      setMeals(ml || []);
      setSleepLogs(sl || []);
      setWaterLogs(wl || []);
      setFastingLogs(fl || []);
      setChecklists(cl || []);
      setWeights(wt || []);
      setTasks(tk || []);
      setProjects(pj || []);
      setLoading(false);
    };
    load();
  }, []);

  // Build day data map
  const dayDataMap = useMemo(() => {
    const map: Record<string, DayData> = {};

    const ensure = (date: string): DayData => {
      if (!map[date]) {
        map[date] = { date, exercises: [], meals: [], sleep: null, water: null, fasting: null, checklist: null, weight: null, tasksDue: [], tasksCompleted: [], projectsDue: [], milestoneDue: false };
      }
      return map[date];
    };

    exercises.forEach(e => {
      const d = (e.logged_at || "").split("T")[0];
      if (d) ensure(d).exercises.push(e);
    });
    meals.forEach(m => {
      const d = (m.logged_at || "").split("T")[0];
      if (d) ensure(d).meals.push(m);
    });
    sleepLogs.forEach(s => {
      const d = s.date || (s.logged_at || "").split("T")[0];
      if (d) ensure(d).sleep = s;
    });
    waterLogs.forEach(w => {
      const d = w.logged_date || (w.created_at || "").split("T")[0];
      if (d) ensure(d).water = w;
    });
    fastingLogs.forEach(f => {
      const d = f.logged_date || (f.fast_start || "").split("T")[0];
      if (d) ensure(d).fasting = f;
    });
    checklists.forEach(c => {
      const d = c.checklist_date;
      if (d) ensure(d).checklist = c;
    });
    weights.forEach(w => {
      const d = (w.logged_at || "").split("T")[0];
      if (d) ensure(d).weight = w;
    });
    tasks.forEach(t => {
      if (t.due_date) ensure(t.due_date).tasksDue.push(t);
      if (t.completed_at) {
        const d = t.completed_at.split("T")[0];
        ensure(d).tasksCompleted.push(t);
      }
    });
    projects.forEach(p => {
      if (p.due_date) ensure(p.due_date).projectsDue.push(p);
      // Check milestones
      if (p.milestones) {
        const ms = typeof p.milestones === "string" ? JSON.parse(p.milestones) : p.milestones;
        (ms as any[]).forEach(m => {
          if (m.dueDate && !m.completed) ensure(m.dueDate).milestoneDue = true;
        });
      }
    });

    return map;
  }, [exercises, meals, sleepLogs, waterLogs, fastingLogs, checklists, weights, tasks, projects]);

  // Navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const days = useMemo(() =>
    viewMode === "month"
      ? getMonthDays(currentDate.getFullYear(), currentDate.getMonth())
      : getWeekDays(currentDate),
    [currentDate, viewMode]
  );

  const todayStr = fmt(new Date());
  const currentMonth = currentDate.getMonth();

  // Upcoming deadlines for sidebar
  const upcomingDeadlines = useMemo(() => {
    const now = fmt(new Date());
    const items: { date: string; title: string; type: "task" | "project" | "milestone"; color: string; overdue: boolean }[] = [];

    tasks.forEach(t => {
      if (t.due_date && t.status !== "done" && t.status !== "cancelled") {
        items.push({ date: t.due_date, title: t.title, type: "task", color: "#ef4444", overdue: t.due_date < now });
      }
    });
    projects.forEach(p => {
      if (p.due_date && p.status === "active") {
        items.push({ date: p.due_date, title: p.title, type: "project", color: "#6366f1", overdue: p.due_date < now });
      }
    });

    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);
  }, [tasks, projects]);

  const selectedDayData = selectedDate ? dayDataMap[fmt(selectedDate)] || null : null;

  return (
    <div className="p-4 md:px-6 md:py-5">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-lg font-semibold text-foreground">Calendar</h1>

        <div className="flex items-center gap-1 ml-auto">
          {/* View toggle */}
          {(["month", "week"] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-2.5 py-1 rounded-md text-[13px] transition ${
                viewMode === v ? "bg-secondary text-foreground font-medium" : "text-muted-foreground/50 hover:text-muted-foreground"
              }`}
            >
              {v === "month" ? "Month" : "Week"}
            </button>
          ))}

          <div className="w-px h-4 bg-border/50 mx-2" />

          {/* Navigation */}
          <button onClick={goToday} className="px-2.5 py-1 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition">
            Today
          </button>
          <button onClick={goPrev} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] font-medium text-foreground min-w-[140px] text-center">
            {viewMode === "month"
              ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Week of ${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
            }
          </span>
          <button onClick={goNext} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Main calendar area */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Day names header */}
              <div className={`grid ${viewMode === "month" ? "grid-cols-7" : "grid-cols-7"} mb-1`}>
                {(viewMode === "month" ? DAY_NAMES_SHORT : DAY_NAMES).map((name, i) => (
                  <div key={i} className="text-center text-[11px] text-muted-foreground/60 font-medium py-1.5">
                    {name}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className={`grid grid-cols-7 ${viewMode === "month" ? "auto-rows-[1fr]" : ""}`}>
                {days.map((day, i) => {
                  const ds = fmt(day);
                  const data = dayDataMap[ds];
                  const isCurrentMonth = day.getMonth() === currentMonth;
                  const isToday = ds === todayStr;
                  const isSelected = selectedDate && fmt(selectedDate) === ds;
                  const score = data ? calculateDayScore(data) : 0;
                  const hasActivity = !!data;
                  const hasTaskDue = data?.tasksDue?.some((t: any) => t.status !== "done");
                  const hasProjectDue = data?.projectsDue?.length > 0;
                  const hasMilestone = data?.milestoneDue;

                  // Activity indicators
                  const dots: string[] = [];
                  if (data?.exercises?.length) dots.push(ACTIVITY_COLORS.exercise);
                  if (data?.meals?.length) dots.push(ACTIVITY_COLORS.meal);
                  if (data?.sleep) dots.push(ACTIVITY_COLORS.sleep);
                  if (data?.water) dots.push(ACTIVITY_COLORS.water);
                  if (data?.fasting) dots.push(ACTIVITY_COLORS.fasting);
                  if (data?.tasksCompleted?.length) dots.push(ACTIVITY_COLORS.checklist);

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(day)}
                      className={`relative flex flex-col items-center py-2 transition rounded-lg ${
                        viewMode === "week" ? "py-4" : ""
                      } ${
                        isSelected
                          ? "bg-primary/10 ring-1 ring-primary/30"
                          : isToday
                            ? "bg-secondary/60"
                            : "hover:bg-secondary/40"
                      } ${!isCurrentMonth && viewMode === "month" ? "opacity-30" : ""}`}
                    >
                      {/* Day number */}
                      <span className={`text-[13px] leading-none ${
                        isToday
                          ? "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold"
                          : isSelected
                            ? "text-primary font-semibold"
                            : "text-foreground"
                      }`}>
                        {day.getDate()}
                      </span>

                      {/* Score bar (month view) */}
                      {viewMode === "month" && hasActivity && (
                        <div className="w-5 h-[3px] rounded-full mt-1.5" style={{ backgroundColor: scoreColor(score), opacity: 0.6 }} />
                      )}

                      {/* Activity dots */}
                      {dots.length > 0 && (
                        <div className="flex gap-[2px] mt-1">
                          {dots.slice(0, 4).map((c, j) => (
                            <div key={j} className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      )}

                      {/* Deadline indicators */}
                      {(hasTaskDue || hasProjectDue || hasMilestone) && (
                        <div className="absolute top-1 right-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        </div>
                      )}

                      {/* Week view: show more detail */}
                      {viewMode === "week" && hasActivity && (
                        <div className="mt-2 space-y-0.5 w-full px-1.5">
                          {data?.exercises?.length > 0 && (
                            <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                              <Dumbbell className="w-2.5 h-2.5" style={{ color: ACTIVITY_COLORS.exercise }} />
                              {data.exercises[0].exercise_type}
                            </div>
                          )}
                          {data?.tasksDue?.filter((t: any) => t.status !== "done").slice(0, 2).map((t: any) => (
                            <div key={t.id} className="text-[10px] text-red-400 truncate flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {t.title}
                            </div>
                          ))}
                          {data?.meals?.length > 0 && (
                            <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                              <Utensils className="w-2.5 h-2.5" style={{ color: ACTIVITY_COLORS.meal }} />
                              {data.meals.length} meals
                            </div>
                          )}
                          {score > 0 && (
                            <div className="text-[10px] font-medium mt-0.5" style={{ color: scoreColor(score) }}>{score}%</div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {[
                  { label: "Exercise", color: ACTIVITY_COLORS.exercise },
                  { label: "Meals", color: ACTIVITY_COLORS.meal },
                  { label: "Sleep", color: ACTIVITY_COLORS.sleep },
                  { label: "Water", color: ACTIVITY_COLORS.water },
                  { label: "Fasting", color: ACTIVITY_COLORS.fasting },
                  { label: "Tasks", color: ACTIVITY_COLORS.checklist },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-[11px] text-muted-foreground/60">{l.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right sidebar — Upcoming deadlines */}
        <div className="hidden lg:block w-[240px] shrink-0">
          <h3 className="text-[13px] font-medium text-foreground mb-3">Upcoming</h3>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-[12px] text-muted-foreground/50">No upcoming deadlines</p>
          ) : (
            <div className="space-y-1.5">
              {upcomingDeadlines.map((item, i) => (
                <div
                  key={i}
                  className={`px-2.5 py-2 rounded-md transition cursor-pointer ${item.overdue ? "bg-red-500/5" : "hover:bg-secondary/40"}`}
                  onClick={() => setSelectedDate(parseDate(item.date))}
                >
                  <div className="flex items-center gap-1.5">
                    {item.type === "task" ? <CheckSquare className="w-3 h-3 text-red-400" /> : <FolderKanban className="w-3 h-3 text-indigo-400" />}
                    <span className="text-[12px] text-foreground truncate">{item.title}</span>
                  </div>
                  <span className={`text-[11px] ${item.overdue ? "text-red-400 font-medium" : "text-muted-foreground/60"}`}>
                    {item.overdue ? "Overdue — " : ""}
                    {parseDate(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Quick stats */}
          <div className="mt-6 space-y-2">
            <h3 className="text-[13px] font-medium text-foreground mb-3">This month</h3>
            {(() => {
              const monthStart = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-01`;
              const monthEnd = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-31`;
              const monthDays = Object.values(dayDataMap).filter(d => d.date >= monthStart && d.date <= monthEnd);
              const exerciseDays = monthDays.filter(d => d.exercises.length > 0).length;
              const avgScore = monthDays.length > 0
                ? Math.round(monthDays.reduce((sum, d) => sum + calculateDayScore(d), 0) / monthDays.length)
                : 0;
              const completedTasks = monthDays.reduce((sum, d) => sum + d.tasksCompleted.length, 0);

              return (
                <>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground">Exercise days</span>
                    <span className="text-foreground font-medium">{exerciseDays}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground">Avg score</span>
                    <span className="font-medium" style={{ color: scoreColor(avgScore) }}>{avgScore}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground">Tasks completed</span>
                    <span className="text-foreground font-medium">{completedTasks}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Day Detail Panel */}
      <AnimatePresence>
        {selectedDate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedDate(null)}
            />
            <DayDetailPanel
              dayData={selectedDayData}
              date={selectedDate}
              onClose={() => setSelectedDate(null)}
              onNavigate={(path) => { setSelectedDate(null); navigate(path); }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
