// api/analyze-in-person.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

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

function isGarbageString(value: unknown) {
  if (typeof value !== "string") return false;
  const t = value.trim();
  return (
    t.startsWith("{") ||
    t.startsWith("```") ||
    t.startsWith("json") ||
    t.includes('"decisionBrief"') ||
    t.length < 3
  );
}

function cleanSentence(value: unknown, max = 400): string {
  if (typeof value !== "string") return "";
  let s = value.replace(/```/g, "").trim();
  if (s.length > max) s = s.slice(0, max);
  return s;
}

function cleanStringArray(arr: unknown, maxItems: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x) => typeof x === "string" && !isGarbageString(x))
    .map((x) => cleanSentence(x, 300))
    .slice(0, maxItems);
}

/* =========================================================
   Gemini call
========================================================= */

async function callGeminiJSON(payload: any) {
  const bodyText = JSON.stringify(payload);

  const prompt = `
You are an expert used-car buyer assistant writing an in-person inspection report interpretation.

Rules:
- Explain ONLY what is present in the input
- Never invent issues
- Never include JSON or code in text fields
- Use calm, buyer-safe language
- Short, specific, practical

Return STRICT JSON ONLY in this shape:
{
  "decisionBrief": {
    "headline": string,
    "bullets": string[],
    "nextBestAction": string
  },
  "whyThisVerdict": string,
  "topSignals": {
    "positive": string[],
    "concerns": string[],
    "unknowns": string[]
  },
  "questionsToAskSeller": string[],
  "confidenceNote": string
}
`;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: prompt.trim() }] },
          { role: "user", parts: [{ text: bodyText }] },
        ],
        generationConfig: { temperature: 0.35 },
      }),
    }
  );

  const json = await res.json();

  const rawText =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "";

  const parsed = safeJsonParse(String(rawText).trim());

  /* -------------------------------------------------------
     HARD NORMALIZATION (NO UI GARBAGE ALLOWED)
  ------------------------------------------------------- */

  const headline =
    !isGarbageString(parsed?.decisionBrief?.headline)
      ? cleanSentence(parsed?.decisionBrief?.headline, 120)
      : "Inspection summary";

  const bullets = cleanStringArray(parsed?.decisionBrief?.bullets, 5);

  const nextBestAction =
    !isGarbageString(parsed?.decisionBrief?.nextBestAction)
      ? cleanSentence(parsed?.decisionBrief?.nextBestAction, 200)
      : "Verify the key uncertainty in writing before proceeding.";

  const whyThisVerdict =
    !isGarbageString(parsed?.whyThisVerdict)
      ? cleanSentence(parsed?.whyThisVerdict, 900)
      : "";

  return {
    decisionBrief: {
      headline,
      bullets,
      nextBestAction,
    },
    whyThisVerdict,
    topSignals: {
      positive: cleanStringArray(parsed?.topSignals?.positive, 5),
      concerns: cleanStringArray(parsed?.topSignals?.concerns, 5),
      unknowns: cleanStringArray(parsed?.topSignals?.unknowns, 5),
    },
    questionsToAskSeller: cleanStringArray(
      parsed?.questionsToAskSeller,
      6
    ),
    confidenceNote: cleanSentence(parsed?.confidenceNote, 200),
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
    const scanId = String(req.body?.scanId ?? "").trim();
    const progress = req.body?.progress ?? null;
    const analysis = req.body?.analysis ?? null;

    if (!scanId)
      return res.status(400).json({ ok: false, error: "missing-scanId" });
    if (!progress)
      return res.status(400).json({ ok: false, error: "missing-progress" });
    if (!analysis)
      return res.status(400).json({ ok: false, error: "missing-analysis" });

    const ai = await callGeminiJSON({
      scanId,
      progress,
      analysis,
      summary: req.body?.summary ?? null,
    });

    return res.status(200).json({
      ok: true,
      scanId,
      ai,
    });
  } catch (err: any) {
    console.error("analyze-in-person error", err);
    return res.status(500).json({
      ok: false,
      error: err?.message ?? "internal-error",
    });
  }
}
