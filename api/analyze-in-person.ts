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
   Risk extraction + language cues
========================================================= */

type Risk = { severity?: string; label?: string };

function extractRisks(analysis: any) {
  const risks: Risk[] = Array.isArray(analysis?.risks)
    ? analysis.risks
    : [];

  return {
    critical: risks.filter((r) => r.severity === "critical"),
    moderate: risks.filter((r) => r.severity === "moderate"),
  };
}

function bulletsForVerdict(
  verdict: string | undefined,
  analysis: any
): string[] {
  const { critical, moderate } = extractRisks(analysis);

  if (verdict === "walk-away") {
    const label = critical[0]?.label ?? moderate[0]?.label ?? "a significant issue";

    return [
      `A significant issue was identified (${label}), which materially affects this purchase.`,
      "This requires clear resolution before the car could be considered further.",
    ];
  }

  if (verdict === "caution") {
    const label =
      moderate[0]?.label ?? critical[0]?.label ?? "one or more items";

    return [
      `Some items worth clarifying were identified (${label}).`,
      "These findings don’t rule the car out, but they do affect risk.",
    ];
  }

  // proceed
  if (moderate.length > 0) {
    const labels = moderate
      .slice(0, 2)
      .map((r) => r.label)
      .filter(Boolean)
      .join(" and ");

    return [
      "No critical risks were identified during the inspection.",
      `Minor, routine items were limited to ${labels}.`,
    ];
  }

  return [
    "No critical or moderate risks were identified during the inspection.",
    "Recorded issues appear routine and consistent with the vehicle’s age.",
  ];
}

/* =========================================================
   Gemini
========================================================= */

async function callGeminiJSON(payload: any, apiKey: string) {
  const verdict = payload?.analysis?.verdict;
  const analysis = payload?.analysis;
  const fallbackBullets = bulletsForVerdict(verdict, analysis);

  const prompt = `
You are CarVerity’s expert used-car inspection interpreter.

The inspection verdict is: "${verdict ?? "unknown"}".

Use the inspection findings directly.
Mirror the severity of issues through clear language:
- Critical → significant, requires resolution
- Moderate → worth clarifying, affects risk
- Minor → routine, expected for age

Tone rules:
- Calm, decisive, buyer-safe
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
        verdict === "walk-away"
          ? "Significant risks identified"
          : verdict === "caution"
          ? "Proceed with caution"
          : "Inspection supports proceeding",
        120
      ),

      bullets: cleanStringArray(
        parsed?.decisionBrief?.bullets,
        fallbackBullets,
        3
      ),

      nextBestAction: cleanSentence(
        parsed?.decisionBrief?.nextBestAction,
        verdict === "walk-away"
          ? "Strongly consider walking away unless these issues can be resolved clearly."
          : verdict === "caution"
          ? "Clarify the flagged items before committing."
          : "Proceed with standard checks and confirm service history.",
        200
      ),
    },

    whyThisVerdict: cleanSentence(
      parsed?.whyThisVerdict,
      "This guidance reflects the specific findings recorded during the inspection and how their severity affects purchase risk.",
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
