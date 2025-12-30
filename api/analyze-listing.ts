export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_KEY = process.env.GOOGLE_API_KEY;

/** Basic fallback classifier */
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

    console.log("🔍 Fetching listing:", listingUrl);

    const response = await fetch(listingUrl, {
      headers: { "user-agent": "CarVerityBot/1.0" },
    });

    const html = await response.text();
    const sellerType = classifySeller(html);

    let aiSummary = "";
    let aiSignals: any[] = [];
    let analysisSource = "fallback";

    if (API_KEY) {
      console.log("🤖 Calling Google AI…");

      const aiRes = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
          API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `
Analyze this used car listing and return:
- Buyer risk signals
- Honesty / transparency insights
- Safety & fraud warnings

Vehicle:
${JSON.stringify(vehicle, null, 2)}

Condition:
${conditionSummary || "None"}

Photos supplied: ${photos?.count ?? 0}
                    `,
                  },
                ],
              },
            ],
          }),
        }
      );

      const raw = await aiRes.text();
      console.log("📩 AI response:", raw);

      if (!aiRes.ok) {
        throw new Error("Google AI error: " + raw);
      }

      const aiJson = JSON.parse(raw);

      aiSummary =
        aiJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

      analysisSource = aiSummary ? "google-ai" : "fallback";

      aiSignals = aiSummary
        .split("\n")
        .filter((l: string) => l.trim().length > 2)
        .map((text: string) => ({ text }));
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
          : []),
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
