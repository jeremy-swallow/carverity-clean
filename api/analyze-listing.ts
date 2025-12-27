// /api/analyze-listing.ts

// Tell Vercel this is a Node.js Serverless Function
export const config = {
  runtime: "nodejs",
};

import type { VercelRequest, VercelResponse } from "@vercel/node";
// IMPORTANT: use .js here (TypeScript compiles sellerClassifier.ts -> .js)
import classifySeller from "../src/utils/sellerClassifier.js";

/**
 * Simple analyzer:
 * - Accepts POST { listingUrl }
 * - Fetches the HTML for that URL
 * - Classifies seller type using classifySeller()
 * - Returns sections for the frontend to render
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Vercel may give body as string or already-parsed object
    const rawBody = req.body as any;
    const body =
      typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody ?? {};
    const listingUrl = body?.listingUrl as string | undefined;

    if (!listingUrl || typeof listingUrl !== "string") {
      return res.status(400).json({ error: "Missing listingUrl" });
    }

    console.log("🧵 /api/analyze-listing called", { listingUrl });

    // Fetch the listing HTML
    console.log("📄 Fetching listing HTML…", listingUrl);
    const response = await fetch(listingUrl);

    if (!response.ok) {
      console.error(
        "❌ Failed to fetch listing",
        response.status,
        response.statusText
      );
      return res.status(502).json({
        ok: false,
        analysisSource: "live",
        error: "Failed to fetch listing HTML",
      });
    }

    const html = await response.text();
    console.log("📄 HTML length:", html.length);

    // Classify seller type using our utility
    console.log("🧩 Classifying seller type…");
    const sellerType = classifySeller(html) ?? "unknown";

    // Very simple sections (we can later swap these to real AI output)
    const sections = [
      {
        title: "Overall risk rating",
        content:
          sellerType === "dealer"
            ? "Low (live — auto classified as dealership listing)."
            : sellerType === "private"
            ? "Medium (live — auto classified as private seller)."
            : "Unknown (live — seller type could not be classified).",
      },
      {
        title: "Seller type",
        content: `Detected seller type: ${sellerType}.`,
      },
      {
        title: "Notes",
        content:
          "This is an early live classifier using page wording only. Future versions will use your AI API for deeper analysis.",
      },
    ];

    return res.status(200).json({
      ok: true,
      analysisSource: "live",
      sellerType,
      htmlLength: html.length,
      sections,
    });
  } catch (err: any) {
    console.error("❌ /api/analyze-listing error", err);

    return res.status(500).json({
      ok: false,
      analysisSource: "offline-mock",
      error: err?.message ?? "Unknown error",
      sections: [],
    });
  }
}
