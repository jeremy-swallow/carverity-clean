/* api/analyze-listing.ts */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadProgress, saveProgress } from "./scanProgress";
import {
  extractVehicleFromListing,
  type ExtractVehicleResponse,
} from "./extract-vehicle-from-listing";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { url } = req.body ?? {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  console.log("🔍 Analyzing listing:", url);

  // 🔹 Call the extractor helper (NOT the API handler)
  const extraction: ExtractVehicleResponse = await extractVehicleFromListing(
    url
  );

  console.log("🧠 ANALYSIS RESULT >>>", extraction);

  const existing = loadProgress() ?? {};

  const extractedVehicle = extraction.vehicle ?? {
    make: "",
    model: "",
    year: "",
    variant: "",
  };

  const vehicle = {
    make: extractedVehicle.make || existing.vehicle?.make || "",
    model: extractedVehicle.model || existing.vehicle?.model || "",
    year: extractedVehicle.year || existing.vehicle?.year || "",
    variant: extractedVehicle.variant || existing.vehicle?.variant || "",
    importStatus:
      existing.vehicle?.importStatus ?? "Sold new in Australia (default)",
  };

  // 📝 Persist scan progress for the next steps
  saveProgress({
    ...existing,
    type: "online",
    step: "online/vehicle",
    listingUrl: url,
    startedAt: existing.startedAt ?? new Date().toISOString(),
    vehicle,
  });

  console.log("✅ Stored vehicle in progress:", vehicle);

  // Maintain the original response shape for the frontend
  return res.status(200).json({
    ok: true,
    source:
      extraction.reason === "blocked_source"
        ? "blocked_source"
        : "carsales-url-parser",
    extracted: {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      variant: vehicle.variant,
    },
  });
}
