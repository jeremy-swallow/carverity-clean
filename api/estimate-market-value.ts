// api/estimate-market-value.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

/* =========================================================
   Helpers
========================================================= */

function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function cleanNumber(value: unknown, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.round(n);
}

function cleanStringArray(
  arr: unknown,
  fallback: string[],
  maxItems: number
): string[] {
  if (!Array.isArray(arr)) return fallback;
  const cleaned = arr
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter((x) => x.length > 3)
    .slice(0, maxItems);

  return cleaned.length > 0 ? cleaned : fallback;
}

/* =========================================================
   Gemini call
========================================================= */

async function callGeminiEstimate(
  payload: {
    year: number;
    make: string;
    model: string;
    kilometers: number;
    state?: string;
  },
  apiKey: string
) {
  const prompt = `
You are CarVerity’s Australian used vehicle market estimator.

Provide a realistic private sale market value range in AUD for this vehicle in average condition.

Rules:
- Use Australian market context.
- Assume average cosmetic and mechanical condition.
- Do NOT claim to access live listings.
- Do NOT cite websites.
- Provide a practical buyer-facing estimate.
- Be conservative and realistic.

Return STRICT JSON ONLY in this shape:
{
  "lowAud": number,
  "highAud": number,
  "typicalAud": number,
  "confidence": number,
  "assumptions": string[],
  "notes": string[],
  "disclaimer": string
}
`;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
      apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: prompt.trim() }] },
          { role: "user", parts: [{ text: JSON.stringify(payload) }] },
        ],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );

  const json = await res.json();
  const rawText =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const parsed = safeJsonParse(String(rawText).trim()) ?? {};

  const lowAud = cleanNumber(parsed?.lowAud, 0);
  const highAud = cleanNumber(parsed?.highAud, 0);
  const typicalAud = cleanNumber(parsed?.typicalAud, 0);
  const confidence = Math.min(
    100,
    Math.max(0, cleanNumber(parsed?.confidence, 60))
  );

  return {
    lowAud,
    highAud,
    typicalAud,
    confidence,
    assumptions: cleanStringArray(parsed?.assumptions, [], 5),
    notes: cleanStringArray(parsed?.notes, [], 5),
    disclaimer:
      typeof parsed?.disclaimer === "string" && parsed.disclaimer.length > 10
        ? parsed.disclaimer
        : "This is an AI-generated market estimate for guidance only. It does not replace professional valuation or mechanical inspection.",
    source: "gemini-2.0-flash",
  };
}

/* =========================================================
   Handler
========================================================= */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { GOOGLE_API_KEY } = process.env;

    if (!GOOGLE_API_KEY) {
      return res.status(500).json({ ok: false });
    }

    const { year, make, model, kilometers, state } = req.body || {};

    if (
      !year ||
      !make ||
      !model ||
      !kilometers ||
      typeof year !== "number" ||
      typeof kilometers !== "number"
    ) {
      return res.status(400).json({ ok: false });
    }

    const ai = await callGeminiEstimate(
      {
        year,
        make: String(make),
        model: String(model),
        kilometers,
        state: state ? String(state) : undefined,
      },
      GOOGLE_API_KEY
    );

    return res.status(200).json({
      ok: true,
      estimate: ai,
    });
  } catch (err) {
    console.error("estimate-market-value error", err);
    return res.status(500).json({ ok: false });
  }
}
