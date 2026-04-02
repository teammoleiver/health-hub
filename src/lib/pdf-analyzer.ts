import * as pdfjsLib from "pdfjs-dist";
import type { HealthMarker, BloodTest } from "./health-data";

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/** Extract all text from a PDF file */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(" ");
    pages.push(text);
  }
  return pages.join("\n\n");
}

/** Send extracted text to OpenAI and get structured blood test data */
export async function analyzeBloodTestWithAI(
  pdfText: string,
  apiKey: string,
): Promise<{
  date: string;
  source: string;
  weightKg: number | null;
  bmi: number | null;
  markers: HealthMarker[];
  summary: string;
  recommendations: string[];
  riskFactors: string[];
}> {
  const systemPrompt = `You are a medical lab report parser. Given the raw text extracted from a blood test PDF, extract ALL health markers and return structured JSON.

IMPORTANT RULES:
- Extract the test date in YYYY-MM-DD format
- Extract the laboratory/hospital name as "source"
- Extract weight and BMI if present (null if not found)
- For each marker, determine the status based on reference ranges:
  - "critical": value is >50% outside the reference range
  - "high": value is above the reference max
  - "low": value is below the reference min
  - "borderline": value is within 10% of a reference limit
  - "normal": value is within reference range
- Assign each marker a category from: Liver, Lipids, Blood, Metabolic, Kidney, Cardiovascular, Electrolytes, Thyroid, Spirometry, Hormones, Inflammation, Other
- Provide a plain-language summary of the overall results (2-3 sentences)
- List 3-5 actionable health recommendations based on the results
- List any risk factors identified from the results

Return ONLY valid JSON with this exact structure:
{
  "date": "YYYY-MM-DD",
  "source": "Lab/Hospital name",
  "weightKg": number | null,
  "bmi": number | null,
  "markers": [
    {
      "testName": "Marker Name",
      "value": number,
      "unit": "unit",
      "referenceMin": number | null,
      "referenceMax": number | null,
      "status": "normal" | "borderline" | "high" | "low" | "critical",
      "category": "Category"
    }
  ],
  "summary": "Overall summary...",
  "recommendations": ["recommendation 1", ...],
  "riskFactors": ["risk 1", ...]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here is the raw text extracted from a blood test PDF report. Parse it and return the structured JSON:\n\n${pdfText}`,
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `OpenAI API error: ${response.status}`,
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");

  return JSON.parse(content);
}

/** Full pipeline: extract PDF text, analyze with AI, return BloodTest */
export async function analyzePDF(
  file: File,
  apiKey: string,
): Promise<{
  bloodTest: BloodTest;
  summary: string;
  recommendations: string[];
  riskFactors: string[];
}> {
  const pdfText = await extractTextFromPDF(file);
  if (pdfText.trim().length < 50) {
    throw new Error(
      "Could not extract enough text from the PDF. The file may be image-based or encrypted.",
    );
  }

  const result = await analyzeBloodTestWithAI(pdfText, apiKey);

  const bloodTest: BloodTest = {
    id: `bt_${Date.now()}`,
    date: result.date || new Date().toISOString().split("T")[0],
    source: result.source || "Uploaded Report",
    weightKg: result.weightKg ?? 0,
    bmi: result.bmi ?? 0,
    markers: result.markers || [],
  };

  return {
    bloodTest,
    summary: result.summary,
    recommendations: result.recommendations || [],
    riskFactors: result.riskFactors || [],
  };
}
