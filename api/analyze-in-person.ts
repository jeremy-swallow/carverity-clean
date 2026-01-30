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

function clampString(s: unknown, max: number) {
  if (typeof s !== "string") return "";
  if (s.length <= max) return s;
  return s.slice(0, max);
}

async function callGeminiJSON(payload: any) {
  // Keep request small + predictable
  const bodyText = JSON.stringify(payload);

  const prompt = `
You are an expert used-car buyer assistant writing an "in-person inspection report interpretation".

You will receive:
- A structured rules-based analysis object (verdict, risks, confidence score, etc.)
- A progress snapshot (imperfections, notes, unsure items, etc.) with heavy fields removed

Your job:
- Explain the verdict in buyer-safe language
- Make it feel worth paying for (specific, grounded, not generic)
- Never hallucinate. If something isn't in the input, say it's unknown.
- Refer only to what was recorded. Do NOT introduce extra problems.
- Keep it calm, decisive, and practical.

Return STRICT JSON ONLY with this shape:
{
  "decisionBrief": {
    "headline": string,
    "bullets": string[],
    "nextBestAction": string
  },
  "whyThisVerdict": string,
  "topSignals": { "positive": string[], "concerns": string[], "unknowns": string[] },
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
        generationConfig: {
          temperature: 0.4,
        },
      }),
    }
  );

  const json = await res.json();

  const text =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    json?.candidates?.[0]?.content?.parts?.[0]?.data ??
    "";

  const parsed = safeJsonParse(String(text).trim());

  // If Gemini returns non-JSON, fallback into a minimal structure
  if (!parsed || typeof parsed !== "object") {
    return {
      decisionBrief: {
        headline: "Report interpretation",
        bullets: [clampString(text, 320)],
        nextBestAction: "Review the key uncertainties and verify them in writing.",
      },
      whyThisVerdict: clampString(text, 900),
      topSignals: { positive: [], concerns: [], unknowns: [] },
      questionsToAskSeller: [],
      confidenceNote: "AI output was not structured. Showing raw summary.",
      _raw: clampString(text, 2000),
    };
  }

  // Normalize fields to be safe
  return {
    decisionBrief: {
      headline:
        typeof parsed?.decisionBrief?.headline === "string"
          ? parsed.decisionBrief.headline
          : "Decision brief",
      bullets: Array.isArray(parsed?.decisionBrief?.bullets)
        ? parsed.decisionBrief.bullets.filter((b: any) => typeof b === "string").slice(0, 6)
        : [],
      nextBestAction:
        typeof parsed?.decisionBrief?.nextBestAction === "string"
          ? parsed.decisionBrief.nextBestAction
          : "",
    },
    whyThisVerdict: typeof parsed?.whyThisVerdict === "string" ? parsed.whyThisVerdict : "",
    topSignals: {
      positive: Array.isArray(parsed?.topSignals?.positive)
        ? parsed.topSignals.positive.filter((x: any) => typeof x === "string").slice(0, 6)
        : [],
      concerns: Array.isArray(parsed?.topSignals?.concerns)
        ? parsed.topSignals.concerns.filter((x: any) => typeof x === "string").slice(0, 6)
        : [],
      unknowns: Array.isArray(parsed?.topSignals?.unknowns)
        ? parsed.topSignals.unknowns.filter((x: any) => typeof x === "string").slice(0, 6)
        : [],
    },
    questionsToAskSeller: Array.isArray(parsed?.questionsToAskSeller)
      ? parsed.questionsToAskSeller.filter((q: any) => typeof q === "string").slice(0, 8)
      : [],
    confidenceNote: typeof parsed?.confidenceNote === "string" ? parsed.confidenceNote : "",
    source: "gemini-2.0-flash",
  };
}

/* =========================================================
   Handler
========================================================= */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const scanId = String(req.body?.scanId ?? "").trim();
    const progress = req.body?.progress ?? null;
    const analysis = req.body?.analysis ?? null;

    if (!scanId) return res.status(400).json({ ok: false, error: "missing-scanId" });
    if (!progress) return res.status(400).json({ ok: false, error: "missing-progress" });
    if (!analysis) return res.status(400).json({ ok: false, error: "missing-analysis" });

    const modelInput = {
      scanId,
      progress,
      analysis,
      // Optional: include a small computed summary if caller provides it
      summary: req.body?.summary ?? null,
    };

    const ai = await callGeminiJSON(modelInput);

    return res.status(200).json({
      ok: true,
      scanId,
      ai,
    });
  } catch (err: any) {
    console.error("analyze-in-person error", err);
    return res.status(500).json({ ok: false, error: err?.message ?? "internal-error" });
  }
}
