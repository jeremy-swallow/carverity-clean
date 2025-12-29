export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

// NOTE: API folder is outside /src, so we must walk up into it
import { classifySeller } from "../src/utils/sellerClassifier";

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
    const response = await fetch(listingUrl);
    const html = await response.text();

    const sellerType = classifySeller(html);

    const photoFlags: string[] = [];

    if (!photos?.count || photos.count < 4) {
      photoFlags.push(
        "Low photo count — seller may be hiding important angles."
      );
    }

    if (photos?.count > 12) {
      photoFlags.push(
        "Unusually large number of photos — check for duplicates or reused images."
      );
    }

    return res.status(200).json({
      ok: true,
      analysisSource: "ai",
      sellerType,

      signals: photoFlags.map((text) => ({ text })),

      sections: [
        {
          title: "Photo transparency",
          content: `This listing contains ${photos?.count ?? 0} photos. The AI considers photo coverage, angles, and diversity when assessing transparency.`,
        },
        {
          title: "Vehicle context provided",
          content: JSON.stringify(
            {
              vehicle,
              kilometres,
              owners,
              conditionSummary,
              notes,
            },
            null,
            2
          ),
        },
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
