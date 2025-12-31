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
  // 🔎 Call extractor API (never import it directly — invoke via HTTP)
  //
  let extraction: any = { ok: false, vehicle: {}, networkError: false };

  try {
    const apiRes = await fetch(
      `${process.env.VERCEL_URL
        ? "https://" + process.env.VERCEL_URL
        : "http://localhost:3000"
      }/api/extract-vehicle-from-listing`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }
    );

    extraction = await apiRes.json();
  } catch (err: any) {
    console.error("❌ Extract API call failed:", err?.message);
    extraction = { ok: false, vehicle: {}, networkError: true };
  }

  const extracted = extraction?.vehicle ?? {};
  console.log("✨ Extracted vehicle:", extracted);

  //
  // 🗂 Load existing scan state (never assume shape)
  //
  const existing = (loadProgress() as any) ?? {};

  //
  // 🧩 Merge safely into vehicle state
  //
  const vehicle = {
    make: extracted.make ?? existing?.vehicle?.make ?? "",
    model: extracted.model ?? existing?.vehicle?.model ?? "",
    year: extracted.year ?? existing?.vehicle?.year ?? "",
    variant: extracted.variant ?? existing?.vehicle?.variant ?? "",
    importStatus:
      extracted.importStatus ??
      existing?.vehicle?.importStatus ??
      "Sold new in Australia (default)",
  };

  //
  // 💾 Persist — MERGE instead of overwrite
  //
  saveProgress({
    ...existing,
    type: "online",
    step: "/online/vehicle",
    listingUrl: url,
    vehicle,
    startedAt: existing?.startedAt ?? new Date().toISOString(),
  });

  console.log("💾 Stored vehicle:", vehicle);

  return res.status(200).json({
    ok: true,
    source: "vehicle-extractor",
    extracted: vehicle,
  });
}
