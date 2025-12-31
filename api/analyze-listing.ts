import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadProgress, saveProgress } from "../src/utils/scanProgress.js";

type VehicleState = {
  make: string;
  model: string;
  year: string;
  variant: string;
  importStatus: string;
};

type ScanProgress = {
  type?: string;
  step?: string;
  listingUrl?: string;
  startedAt?: string;
  vehicle?: Partial<VehicleState>;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { url } = req.body ?? {};
  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  console.log("🚗 Analyzing listing:", url);

  //
  // 🔎 Call extractor API
  //
  let extraction: any = { ok: false, vehicle: {} };

  try {
    const apiRes = await fetch(
      `${process.env.VERCEL_URL
        ? "https://" + process.env.VERCEL_URL
        : "http://localhost:3000"}/api/extract-vehicle-from-listing`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }
    );

    extraction = await apiRes.json();
  } catch (err: any) {
    console.error("❌ Extract API failed:", err?.message);
  }

  const extracted = extraction?.vehicle ?? {};

  //
  // 🗂 Load existing progress (guarantee object shape)
  //
  const existing: ScanProgress = loadProgress() ?? {};

  //
  // 🧩 Merge safely into vehicle state
  //
  const vehicle: VehicleState = {
    make: extracted.make ?? existing.vehicle?.make ?? "",
    model: extracted.model ?? existing.vehicle?.model ?? "",
    year: extracted.year ?? existing.vehicle?.year ?? "",
    variant: extracted.variant ?? existing.vehicle?.variant ?? "",
    importStatus:
      extracted.importStatus ??
      existing.vehicle?.importStatus ??
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
    startedAt: existing.startedAt ?? new Date().toISOString(),
    vehicle: {
      ...(existing.vehicle ?? {}),
      ...vehicle,
    },
  });

  console.log("💾 Stored vehicle:", vehicle);

  return res.status(200).json({
    ok: true,
    source: "vehicle-extractor",
    extracted: vehicle,
  });
}
