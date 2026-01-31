// api/analyze-in-person.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

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
  if (typeof value !== "string") return true;
  const t = value.trim();
  return (
    t.startsWith("{") ||
    t.startsWith("```") ||
    t.startsWith("json") ||
    t.includes('"decisionBrief"') ||
    t.length < 3
  );
}

function cleanSentence(
  value: unknown,
  fallback: string,
  max = 400
): string {
  if (typeof value !== "string") return fallback;
  let s = value.replace(/```/g, "").trim();
  if (s.length < 3) return fallback;
  if (s.length > max) s = s.slice(0, max);
  return s;
}

function cleanStringArray(
  arr: unknown,
  fallback: string[],
  maxItems: number
): string[] {
  if (!Array.isArray(arr)) return fallback;
  const cleaned = arr
    .filter((x) => typeof x === "string" && !isGarbageString(x))
    .map((x) => x.trim())
    .filter((x) => x.length > 3)
    .slice(0, maxItems);

  return cleaned.length > 0 ? cleaned : fallback;
}

/* =========================================================
   Tone + length presets
========================================================= */

function lengthProfile(confidenceScore: number | undefined) {
  if (typeof confidenceScore !== "number") return "medium";
  if (confidenceScore >= 80) return "high";
  if (confidenceScore >= 50) return "medium";
  return "low";
}

function toneForVerdict(
  verdict: string | undefined,
  confidenceScore: number | undefined
) {
  const length = lengthProfile(confidenceScore);

  if (verdict === "walk-away") {
    return {
      headline: "Significant risks identified",
      bullets:
        length === "high"
          ? [
              "The inspection identified risks that materially affect this purchase.",
              "Proceeding without resolution would expose you to avoidable downside.",
            ]
          : [
              "The inspection identified issues that materially affect this purchase.",
              "These findings increase mechanical, financial, or ownership risk.",
              "Proceeding without resolution would expose you to avoidable downside.",
            ],
      nextBestAction:
        "Strongly consider walking away unless these issues can be resolved clearly and in writing.",
      why:
        length === "high"
          ? "The inspection identified risks that meaningfully change the balance of this decision. This verdict is intended to protect you from committing to a purchase where the downside outweighs the upside."
          : "The inspection identified issues that meaningfully increase mechanical, financial, or ownership risk. This verdict reflects the cumulative impact of those findings and is intended to protect you from committing to a purchase where the downside outweighs the upside.",
    };
  }

  if (verdict === "caution") {
    return {
      headline: "Proceed with caution",
      bullets:
        length === "high"
          ? [
              "Some items need clarification before committing.",
              "These findings affect risk but do not rule the car out.",
            ]
          : [
              "Some items need clarification before committing.",
              "These findings don’t rule the car out, but they do affect risk.",
              "Resolving them reduces the chance of surprises after purchase.",
            ],
      nextBestAction:
        "Clarify the flagged items and reassess once you have firmer information.",
      why:
        length === "high"
          ? "The inspection did not reveal deal-breakers, but there are uncertainties that matter. Clarifying them improves confidence before you commit."
          : "The inspection did not reveal deal-breakers, but there are uncertainties that materially affect risk. Resolving them reduces the chance of unexpected issues after purchase.",
    };
  }

  // proceed (default)
  return {
    headline: "Inspection supports proceeding",
    bullets:
      length === "high"
        ? [
            "No major mechanical, structural, or ownership risks were identified.",
            "Recorded issues appear minor or consistent with the vehicle’s age.",
          ]
        : [
            "No major mechanical, structural, or ownership risks were identified.",
            "Recorded issues appear minor or consistent with the vehicle’s age.",
            "Nothing recorded suggests a serious underlying issue.",
          ],
    nextBestAction:
      "Proceed with standard checks and confirm service history.",
    why:
      length === "high"
        ? "Based on what was recorded during the inspection, nothing suggests a serious underlying issue. This verdict reflects the absence of major warning signs."
        : "Based on what was recorded during the inspection, nothing suggests a serious underlying issue. This verdict reflects the absence of major warning signs, while still assuming normal due diligence before purchase.",
  };
}

/* =========================================================
   Gemini
========================================================= */

async function callGeminiJSON(payload: any, apiKey: string) {
  const verdict = payload?.analysis?.verdict;
  const confidenceScore = payload?.analysis?.confidenceScore;
  const tone = toneForVerdict(verdict, confidenceScore);

  const prompt = `
You are CarVerity’s expert used-car inspection interpreter.

The inspection verdict is: "${verdict ?? "unknown"}".
Confidence score: ${confidenceScore ?? "unknown"}.

Write guidance that matches this verdict and confidence level.

Tone rules:
- Calm, decisive, buyer-safe
- High confidence → firm and concise (not thin)
- Lower confidence → fuller explanation
- Never invent issues
- Avoid legal or absolute guarantees

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
      apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: prompt.trim() }] },
          { role: "user", parts: [{ text: JSON.stringify(payload) }] },
        ],
        generationConfig: { temperature: 0.3 },
      }),
    }
  );

  const json = await res.json();
  const rawText =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const parsed = safeJsonParse(String(rawText).trim()) ?? {};

  return {
    decisionBrief: {
      headline: cleanSentence(
        parsed?.decisionBrief?.headline,
        tone.headline,
        120
      ),
      bullets: cleanStringArray(
        parsed?.decisionBrief?.bullets,
        tone.bullets,
        5
      ),
      nextBestAction: cleanSentence(
        parsed?.decisionBrief?.nextBestAction,
        tone.nextBestAction,
        200
      ),
    },

    whyThisVerdict: cleanSentence(
      parsed?.whyThisVerdict,
      tone.why,
      900
    ),

    topSignals: {
      positive: cleanStringArray(parsed?.topSignals?.positive, [], 5),
      concerns: cleanStringArray(parsed?.topSignals?.concerns, [], 5),
      unknowns: cleanStringArray(parsed?.topSignals?.unknowns, [], 5),
    },

    questionsToAskSeller: cleanStringArray(
      parsed?.questionsToAskSeller,
      [],
      6
    ),

    confidenceNote: cleanSentence(
      parsed?.confidenceNote,
      "This guidance is based on the information recorded during the inspection.",
      200
    ),

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
    const {
      GOOGLE_API_KEY,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    } = process.env;

    if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ ok: false });
    }

    const scanId = String(req.body?.scanId ?? "").trim();
    const progress = req.body?.progress ?? null;
    const analysis = req.body?.analysis ?? null;

    if (!scanId || !progress || !analysis) {
      return res.status(400).json({ ok: false });
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const ai = await callGeminiJSON(
      {
        scanId,
        progress,
        analysis,
        summary: req.body?.summary ?? null,
      },
      GOOGLE_API_KEY
    );

    try {
      await supabase
        .from("scans")
        .update({ report: { aiInterpretation: ai } })
        .eq("scan_id", scanId);
    } catch {
      // non-fatal
    }

    return res.status(200).json({
      ok: true,
      scanId,
      ai,
    });
  } catch (err) {
    console.error("analyze-in-person error", err);
    return res.status(500).json({ ok: false });
  }
}
