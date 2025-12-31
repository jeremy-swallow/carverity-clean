import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadProgress, saveProgress } from "./scanProgress.js";

/**
 * analyze-listing
 * Receives a listing URL → calls extractor → merges vehicle data into scan state
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.body ?? {};

  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  console.log("🚗 Analyzing listing:", url);

  //
  // 🔎 Call extractor API (invoke via HTTP)
  //
  let extraction: any = { ok: false, extracted: {}, networkError: false };

  try {
    const base =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const apiRes = await fetch(`${base}/api/extract-vehicle-from-listing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    extraction = await apiRes.json();
  } catch (err: any) {
    console.error("❌ Extract API call failed:", err?.message);
    extraction = { ok: false, extracted: {}, networkError: true };
  }

  const extracted = extraction?.extracted ?? {};
  console.log("✨ Extracted vehicle (raw):", extracted);

  //
  // 🗂 Load existing scan state
  //
  const existing = (loadProgress() as any) ?? {};
  const existingVehicle = existing?.vehicle ?? {};

  //
  // 🧩 Merge safely — never overwrite with undefined or ""
  //
  const mergedVehicle = {
    make: extracted.make || existingVehicle.make || "",
    model: extracted.model || existingVehicle.model || "",
    year: extracted.year || existingVehicle.year || "",
    variant: extracted.variant || existingVehicle.variant || "",
    importStatus:
      extracted.importStatus ||
      existingVehicle.importStatus ||
      "Sold new in Australia (default)",
  };

  //
  // 💾 Persist (MERGE, not overwrite)
  //
  const next = {
    ...existing,
    type: "online",
    step: "/online/vehicle",
    listingUrl: url,
    vehicle: mergedVehicle,
    startedAt: existing?.startedAt ?? new Date().toISOString(),
  };

  saveProgress(next);

  console.log("💾 Stored scan progress vehicle:", mergedVehicle);

  return res.status(200).json({
    ok: true,
    source: "vehicle-extractor",
    extracted: mergedVehicle,
  });
}
