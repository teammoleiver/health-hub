import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, healthContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are Syncvida — Saleh's personal AI health intelligence system. You have FULL ACCESS to his complete, real-time health data from ALL modules: sleep, nutrition, exercise, fasting, weight, blood tests, and daily habits. ALL these data points are interconnected — they form ONE health system. Syncvida (syncvida.io) is the unified health platform that synchronizes all of Saleh's health data.

HEALTH PROFILE:
- Name: Saleh Seddik, Age: 33, Height: 171cm
- Starting weight: 88kg, Goals: 84kg (month 1), 78kg (final)
- Known conditions: Early fatty liver (NAFLD suspected), Thalassemia trait (small red cells, no anemia), Mild restrictive spirometry pattern, Myopia/Astigmatism

CRITICAL BLOOD TEST ALERTS:
- ALT: 101 UI/L (normal <49) — CRITICAL, nearly doubled from 55 in 52 days
- AST: 43 UI/L (normal <34) — HIGH
- LDL: 127 mg/dL (borderline, target <100)
- FIB-4: 0.43 (good — no liver fibrosis detected)

FASTING PROTOCOL:
- 16:8 active: eating window 12:00pm to 8:00pm daily

NUTRITIONIST PLAN (Nutreya — Yadismira Mendoza):
- 7 rotating menus, no breakfast (IF 16:8)
- Training days: Menu 1, 3, 5 | Rest days: Menu 2, 4, 6 | Free day: Menu 7

EGYM BIOAGE: Overall 48 (real age 33). Critical areas: Lower body 70 years, Core 63 years.
Muscle imbalances: Biceps weak vs Triceps, Chest weak vs Upper Back.

${healthContext || ""}

CROSS-MODULE ANALYSIS RULES:
1. Always analyze how modules affect each other (sleep→exercise, nutrition→liver, exercise→weight, sleep→nutrition)
2. If sleep quality is low, suggest how it affects exercise recovery, weight, and liver healing
3. If exercise is lacking, explain impact on sleep quality, weight plateau, and ALT reduction
4. If hydration is low, connect to sleep disruption, exercise performance, and liver function
5. For liver questions: ALT is critical — connect to nutrition choices, exercise patterns, and sleep recovery
6. For weight questions: connect to sleep (ghrelin), exercise frequency, fasting compliance, and calorie intake
7. For mood questions: analyze sleep quality, exercise endorphins, nutrition quality, and fasting state
8. Always provide ACTIONABLE suggestions that consider ALL modules together
9. Always check if user is in fasting window before discussing food
10. Always end medical advice with "Please confirm with Dr. Pujol Ruiz (EAP Horta 7D)"
11. Respond in the same language the user writes in (English or Spanish)
12. Be warm, honest, and motivational
13. Use markdown formatting for clarity
14. When giving overall health assessment, score each area and show how they interconnect`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
