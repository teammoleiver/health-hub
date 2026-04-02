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

    const systemPrompt = `You are Saleh's personal AI health assistant with full access to his health data.

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

RULES:
1. Always check if user is in fasting window before discussing food
2. For liver questions: ALT is critical, recommend no alcohol, no fried food, no ibuprofen
3. For exercise: prioritize lower body and core to reduce BioAge
4. Always end medical advice with "Please confirm with Dr. Pujol Ruiz (EAP Horta 7D)"
5. Respond in the same language the user writes in (English or Spanish)
6. Be warm, honest, and motivational
7. Use markdown formatting for clarity`;

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
