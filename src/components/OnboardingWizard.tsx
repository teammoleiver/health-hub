import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Ruler, Scale, Calendar, Target, ChevronRight, ChevronLeft, Loader2, Check } from "lucide-react";
import { updateProfile } from "@/lib/supabase-queries";
import syncvidaLogo from "@/assets/syncvida-icon.png";

interface OnboardingWizardProps {
  onComplete: () => void;
  userName?: string;
}

const steps = [
  { id: "basics", title: "About You", icon: User },
  { id: "body", title: "Body Metrics", icon: Ruler },
  { id: "goals", title: "Your Goals", icon: Target },
];

export default function OnboardingWizard({ onComplete, userName }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: userName || "",
    full_name: "",
    date_of_birth: "",
    height_cm: "",
    starting_weight_kg: "",
    target_weight_m1_kg: "",
    target_weight_final_kg: "",
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return form.height_cm && form.starting_weight_kg;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        full_name: form.full_name.trim() || form.name.trim(),
        date_of_birth: form.date_of_birth || null,
        height_cm: form.height_cm ? parseInt(form.height_cm) : null,
        starting_weight_kg: form.starting_weight_kg ? parseFloat(form.starting_weight_kg) : null,
        target_weight_m1_kg: form.target_weight_m1_kg ? parseFloat(form.target_weight_m1_kg) : null,
        target_weight_final_kg: form.target_weight_final_kg ? parseFloat(form.target_weight_final_kg) : null,
      });
      onComplete();
    } catch (err) {
      console.error("Onboarding save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <img src={syncvidaLogo} alt="Syncvida" className="w-12 h-12 mx-auto" />
          <h1 className="text-2xl font-display font-bold text-foreground">Welcome to Syncvida</h1>
          <p className="text-sm text-muted-foreground">Let's set up your health profile</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : "bg-secondary text-muted-foreground"
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < step ? "bg-primary" : "bg-secondary"}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 mb-2">
                {(() => { const Icon = steps[step].icon; return <Icon className="w-5 h-5 text-primary" />; })()}
                <h2 className="text-lg font-semibold text-foreground">{steps[step].title}</h2>
              </div>

              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Display Name *</label>
                    <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sarah" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Full Name</label>
                    <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="e.g. Sarah Johnson" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Date of Birth</label>
                    <input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Height (cm) *</label>
                    <input type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} placeholder="e.g. 175" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Current Weight (kg) *</label>
                    <input type="number" step="0.1" value={form.starting_weight_kg} onChange={(e) => set("starting_weight_kg", e.target.value)} placeholder="e.g. 85" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">1-Month Target Weight (kg)</label>
                    <input type="number" step="0.1" value={form.target_weight_m1_kg} onChange={(e) => set("target_weight_m1_kg", e.target.value)} placeholder="e.g. 82" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Final Target Weight (kg)</label>
                    <input type="number" step="0.1" value={form.target_weight_final_kg} onChange={(e) => set("target_weight_final_kg", e.target.value)} placeholder="e.g. 75" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">You can always update these later in Settings.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-0"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? "Saving..." : "Get Started"}
              </button>
            )}
          </div>
        </div>

        <button onClick={onComplete} className="text-xs text-muted-foreground hover:text-foreground mx-auto block">
          Skip for now
        </button>
      </div>
    </div>
  );
}
