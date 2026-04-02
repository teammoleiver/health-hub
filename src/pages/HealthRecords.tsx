import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar, ChevronDown, TrendingUp, TrendingDown, AlertTriangle,
  FileText, Filter,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BLOOD_TESTS, BloodTest, HealthMarker } from "@/lib/health-data";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const categories = ["All", "Liver", "Lipids", "Blood", "Metabolic", "Kidney", "Cardiovascular", "Electrolytes", "Thyroid", "Spirometry"];

function getMarkerDelta(markerName: string): { from: number; to: number; change: number; pct: number } | null {
  const bt1 = BLOOD_TESTS[0].markers.find((m) => m.testName === markerName);
  const bt2 = BLOOD_TESTS[1].markers.find((m) => m.testName === markerName);
  if (!bt1 || !bt2) return null;
  const change = bt2.value - bt1.value;
  const pct = (change / bt1.value) * 100;
  return { from: bt1.value, to: bt2.value, change, pct };
}

function MarkerTrendChart({ markerName }: { markerName: string }) {
  const data = BLOOD_TESTS.map((bt) => {
    const m = bt.markers.find((x) => x.testName === markerName);
    return { date: bt.date.slice(5), value: m?.value ?? null };
  }).filter((d) => d.value !== null);

  if (data.length < 2) return null;

  const marker = BLOOD_TESTS[1].markers.find((m) => m.testName === markerName) ??
    BLOOD_TESTS[0].markers.find((m) => m.testName === markerName);

  return (
    <div className="h-24 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          {marker?.referenceMax && (
            <ReferenceLine y={marker.referenceMax} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={
              marker?.status === "critical" || marker?.status === "high"
                ? "hsl(var(--destructive))"
                : marker?.status === "borderline" || marker?.status === "low"
                ? "hsl(var(--warning))"
                : "hsl(var(--primary))"
            }
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TestDateCard({ test, isExpanded, onToggle }: { test: BloodTest; isExpanded: boolean; onToggle: () => void }) {
  const [filterCat, setFilterCat] = useState("All");
  const filtered = filterCat === "All" ? test.markers : test.markers.filter((m) => m.category === filterCat);
  const alertCount = test.markers.filter((m) => m.status === "critical" || m.status === "high").length;
  const testCats = [...new Set(test.markers.map((m) => m.category))];

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <div className="text-left">
            <p className="font-display font-semibold text-foreground">
              {new Date(test.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-xs text-muted-foreground">{test.source}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {alertCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
              {alertCount} alert{alertCount > 1 ? "s" : ""}
            </span>
          )}
          <span className="text-xs text-muted-foreground">BMI {test.bmi} · {test.weightKg}kg</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-border"
        >
          {/* Category Filter */}
          <div className="p-3 flex gap-2 overflow-x-auto border-b border-border">
            {["All", ...testCats].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  filterCat === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Markers */}
          <div className="divide-y divide-border">
            {filtered.map((marker) => {
              const delta = getMarkerDelta(marker.testName);
              return (
                <div key={marker.testName} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{marker.testName}</span>
                      <StatusBadge status={marker.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-display font-bold text-foreground">
                        {marker.value}
                      </span>
                      <span className="text-xs text-muted-foreground">{marker.unit}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Ref: {marker.referenceMin ?? "—"} – {marker.referenceMax ?? "—"} {marker.unit}
                    </span>
                    {delta && (
                      <span className={`flex items-center gap-1 font-medium ${
                        delta.pct > 20 ? "text-destructive" : delta.pct < -10 ? "text-success" : "text-muted-foreground"
                      }`}>
                        {delta.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {delta.change > 0 ? "+" : ""}{delta.change.toFixed(1)} ({delta.pct > 0 ? "+" : ""}{delta.pct.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                  <MarkerTrendChart markerName={marker.testName} />
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function HealthRecords() {
  const [expandedTest, setExpandedTest] = useState<string | null>("bt2");

  // Auto-alert markers that worsened >20%
  const alerts: { marker: string; pct: number }[] = [];
  BLOOD_TESTS[1].markers.forEach((m) => {
    const delta = getMarkerDelta(m.testName);
    if (delta && delta.pct > 20) {
      alerts.push({ marker: m.testName, pct: delta.pct });
    }
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Health Records</h1>
        <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary-dark transition">
          <FileText className="w-4 h-4" />
          Upload PDF
        </button>
      </div>

      {/* Auto-alerts */}
      {alerts.length > 0 && (
        <div className="danger-gradient rounded-xl p-4 text-destructive-foreground">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Markers worsened &gt;20% since last test</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {alerts.map((a) => (
                  <span key={a.marker} className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                    {a.marker}: +{a.pct.toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Dates */}
      <div className="space-y-4">
        {[...BLOOD_TESTS].reverse().map((test) => (
          <TestDateCard
            key={test.id}
            test={test}
            isExpanded={expandedTest === test.id}
            onToggle={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
          />
        ))}
      </div>
    </div>
  );
}
