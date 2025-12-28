// /api/analyze-listing.ts

export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

type ImportStatus =
  | "au-new"
  | "au-delivered-import-brand"
  | "grey-import"
  | "unknown";

interface VehiclePayload {
  make?: string;
  model?: string;
  year?: string;
  variant?: string;
  importStatus?: ImportStatus | string;
  kilometres?: string;
  owners?: string | null;
}

interface AnalysisPayload {
  listingUrl: string;
  vehicle?: VehiclePayload;
  kilometres?: string | null;
  owners?: string | null;
  conditionSummary?: string | null;
  notes?: string | null;
}

interface AiSignal {
  level: "low" | "medium" | "high";
  area: string;
  text: string;
  advice?: string;
}

interface AiSection {
  title: string;
  content: string;
}

interface AiReport {
  summary: string;
  signals: AiSignal[];
  sections: AiSection[];
}

function buildContext(payload: AnalysisPayload): string {
  const { listingUrl, vehicle, kilometres, owners, conditionSummary, notes } =
    payload;

  const v = vehicle ?? {};
  const parts: string[] = [];

  parts.push(`Listing URL: ${listingUrl}`);

  const vehicleLine = [
    v.year,
    v.make,
    v.model,
    v.variant ? `(${v.variant})` : "",
  ]
    .filter(Boolean)
    .join(" ");
  if (vehicleLine) parts.push(`Vehicle: ${vehicleLine}`);

  if (v.importStatus && v.importStatus !== "unknown") {
    parts.push(`Import status: ${v.importStatus}`);
  }

  if (kilometres) parts.push(`Odometer: ${kilometres} km (approx)`);
  if (owners) {
    parts.push(`Reported previous owners: ${owners}`);
  } else {
    parts.push(`Previous owners: unknown / not stated`);
  }

  if (conditionSummary) {
    parts.push(`Condition summary (from user/listing): ${conditionSummary}`);
  }
  if (notes) {
    parts.push(`Additional notes: ${notes}`);
  }

  return parts.join("\n");
}

function buildFallbackReport(payload: AnalysisPayload): AiReport {
  const ctx = buildContext(payload);

  const summary =
    "Basic context captured for this car, but AI analysis is not fully configured yet. " +
    "Use the notes below as a starting point and always arrange an independent mechanical inspection.";

  const sections: AiSection[] = [
    {
      title: "What we know so far",
      content: ctx,
    },
    {
      title: "Next steps before you buy",
      content:
        [
          "• Confirm PPSR / REVS check for finance owing, write-off and stolen status.",
          "• Arrange a pre-purchase inspection with a qualified mechanic.",
          "• Verify logbook service history and check for any large gaps.",
          "• Test drive and confirm there are no warning lights or obvious drivability issues.",
        ].join("\n"),
    },
    {
      title: "Limitations of this report",
      content:
        "This is a basic, non-AI fallback summary. It does not look at the actual listing text or photos. " +
        "You should rely on your own judgement and professional inspections.",
    },
  ];

  return {
    summary,
    signals: [],
    sections,
  };
}

async function callOpenAI(payload: AnalysisPayload): Promise<AiReport> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ OPENAI_API_KEY not set — using fallback analysis.");
    return buildFallbackReport(payload);
  }

  const context = buildContext(payload);

  const systemPrompt =
    "You are an assistant helping used-car buyers in Australia assess risk, value, and next steps. " +
    "You must respond STRICTLY in JSON with keys: summary, signals, sections. " +
    "summary: short human-readable overview. " +
    "signals: array of objects { level: 'low' | 'medium' | 'high', area: string, text: string, advice?: string }. " +
    "sections: array of objects { title: string, content: string } with detailed guidance, negotiation tips, and inspection advice. " +
    "Do NOT invent specific mechanical faults with certainty if they are not implied; instead, talk in terms of likelihoods and checks. " +
    "Assume the reader is not a mechanic. Avoid legal or finance advice beyond general suggestions to get checks.";

  const userPrompt =
    "Analyse this used-car purchase context and produce a structured report.\n\n" +
    context +
    "\n\nFocus especially on:\n" +
    "- risk signals (price too good, high km for age, grey import implications, missing info)\n" +
    "- what to ask the seller\n" +
    "- what to look for in an in-person inspection\n" +
    "- negotiation leverage\n" +
    "- when to walk away.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("❌ OpenAI error:", await response.text());
      return buildFallbackReport(payload);
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("❌ OpenAI: missing content");
      return buildFallbackReport(payload);
    }

    const parsed = JSON.parse(content) as AiReport;

    // Basic sanity fallback
    if (!parsed.summary || !Array.isArray(parsed.sections)) {
      return buildFallbackReport(payload);
    }

    return parsed;
  } catch (err: any) {
    console.error("❌ AI call failed:", err?.message || err);
    return buildFallbackReport(payload);
  }
}

// -----------------------------
// API Handler
// -----------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body as AnalysisPayload | undefined;

    if (!body?.listingUrl) {
      return res.status(400).json({ error: "Missing listingUrl" });
    }

    const payload: AnalysisPayload = {
      listingUrl: body.listingUrl,
      vehicle: body.vehicle ?? {},
      kilometres: body.kilometres ?? body.vehicle?.kilometres ?? null,
      owners: body.owners ?? body.vehicle?.owners ?? null,
      conditionSummary: body.conditionSummary ?? null,
      notes: body.notes ?? null,
    };

    const report = await callOpenAI(payload);

    const sellerType: "dealer" | "private" | "unknown" = "unknown"; // placeholder – can refine later

    return res.status(200).json({
      ok: true,
      analysisSource: process.env.OPENAI_API_KEY ? "ai" : "fallback",
      sellerType,
      listingUrl: payload.listingUrl,
      summary: report.summary,
      signals: report.signals,
      sections: report.sections,
    });
  } catch (err: any) {
    console.error("❌ API error:", err?.message || err);

    return res.status(500).json({
      ok: false,
      error: "ANALYSIS_FAILED",
      detail: err?.message || "Unknown error",
    });
  }
}
