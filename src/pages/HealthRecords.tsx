import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, ChevronDown, TrendingUp, TrendingDown, AlertTriangle,
  FileText, Upload, Loader2, X, Brain, ShieldAlert, Lightbulb,
  CheckCircle2, Trash2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BLOOD_TESTS, BloodTest, HealthMarker } from "@/lib/health-data";
import { supabase } from "@/integrations/supabase/client";
import { getUserProfile, getBloodTestRecords, saveBloodTestRecord, deleteBloodTestRecord } from "@/lib/supabase-queries";
import { analyzePDF } from "@/lib/pdf-analyzer";
import { toast } from "@/hooks/use-toast";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

const categories = ["All", "Liver", "Lipids", "Blood", "Metabolic", "Kidney", "Cardiovascular", "Electrolytes", "Thyroid", "Spirometry", "Hormones", "Inflammation", "Other"];

interface AnalysisResult {
  summary: string;
  recommendations: string[];
  riskFactors: string[];
  bloodTest: BloodTest;
}

function getAllTests(dbTests: BloodTest[]): BloodTest[] {
  // Merge hardcoded + DB tests, sorted by date
  const all = [...BLOOD_TESTS, ...dbTests];
  all.sort((a, b) => a.date.localeCompare(b.date));
  return all;
}

function getMarkerDelta(allTests: BloodTest[], markerName: string): { from: number; to: number; change: number; pct: number } | null {
  if (allTests.length < 2) return null;
  const prev = allTests[allTests.length - 2].markers.find((m) => m.testName === markerName);
  const curr = allTests[allTests.length - 1].markers.find((m) => m.testName === markerName);
  if (!prev || !curr) return null;
  const change = curr.value - prev.value;
  const pct = prev.value !== 0 ? (change / prev.value) * 100 : 0;
  return { from: prev.value, to: curr.value, change, pct };
}

function MarkerTrendChart({ markerName, allTests }: { markerName: string; allTests: BloodTest[] }) {
  const data = allTests.map((bt) => {
    const m = bt.markers.find((x) => x.testName === markerName);
    return m ? { date: bt.date.slice(5), value: m.value } : null;
  }).filter(Boolean) as { date: string; value: number }[];
  if (data.length < 2) return null;
  const latest = allTests[allTests.length - 1].markers.find((m) => m.testName === markerName) ?? allTests[0].markers.find((m) => m.testName === markerName);
  return (
    <div className="h-24 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis hide />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
          {latest?.referenceMax && <ReferenceLine y={latest.referenceMax} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />}
          <Line type="monotone" dataKey="value" stroke={latest?.status === "critical" || latest?.status === "high" ? "hsl(var(--destructive))" : latest?.status === "borderline" || latest?.status === "low" ? "hsl(var(--warning))" : "hsl(var(--primary))"} strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TestDateCard({ test, allTests, isExpanded, onToggle, isFromDB, onDelete }: {
  test: BloodTest; allTests: BloodTest[]; isExpanded: boolean; onToggle: () => void; isFromDB?: boolean; onDelete?: () => void;
}) {
  const [filterCat, setFilterCat] = useState("All");
  const filtered = filterCat === "All" ? test.markers : test.markers.filter((m) => m.category === filterCat);
  const alertCount = test.markers.filter((m) => m.status === "critical" || m.status === "high").length;
  const testCats = [...new Set(test.markers.map((m) => m.category))];

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition">
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
          {isFromDB && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">AI Analyzed</span>
          )}
          {alertCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">{alertCount} alert{alertCount > 1 ? "s" : ""}</span>}
          {test.bmi ? <span className="text-xs text-muted-foreground">BMI {test.bmi} · {test.weightKg}kg</span> : null}
          {isFromDB && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 text-muted-foreground hover:text-destructive transition"
              title="Delete record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      {isExpanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-border">
          <div className="p-3 flex gap-2 overflow-x-auto border-b border-border">
            {["All", ...testCats].map((cat) => (
              <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${filterCat === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>{cat}</button>
            ))}
          </div>
          <div className="divide-y divide-border">
            {filtered.map((marker) => {
              const delta = getMarkerDelta(allTests, marker.testName);
              return (
                <div key={marker.testName} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{marker.testName}</span>
                      <StatusBadge status={marker.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-display font-bold text-foreground">{marker.value}</span>
                      <span className="text-xs text-muted-foreground">{marker.unit}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Ref: {marker.referenceMin ?? "—"} – {marker.referenceMax ?? "—"} {marker.unit}</span>
                    {delta && (
                      <span className={`flex items-center gap-1 font-medium ${delta.pct > 20 ? "text-destructive" : delta.pct < -10 ? "text-success" : "text-muted-foreground"}`}>
                        {delta.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {delta.change > 0 ? "+" : ""}{delta.change.toFixed(1)} ({delta.pct > 0 ? "+" : ""}{delta.pct.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                  <MarkerTrendChart markerName={marker.testName} allTests={allTests} />
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function AnalysisPanel({ result, onClose }: { result: AnalysisResult; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card rounded-xl overflow-hidden border-2 border-primary/30"
    >
      <div className="bg-primary/5 p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">AI Analysis Results</h3>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FileText className="w-4 h-4 text-primary" />
            Summary
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
        </div>

        {/* Markers overview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            {result.bloodTest.markers.length} Markers Extracted
          </div>
          <div className="flex flex-wrap gap-2">
            {result.bloodTest.markers
              .filter((m) => m.status === "critical" || m.status === "high")
              .map((m) => (
                <span key={m.testName} className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  {m.testName}: {m.value} {m.unit}
                </span>
              ))}
            {result.bloodTest.markers
              .filter((m) => m.status === "low")
              .map((m) => (
                <span key={m.testName} className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning border border-warning/20">
                  {m.testName}: {m.value} {m.unit}
                </span>
              ))}
            {result.bloodTest.markers
              .filter((m) => m.status === "normal" || m.status === "borderline")
              .length > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success border border-success/20">
                {result.bloodTest.markers.filter((m) => m.status === "normal" || m.status === "borderline").length} markers normal
              </span>
            )}
          </div>
        </div>

        {/* Risk Factors */}
        {result.riskFactors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              Risk Factors
            </div>
            <div className="space-y-1.5">
              {result.riskFactors.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lightbulb className="w-4 h-4 text-warning" />
              Recommendations
            </div>
            <div className="space-y-1.5">
              {result.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function HealthRecords() {
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [dbTests, setDbTests] = useState<BloodTest[]>([]);
  const [dbRecordIds, setDbRecordIds] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved blood tests from Supabase
  useEffect(() => {
    loadDbTests();
  }, []);

  const loadDbTests = async () => {
    try {
      const records = await getBloodTestRecords();
      const tests: BloodTest[] = records.map((r: any) => ({
        id: `db_${r.id}`,
        date: r.test_date,
        source: r.source,
        weightKg: Number(r.weight_kg) || 0,
        bmi: Number(r.bmi) || 0,
        markers: (r.markers as any[] || []).map((m: any) => ({
          testName: m.testName,
          value: Number(m.value),
          unit: m.unit,
          referenceMin: m.referenceMin != null ? Number(m.referenceMin) : undefined,
          referenceMax: m.referenceMax != null ? Number(m.referenceMax) : undefined,
          status: m.status || "normal",
          category: m.category || "Other",
        })),
      }));
      const idMap: Record<string, string> = {};
      records.forEach((r: any) => { idMap[`db_${r.id}`] = r.id; });
      setDbRecordIds(idMap);
      setDbTests(tests);
      // Auto-expand newest
      if (tests.length > 0) {
        const all = getAllTests(tests);
        setExpandedTest(all[all.length - 1].id);
      }
    } catch (err) {
      // Table might not exist yet — that's OK
      console.warn("Could not load blood test records:", err);
    }
  };

  const allTests = getAllTests(dbTests);

  // Compute alerts from the two most recent tests
  const alerts: { marker: string; pct: number }[] = [];
  if (allTests.length >= 2) {
    const latest = allTests[allTests.length - 1];
    latest.markers.forEach((m) => {
      const delta = getMarkerDelta(allTests, m.testName);
      if (delta && delta.pct > 20) alerts.push({ marker: m.testName, pct: delta.pct });
    });
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      setAnalysisResult(null);
    } else {
      toast({ title: "Invalid file", description: "Please select a PDF file", variant: "destructive" });
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;
    setUploading(true);
    const fileName = `${Date.now()}_${uploadedFile.name}`;
    const { error } = await supabase.storage.from("health-records").upload(fileName, uploadedFile);
    setUploading(false);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "PDF uploaded", description: "File stored securely in Supabase Storage" });
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;

    const profile = await getUserProfile();
    if (!profile?.openai_api_key) {
      toast({ title: "API key required", description: "Configure your OpenAI API key in Settings first", variant: "destructive" });
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      setAnalysisProgress("Extracting text from PDF...");
      // Small delay for UX
      await new Promise((r) => setTimeout(r, 300));

      setAnalysisProgress("Analyzing with AI — this may take 10-20 seconds...");
      const result = await analyzePDF(uploadedFile, profile.openai_api_key);

      setAnalysisResult(result);
      setAnalysisProgress("");

      // Save to Supabase
      setAnalysisProgress("Saving to database...");
      const storagePath = `${Date.now()}_${uploadedFile.name}`;
      // Upload PDF if not already uploaded
      await supabase.storage.from("health-records").upload(storagePath, uploadedFile).catch(() => {});

      await saveBloodTestRecord({
        test_date: result.bloodTest.date,
        source: result.bloodTest.source,
        weight_kg: result.bloodTest.weightKg || null,
        bmi: result.bloodTest.bmi || null,
        markers: result.bloodTest.markers,
        summary: result.summary,
        recommendations: result.recommendations,
        risk_factors: result.riskFactors,
        pdf_storage_path: storagePath,
      });

      // Reload from DB
      await loadDbTests();

      toast({ title: "Analysis complete", description: `Extracted ${result.bloodTest.markers.length} markers from your report` });
    } catch (err: any) {
      console.error("Analysis failed:", err);
      toast({ title: "Analysis failed", description: err.message || "An error occurred", variant: "destructive" });
    } finally {
      setAnalyzing(false);
      setAnalysisProgress("");
    }
  };

  const handleDeleteRecord = async (testId: string) => {
    const dbId = dbRecordIds[testId];
    if (!dbId) return;
    await deleteBloodTestRecord(dbId);
    await loadDbTests();
    toast({ title: "Record deleted" });
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Health Records</h1>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary-dark transition">
          <FileText className="w-4 h-4" /> Upload PDF
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Upload Preview */}
      {uploadedFile && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
            <button onClick={() => { setUploadedFile(null); setAnalysisResult(null); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleUpload} disabled={uploading || analyzing} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center gap-2">
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload to Storage</>}
            </button>
            <button onClick={handleAnalyze} disabled={analyzing || uploading} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> {analysisProgress || "Analyzing..."}</> : <><Brain className="w-4 h-4" /> Analyze with AI</>}
            </button>
          </div>
        </motion.div>
      )}

      {/* AI Analysis Results */}
      <AnimatePresence>
        {analysisResult && (
          <AnalysisPanel result={analysisResult} onClose={() => setAnalysisResult(null)} />
        )}
      </AnimatePresence>

      {/* Auto-alerts */}
      {alerts.length > 0 && (
        <div className="danger-gradient rounded-xl p-4 text-destructive-foreground">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Markers worsened &gt;20% since last test</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {alerts.map((a) => <span key={a.marker} className="text-xs px-2 py-0.5 rounded-full bg-white/20">{a.marker}: +{a.pct.toFixed(0)}%</span>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Dates */}
      <div className="space-y-4">
        {[...allTests].reverse().map((test) => (
          <TestDateCard
            key={test.id}
            test={test}
            allTests={allTests}
            isExpanded={expandedTest === test.id}
            onToggle={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
            isFromDB={test.id.startsWith("db_")}
            onDelete={test.id.startsWith("db_") ? () => handleDeleteRecord(test.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
