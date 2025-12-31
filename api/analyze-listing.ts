/* api/analyze-listing.ts */
export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadProgress, saveProgress } from "./scanProgress";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { url } = req.body ?? {};
  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  try {
    console.log("🔎 Analyzing listing:", url);

    // Call the extractor API (internal call, JSON-safe)
    const extractorRes = await fetch(
      `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers.host}/api/extract-vehicle-from-listing`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }
    );

    const extractJson = await extractorRes.json().catch(() => null);

    const extracted =
      extractJson?.vehicle ??
      extractJson?.extracted ??
      extractJson ??
      {};

    console.log("🧩 Extracted vehicle:", extracted);

    // Load any existing scan state
    const existing = loadProgress() ?? {};

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

    // Persist updated scan
    saveProgress({
      ...existing,
      type: "online",
      step: "online/vehicle",
      listingUrl: url,
      startedAt: existing.startedAt ?? new Date().toISOString(),
      vehicle,
    });

    console.log("💾 Stored vehicle:", vehicle);

    return res.status(200).json({
      ok: true,
      source: "listing-analyzer",
      vehicle,
    });
  } catch (err: any) {
    console.error("❌ analyze-listing failed:", err?.message);

    return res.status(200).json({
      ok: false,
      error: "analyze_failed",
      vehicle: { make: "", model: "", year: "", variant: "" },
    });
  }
}
