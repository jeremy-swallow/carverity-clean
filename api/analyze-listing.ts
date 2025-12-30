// api/analyze-listing.ts
export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/** Basic fallback classifier so the API still works if AI fails */
function classifySeller(html: string): string {
  const lower = html.toLowerCase();
  if (lower.includes("dealer")) return "dealer";
  if (lower.includes("private")) return "private";
  return "unknown";
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { listingUrl, vehicle, kilometres, owners, conditionSummary, notes, photos } =
      req.body ?? {};

    if (!listingUrl) {
      return res.status(400).json({ error: "Missing listingUrl" });
    }

    console.log("🔍 Fetching listing:", listingUrl);

    const response = await fetch(listingUrl, {
      headers: { "user-agent": "CarVerityBot/1.0" },
    });

    const html = await response.text();
    const sellerType = classifySeller(html);

    let aiSummary = "";
    let aiSignals: { text: string }[] = [];
    let analysisSource: "google-ai" | "fallback" = "fallback";

    if (GOOGLE_API_KEY) {
      try {
        console.log("🤖 Calling Google AI…");

        // ✅ Correct endpoint and API version
        const aiRes = await fetch(
          "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=" +
            GOOGLE_API_KEY,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `
You are helping an everyday car buyer evaluate a used car listing.

Return clear, practical insights:

- key risk signals
- honesty / transparency indicators
- potential fraud/odometer/red-flag risks
- follow-up questions the buyer should ask

Vehicle info:
${JSON.stringify(vehicle, null, 2)}

Buyer notes:
${conditionSummary || "None provided"}

Photos supplied: ${photos?.count ?? 0}
                      `,
                    },
                  ],
                },
              ],
            }),
          }
        );

        const json = await aiRes.json();

        if (!aiRes.ok) {
          console.error("❌ Google AI error:", json);
        } else {
          aiSummary =
            json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

          if (aiSummary) {
            analysisSource = "google-ai";
            aiSignals = aiSummary
              .split("\n")
              .map((l) => l.trim())
              .filter((l) => l.length > 2)
              .map((text) => ({ text }));
          }
        }
      } catch (err: any) {
        console.error("❌ AI call failed:", err?.message || err);
      }
    } else {
      console.warn("⚠️ GOOGLE_API_KEY missing — fallback mode.");
    }

    return res.status(200).json({
      ok: true,
      analysisSource,
      sellerType,
      signals: aiSignals,
      sections: [
        {
          title: "Photo transparency",
          content: `This listing contains ${
            photos?.count ?? 0
          } photos. More photos generally improve confidence.`,
        },
        ...(aiSummary
          ? [
              {
                title: "AI buyer insights",
                content: aiSummary,
              },
            ]
          : [
              {
                title: "AI buyer insights",
                content: "AI insights were not available for this scan.",
              },
            ]),
      ],
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
