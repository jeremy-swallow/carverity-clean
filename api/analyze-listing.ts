export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Inline classifier to avoid cross-module TS import issues
 */
function classifySeller(html: string): string {
  const text = html.toLowerCase();

  if (text.includes("dealer") || text.includes("dealership")) {
    return "dealer";
  }

  if (text.includes("private seller") || text.includes("owner")) {
    return "private";
  }

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
    const { listingUrl } = req.body;

    if (!listingUrl) {
      return res.status(400).json({ error: "Missing listingUrl" });
    }

    console.log("🔎 Fetching listing:", listingUrl);

    const response = await fetch(listingUrl);
    const html = await response.text();

    const sellerType = classifySeller(html);

    return res.status(200).json({
      ok: true,
      analysisSource: "live",
      sellerType,
      htmlLength: html.length
    });
  } catch (err: any) {
    console.error("❌ API error:", err?.message || err);
    return res.status(500).json({ error: "Server error" });
  }
}
