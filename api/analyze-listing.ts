import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { url, vehicle } = req.body || {};

    console.log("🔎 Incoming analyze-listing request >>>", { url, vehicle });

    // Default safe vehicle object
    const baseVehicle = {
      make: "",
      model: "",
      year: "",
      variant: "",
      importStatus: "Sold new in Australia (default)",
    };

    let extracted = {};

    // ---- RUN VEHICLE EXTRACTOR IF URL PRESENT ----
    if (url) {
      console.log("🌐 Calling vehicle extractor for:", url);

      const extractorRes = await fetch(
        `${process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000"}/api/extract-vehicle-from-listing`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }
      );

      const extractorJson = await extractorRes.json();
      console.log("📦 Extractor response >>>", extractorJson);

      // SAFELY read nested vehicle fields
      extracted = extractorJson?.vehicle ?? extractorJson?.extracted ?? {};
    }

    console.log("🧩 Final extracted object >>>", extracted);
    console.log("🧩 Incoming vehicle override >>>", vehicle);

    // ---- MERGE PRIORITY ----
    // 1) User input (if present)
    // 2) Extracted values
    // 3) Default base values

    const finalVehicle = {
      ...baseVehicle,
      ...extracted,
      ...vehicle,
    };

    console.log("🚗 FINAL MERGED VEHICLE >>>", finalVehicle);

    return res.status(200).json({
      ok: true,
      source: "vehicle-extractor",
      extracted: finalVehicle,
    });
  } catch (err: any) {
    console.error("❌ analyze-listing error", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unknown error in analyze-listing",
    });
  }
}
