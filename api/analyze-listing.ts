export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

/**
 * Google AI SDK — server-side only
 */
const API_KEY = process.env.GOOGLE_GENAI_API_KEY;
const MODEL_NAME = "gemini-2.0-flash";

if (!API_KEY) {
  console.warn("⚠️ GOOGLE_GENAI_API_KEY is missing — AI mode disabled");
}

/**
 * Minimal seller classifier (fallback)
 */
function classifySeller(html: string): string {
  const lower = html.toLowerCase();

  if (lower.includes("dealer") || lower.includes("dealership")) return "dealer";
  if (lower.includes("private seller") || lower.includes("private sale"))
    return "private";

  return "unknown";
}

/**
 * Estimate API cost for finance + pricing analysis later
 */
function estimateCost(tokens: number) {
  // Approx: $0.35 per 1M tokens (Gemini Flash) — we will refine once we see logs
  return +(tokens / 1_000_000 * 0.35).toFixed(4);
}

/**
 * ---- MAIN HANDLER ----
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      listingUrl,
      vehicle,
      kilometres,
      owners,
      conditionSummary,
      notes,
      photos,
    } = req.body ?? {};

    if (!listingUrl) {
      return res.status(400).json({ error: "Missing listingUrl" });
    }

    console.log("🔍 Fetching listing page:", listingUrl);

    const page = await fetch(listingUrl, {
      headers: { "user-agent": "CarVerityBot/1.0" },
    });

    const html = await page.text();
    const sellerType = classifySeller(html);

    // ---------------------------
    //  TRY REAL AI ANALYSIS
    // ---------------------------
    let aiData: any = null;

    if (API_KEY) {
      try {
        console.log("🤖 Sending request to Google AI…");

        const body = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `
You are analysing a used-car listing to identify:

• transparency signals
• risk indicators
• potential red flags
• what the buyer should verify in-person

Return objective, helpful guidance — not sales language.

Vehicle context:
${JSON.stringify(
  { vehicle, kilometres, owners, conditionSummary, notes },
  null,
  2
)}

Photo metadata:
${JSON.stringify(photos, null, 2)}

Provide your output as structured JSON in this exact shape:

{
  "summary": string,
  "signals": [{ "text": string }],
  "sections": [
    { "title": string, "content": string }
  ]
}
                  `,
                },
              ],
            },
          ],
        };

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        const json = await response.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

        aiData = JSON.parse(text);

        const tokensUsed = json?.usageMetadata?.totalTokenCount ?? 0;
        const estCost = estimateCost(tokensUsed);

        console.log("💰 Token usage:", tokensUsed, "≈$", estCost);
      } catch (err) {
        console.error("⚠️ AI call failed — falling back", err);
      }
    }

    // ---------------------------
    //  FALLBACK IF AI NOT AVAILABLE
    // ---------------------------
    if (!aiData) {
      console.log("🛟 Using fallback logic instead of AI");

      const flags: string[] = [];

      if (!photos?.count || photos.count < 4) {
        flags.push("Low photo count — seller may be hiding key angles.");
      }

      if (photos?.count > 12) {
        flags.push(
          "Unusually large number of photos — check for duplicates or reused images."
        );
      }

      aiData = {
        summary:
          "This listing has been analysed for transparency, risk patterns and potential follow-up questions.",
        signals: flags.map((t) => ({ text: t })),
        sections: [
          {
            title: "Photo transparency",
            content: `This listing contains ${
              photos?.count ?? 0
            } photos. Photo coverage, variety and angles are key when assessing transparency.`,
          },
        ],
      };
    }

    return res.status(200).json({
      ok: true,
      analysisSource: API_KEY ? "google-ai" : "fallback",
      sellerType,
      ...aiData,
    });
  } catch (err: any) {
    console.error("❌ API failure:", err);

    return res.status(500).json({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: err?.message ?? "Unknown error",
    });
  }
}
