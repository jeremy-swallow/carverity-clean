export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

/* =========================================================
   Seller Classifier (lightweight heuristics, no scraping)
   ========================================================= */
function classifySeller(html: string): "dealer" | "private" | "unknown" {
  const lower = html.toLowerCase();

  const dealerTerms = [
    "dealer",
    "dealership",
    "warranty",
    "abn",
    "licensed motor dealer",
    "statutory warranty",
  ];

  const privateTerms = [
    "rego",
    "no warranty",
    "priced to sell",
    "genuine reason for sale",
  ];

  if (dealerTerms.some((t) => lower.includes(t))) return "dealer";
  if (privateTerms.some((t) => lower.includes(t))) return "private";
  return "unknown";
}

/* =========================================================
   Minimal HTML signal extraction (no deep scraping)
   ========================================================= */
function extractBasicSignals(html: string) {
  const signals: { type: string; message: string }[] = [];
  const lower = html.toLowerCase();

  if (lower.includes("no warranty"))
    signals.push({
      type: "warranty",
      message: "Listing mentions no warranty — risk of auction or wholesale stock.",
    });

  if (!lower.includes("service"))
    signals.push({
      type: "history",
      message: "No clear mention of service history in listing text.",
    });

  if (lower.includes("priced to sell"))
    signals.push({
      type: "marketing-language",
      message: "Sales-style wording suggests seller may be price-anchoring.",
    });

  return signals;
}

/* =========================================================
   Core handler — produces structured richer report
   ========================================================= */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { listingUrl } = req.body ?? {};

    if (!listingUrl) {
      return res.status(400).json({ error: "Missing listingUrl" });
    }

    console.log("🔍 Fetching listing HTML:", listingUrl);
    const response = await fetch(listingUrl);
    const html = await response.text();

    const sellerType = classifySeller(html);
    const signals = extractBasicSignals(html);

    /* =====================================================
       NEW — richer structured report schema
       ===================================================== */
    const result = {
      ok: true,
      analysisSource: "ai",
      sellerType,
      htmlLength: html.length,

      summary: {
        overallRecommendation: "caution", // 👍 ok / ⚠️ caution / ❌ high-risk
        rationale:
          "Some details appear unclear from the listing. Review the flagged items below and verify them with the seller.",
      },

      riskSignals: signals,

      sections: [
        {
          id: "headline",
          title: "Overall assessment",
          content:
            "This listing presents moderate uncertainty. While nothing stands out as an immediate red flag, there are missing details that should be confirmed before proceeding.",
        },
        {
          id: "condition-confidence",
          title: "Condition & ownership confidence",
          items: [
            "Service history is not clearly described — ask for invoices or logbook proof.",
            "Listing tone suggests the seller may be focusing on price rather than history.",
          ],
        },
        {
          id: "model-watchouts",
          title: "Things to check for this type of vehicle",
          disclaimer:
            "This guidance is general — the exact risks depend on the specific model, engine and trim.",
          items: [
            "Check for uneven tyre wear or suspension noises during test-drive.",
            "Inspect for interior wear vs kilometres to assess authenticity.",
            "Listen for cold-start rattles or idle vibration.",
          ],
        },
        {
          id: "next-steps",
          title: "Recommended next steps before committing",
          items: [
            "Request service records and registration history.",
            "Ask for engine bay and dashboard photos.",
            "Arrange an independent mechanical inspection if you remain interested.",
          ],
        },
      ],
    };

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("❌ API error:", err?.message || err);

    // Graceful fallback — structured but minimal
    return res.status(200).json({
      ok: true,
      analysisSource: "fallback",
      sellerType: "unknown",
      summary: {
        overallRecommendation: "unknown",
        rationale:
          "We couldn’t retrieve full details from this listing, but you can continue to in-person checks.",
      },
      riskSignals: [],
      sections: [
        {
          id: "limited",
          title: "Limited listing data",
          content:
            "We weren’t able to extract enough information from this listing. Consider asking the seller for more details or continuing with an in-person inspection.",
        },
      ],
    });
  }
}
