/* api/analyze-listing.ts */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadProgress, saveProgress } from "./scanProgress";

interface ExtractResult {
  ok: boolean;
  vehicle: {
    make?: string;
    model?: string;
    year?: string;
    variant?: string;
  };
  fallback?: boolean;
  error?: string;
}

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

  console.log("🔎 Analyzing listing:", url);

  // Load existing scan record if any
  const existing = loadProgress() ?? {};

  let extracted: ExtractResult = {
    ok: false,
    vehicle: {},
  };

  try {
    const resp = await fetch(
      `${req.headers.origin}/api/extract-vehicle-from-listing`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }
    );

    extracted = (await resp.json()) as ExtractResult;

    console.log("🧩 Extract result:", extracted);
  } catch (err: any) {
    console.error("❌ extract call failed:", err?.message);
  }

  // Merge with existing values (never crash)
  const vehicle = {
    make: extracted.vehicle?.make || existing?.vehicle?.make || "",
    model: extracted.vehicle?.model || existing?.vehicle?.model || "",
    year: extracted.vehicle?.year || existing?.vehicle?.year || "",
    variant: extracted.vehicle?.variant || existing?.vehicle?.variant || "",
    importStatus:
      existing?.vehicle?.importStatus || "Sold new in Australia (default)",
  };

  // Persist
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
    source: "listing-parser",
    vehicle,
  });
}
