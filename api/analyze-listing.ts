/* api/analyze-listing.ts */
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

/** Safe helper to extract content via regex patterns (lightweight + predictable) */
function extractFirstMatch(html: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const match = html.match(p);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

/** Extract best-effort listing fields without extra API calls */
function scrapeListingDetails(html: string) {
  const title =
    extractFirstMatch(html, [
      /<title[^>]*>(.*?)<\/title>/i,
      /<h1[^>]*>(.*?)<\/h1>/i,
    ]) ?? "";

  const kilometres =
    extractFirstMatch(html, [
      /([\d,.]+)\s*(km|kilometres|kilometers)/i,
      /odometer[^0-9]*([\d,.]+)/i,
    ]) ?? null;

  const price =
    extractFirstMatch(html, [
      /\$[\d,]+\b/g,
      /price[^$]*\s(\$[\d,]+)/i,
    ]) ?? null;

  // Extract up to 8 image URLs (avoid downloading, only store references)
  const photoUrls: string[] =
    Array.from(
      html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)
    )
      .map((m) => m[1])
      .filter((u) => !u.includes("icon") && !u.includes("logo"))
      .slice(0, 8);

  return {
    scrapedTitle: title,
    scrapedKilometres: kilometres,
    scrapedPrice: price,
    scrapedPhotos: photoUrls,
  };
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

    // 🟡 NEW — scrape useful facts without extra API calls
    const scraped = scrapeListingDetails(html);

    // Prefer user-provided values, fall back to scraped values
    const mergedKilometres = kilometres ?? scraped.scrapedKilometres;
    const mergedPhotosCount = photos?.count ?? scraped.scrapedPhotos.length;

    let aiSummary = "";
    let aiSignals: { text: string }[] = [];
    let analysisSource: "google-ai" | "fallback" = "fallback";

    // --- AI ANALYSIS BLOCK (compact, low-token, structured guidance) ---
    if (GOOGLE_API_KEY) {
      try {
        const modelUrl =
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
          GOOGLE_API_KEY;

        console.log("🤖 Using Google AI endpoint:", modelUrl);

        const isImport =
          vehicle?.importStatus === "imported" ||
          vehicle?.importStatus === "grey-import";

        const aiPrompt = `
You are assisting a used-car buyer. Provide calm, practical guidance only.
Do not speculate or assume risks where information is missing.

Return ONLY:

KEY RISKS (max 3 short bullets, or say "No obvious risks identified")
• …

WHAT TO CHECK NEXT (2–3 buyer actions)
• …

CONTEXT (do not repeat it back):
Vehicle: ${JSON.stringify(vehicle ?? {}, null, 2)}
Title text: ${scraped.scrapedTitle || "n/a"}
Kilometres: ${mergedKilometres ?? "unknown"}
Price: ${scraped.scrapedPrice ?? "unknown"}
Previous owners: ${owners ?? "unknown"}
User notes: ${conditionSummary || "None"}
Photos available: ${mergedPhotosCount}

RULES:
- Neutral and supportive tone
- No legal or alarmist language
- ONLY mention import risks if importStatus is true
`;

        const aiRes = await fetch(modelUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: aiPrompt }] }],
          }),
        });

        const json = await aiRes.json();

        if (!aiRes.ok) {
          console.error("❌ Google AI error response:", json);
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

    // --- ALWAYS RETURN SAFE RESPONSE ---
    return res.status(200).json({
      ok: true,
      analysisSource,
      sellerType,

      scraped, // expose lightweight scraped values to UI

      signals: aiSignals,
      sections: [
        {
          title: "Photo transparency",
          content: `This listing includes ${mergedPhotosCount} photos.`,
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
                content:
                  "AI insights were not available for this scan, but base checks still ran successfully.",
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
