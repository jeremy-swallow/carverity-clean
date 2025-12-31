/* api/analyze-listing.ts */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadProgress, saveProgress } from "./scanProgress";
import { extractVehicleFromListing } from "./extract-vehicle-from-listing";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { url } = req.body ?? {};
  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  try {
    console.log("🔎 [analyze] Analyzing listing:", url);

    // Run extractor — ALWAYS wrapped so failures don't kill this route
    let extraction: any = {};
    try {
      extraction = await extractVehicleFromListing(url);
    } catch (err: any) {
      console.error("❌ [analyze] extractVehicleFromListing crashed:", err?.message);
      extraction = { ok: false, vehicle: {}, exception: true };
    }

    const extracted = extraction?.vehicle ?? extraction?.extracted ?? {};
    console.log("🧩 [analyze] Extracted vehicle:", extracted);

    // Load saved scan session
    const existing = loadProgress() ?? {};

    // Merge safely (never assume fields exist)
    const vehicle = {
      make: extracted.make ?? existing?.vehicle?.make ?? "",
      model: extracted.model ?? existing?.vehicle?.model ?? "",
      year: extracted.year ?? existing?.vehicle?.year ?? "",
      variant: extracted.variant ?? existing?.vehicle?.variant ?? "",
      importStatus:
        existing?.vehicle?.importStatus ?? "Sold new in Australia (default)",
    };

    // Persist state
    saveProgress({
      ...existing,
      type: "online",
      step: "/online/vehicle",
      listingUrl: url,
      vehicle,
      startedAt: existing?.startedAt ?? new Date().toISOString(),
    });

    console.log("💾 [analyze] Stored vehicle:", vehicle);

    return res.status(200).json({
      ok: true,
      source: "vehicle-extractor",
      vehicle,
    });
  } catch (err: any) {
    console.error("🔥 [analyze] analyze-listing failed:", err?.message);

    // ALWAYS return JSON on failure
    return res.status(500).json({
      ok: false,
      error: "analyze-listing crashed",
      vehicle: {},
    });
  }
}
