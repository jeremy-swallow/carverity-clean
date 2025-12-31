/* api/analyze-listing.ts */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import extractVehicleFromListing from "./extract-vehicle-from-listing";
import type { ExtractVehicleResponse } from "./extract-vehicle-from-listing";

export const config = { runtime: "nodejs" };

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = (req.body ?? {}) as { url?: string };
  const url = body.url;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  try {
    console.log("🔎 Analyzing listing:", url);

    const result: ExtractVehicleResponse = await extractVehicleFromListing(url);

    console.log("🧠 ANALYSIS RESULT >>>", result);

    // Just return what the helper produced
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("❌ analyze-listing failed:", err?.message || err);

    return res.status(500).json({
      ok: false,
      source: "carsales-url-parser",
      error: "Internal error while analyzing listing",
    });
  }
}
