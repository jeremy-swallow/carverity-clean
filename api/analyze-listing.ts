// api/analyze-listing.ts
export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";
import classifySeller from "../src/utils/sellerClassifier.ts";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { listingUrl } = req.body;

    if (!listingUrl) {
      return res.status(400).json({ error: "Missing listingUrl" });
    }

    console.log("🧾 Fetching listing HTML…", listingUrl);

    const response = await fetch(listingUrl);
    const html = await response.text();

    console.log("🧩 Classifying seller type…");
    const sellerType = classifySeller(html) ?? "unknown";

    // 👇 IMPORTANT — match frontend shape
    return res.status(200).json({
      ok: true,
      analysis: {
        source: "live",
        sellerType,
        sections: [],        // UI expects this to exist
      },
    });
  } catch (err: any) {
    console.error("❌ Analyzer error", err);

    return res.status(500).json({
      ok: false,
      error: "Analyzer failed",
    });
  }
}
