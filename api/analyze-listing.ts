export const config = { runtime: "nodejs" };

// api/analyze-listing.ts
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
    const { listingUrl } = req.body as { listingUrl?: string };

    if (!listingUrl) {
      return res.status(400).json({ error: "Missing listingUrl" });
    }

    console.log("🔍 Fetching listing HTML…", listingUrl);

    const response = await fetch(listingUrl);
    const html = await response.text();

    console.log("🧩 Classifying seller type…");
    const sellerType = classifySeller(html) ?? "unknown";

    return res.status(200).json({
      ok: true,
      analysisSource: "live",
      sellerType,
      htmlLength: html.length,
    });
  } catch (err: any) {
    console.error("❌ Analyzer API error:", err?.message || err);

    return res.status(500).json({
      ok: false,
      analysisSource: "mock",
      error: err?.message || "Analyzer failed — using fallback",
    });
  }
}
