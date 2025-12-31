import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadProgress, saveProgress } from "./scanProgress";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { url } = req.body ?? {};
  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  console.log("🚗 Analyzing listing:", url);

  // ---- Load existing scan state ----
  const existing = loadProgress() ?? {};

  // ---- Call extractor API safely ----
  let extracted = {
    make: "",
    model: "",
    year: "",
    variant: "",
    importStatus: "Sold new in Australia (default)",
  };

  try {
    const extractorRes = await fetch(
      `${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/extract-vehicle-from-listing`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }
    );

    const data = await extractorRes.json();
    extracted = {
      ...extracted,
      ...(data?.vehicle ?? {}),
    };

    console.log("🟢 Extracted vehicle:", extracted);
  } catch (err: any) {
    console.error("❌ Extractor failed:", err?.message);
  }

  // ---- Merge fields safely ----
  const vehicle = {
    make: extracted.make || existing?.vehicle?.make || "",
    model: extracted.model || existing?.vehicle?.model || "",
    year: extracted.year || existing?.vehicle?.year || "",
    variant: extracted.variant || existing?.vehicle?.variant || "",
    importStatus:
      extracted.importStatus ||
      existing?.vehicle?.importStatus ||
      "Sold new in Australia (default)",
  };

  // ---- Persist scan ----
  saveProgress({
    ...existing,
    type: "online",
    step: "online/vehicle",
    listingUrl: url,
    vehicle,
    startedAt: existing.startedAt ?? new Date().toISOString(),
  });

  console.log("💾 Stored vehicle:", vehicle);

  return res.status(200).json({
    ok: true,
    source: "vehicle-extractor",
    vehicle,
  });
}
