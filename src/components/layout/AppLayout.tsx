import { ReactNode, useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { onSync } from "@/lib/sync-events";
import {
  LayoutDashboard, Utensils, Dumbbell, HeartPulse,
  MessageCircle, Timer, BarChart3, Settings, Target, Moon, Sun, Droplets,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import syncvidaLogo from "@/assets/syncvida-icon.png";
import { getTodayWaterLog } from "@/lib/supabase-queries";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/nutrition", icon: Utensils, label: "Nutrition" },
  { path: "/fasting", icon: Timer, label: "Fasting" },
  { path: "/exercise", icon: Dumbbell, label: "Exercise" },
  { path: "/sleep", icon: Moon, label: "Sleep" },
  { path: "/health", icon: HeartPulse, label: "Health" },
  { path: "/body", icon: BarChart3, label: "Body" },
  { path: "/goals", icon: Target, label: "Goals" },
  { path: "/assistant", icon: MessageCircle, label: "Assistant" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const mobileNavItems = navItems.slice(0, 6); // Dashboard, Nutrition, Fasting, Exercise, Sleep, Health

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ht-theme") === "dark" ||
        (!localStorage.getItem("ht-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [waterGlasses, setWaterGlasses] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("ht-theme", dark ? "dark" : "light");
  }, [dark]);

  const [waterMl, setWaterMl] = useState(0);

  // Poll water intake for sidebar display + sync on water events
  useEffect(() => {
    const load = () => getTodayWaterLog().then((w) => {
      setWaterGlasses(w?.glasses ?? 0);
      setWaterMl(w?.ml_total ?? (w?.glasses ?? 0) * 250);
    });
    load();
    const id = setInterval(load, 10000);
    const unsub = onSync("water:updated", load);
    return () => { clearInterval(id); unsub(); };
  }, []);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-full z-40 transition-all duration-300 ${
          sidebarOpen ? "w-60" : "w-16"
        }`}
        style={{ background: "hsl(var(--sidebar-background))" }}
      >
        <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
          <img
            src={dark ? logoDark : logoLight}
            alt="Health Track"
            className="w-8 h-8 object-contain"
          />
          {sidebarOpen && (
            <span className="text-sidebar-foreground font-display font-bold text-lg">
              Health Track
            </span>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                } ${!sidebarOpen ? "justify-center" : ""}`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Water progress widget */}
        <Link
          to="/nutrition"
          className="mx-2 mb-2 p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition block"
        >
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-sidebar-foreground">Water</span>
                </div>
                <span className={`text-xs font-bold ${waterMl >= 3000 ? "text-blue-400" : "text-sidebar-foreground/70"}`}>
                  {(waterMl / 1000).toFixed(1)}L
                </span>
              </div>
              <div className="h-1.5 bg-sidebar-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
                  initial={false}
                  animate={{ width: `${Math.min((waterMl / 3000) * 100, 100)}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <Droplets className={`w-4 h-4 ${waterMl >= 3000 ? "text-blue-400" : "text-sidebar-foreground/50"}`} />
              </div>
              <span className="text-[9px] font-bold text-sidebar-foreground/60">{(waterMl / 1000).toFixed(1)}L</span>
            </div>
          )}
        </Link>

        <div className="p-3 border-t border-sidebar-border flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground p-1.5 rounded-md hover:bg-sidebar-accent transition"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
          {sidebarOpen && (
            <button
              onClick={() => setDark(!dark)}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground p-1.5 rounded-md hover:bg-sidebar-accent transition ml-auto"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 pb-20 md:pb-0 ${
          sidebarOpen ? "md:ml-60" : "md:ml-16"
        }`}
      >
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <img src={dark ? logoDark : logoLight} alt="Health Track" className="w-7 h-7" />
            <span className="font-display font-bold text-foreground">Health Track</span>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg bg-secondary text-foreground"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2 px-1">
          {mobileNavItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
