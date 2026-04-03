import { useState, useRef } from "react";
import { FileUp, Loader2, Sparkles, X, FileText } from "lucide-react";
import { getUserProfile } from "@/lib/supabase-queries";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NutritionPlanUploadProps {
  onPlanAnalyzed?: (plan: any) => void;
}

export default function NutritionPlanUpload({ onPlanAnalyzed }: NutritionPlanUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      // Extract text from PDF using pdfjs
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
      }

      setUploading(false);

      if (fullText.trim().length < 50) {
        toast({ title: "Could not read PDF", description: "The PDF appears to be empty or image-based. Try a text-based PDF.", variant: "destructive" });
        return;
      }

      // Now analyze with AI
      setAnalyzing(true);
      const profile = await getUserProfile();
      const apiKey = profile?.openai_api_key;

      if (!apiKey) {
        toast({ title: "OpenAI API Key required", description: "Go to Settings to add your OpenAI API key for AI analysis.", variant: "destructive" });
        setAnalyzing(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("health-chat", {
        body: {
          messages: [
            {
              role: "system",
              content: `You are a nutrition plan analyzer. Extract the meal plan from the provided text and return a JSON object with this structure:
{
  "planName": "string",
  "summary": "brief description",
  "dailyCalorieTarget": number or null,
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "type": "Breakfast|Lunch|Dinner|Snack",
          "name": "description of meal",
          "calories": number or null,
          "protein_g": number or null,
          "carbs_g": number or null,
          "fat_g": number or null,
          "notes": "any special instructions"
        }
      ]
    }
  ]
}
Only return valid JSON, no markdown.`
            },
            { role: "user", content: `Analyze this nutrition plan PDF text and extract the meal plan:\n\n${fullText.substring(0, 8000)}` }
          ],
          apiKey,
        },
      });

      if (res.error) throw new Error(res.error.message || "AI analysis failed");

      const responseText = typeof res.data === "string" ? res.data : res.data?.reply || res.data?.content || JSON.stringify(res.data);

      // Try to parse JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setPlan(parsed);
        onPlanAnalyzed?.(parsed);
        toast({ title: "Plan analyzed!", description: `Found ${parsed.days?.length || 0} days of meals.` });
      } else {
        toast({ title: "Could not parse plan", description: "The AI could not extract a structured meal plan.", variant: "destructive" });
      }
    } catch (err: any) {
      console.error("PDF analysis error:", err);
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Nutrition Plan
        </h3>
        {plan && (
          <button onClick={() => { setPlan(null); setFileName(null); }} className="text-xs text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
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
                <span className="text-sm text-muted-foreground">AI is analyzing your nutrition plan...</span>
              </>
            ) : (
              <>
                <FileUp className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Upload Nutrition Plan PDF</span>
                <span className="text-xs text-muted-foreground">AI will extract meals, macros & schedule</span>
              </>
            )}
          </button>
          {fileName && !plan && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <FileText className="w-3 h-3" /> {fileName}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {plan.planName && (
            <div className="text-sm font-medium text-foreground">{plan.planName}</div>
          )}
          {plan.summary && (
            <p className="text-xs text-muted-foreground">{plan.summary}</p>
          )}
          {plan.dailyCalorieTarget && (
            <div className="text-xs text-muted-foreground">Daily target: <span className="font-medium text-foreground">{plan.dailyCalorieTarget} kcal</span></div>
          )}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {plan.days?.map((day: any, di: number) => (
              <div key={di} className="rounded-lg bg-secondary/30 p-3">
                <div className="text-xs font-bold text-primary uppercase mb-2">{day.day}</div>
                {day.meals?.map((meal: any, mi: number) => (
                  <div key={mi} className="flex items-start justify-between py-1.5 border-b border-border/30 last:border-0">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-muted-foreground">{meal.type}</span>
                      <p className="text-xs text-foreground">{meal.name}</p>
                      {(meal.protein_g || meal.carbs_g || meal.fat_g) && (
                        <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          {meal.protein_g && <span>P: {meal.protein_g}g</span>}
                          {meal.carbs_g && <span>C: {meal.carbs_g}g</span>}
                          {meal.fat_g && <span>F: {meal.fat_g}g</span>}
                        </div>
                      )}
                    </div>
                    {meal.calories && (
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{meal.calories} kcal</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
