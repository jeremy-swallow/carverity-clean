/* =========================================================
   Analyze Listing API
   - Safely merges extractor output + user-typed values
   - Never crashes on bad JSON or failed extractor calls
   ========================================================= */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { url, vehicle } = req.body || {};

    console.log("🟡 Incoming analyze-listing request >>>", { url, vehicle });

    // Default safe base object
    const baseVehicle = {
      make: "",
      model: "",
      year: "",
      variant: "",
      importStatus: "Sold new in Australia (default)",
    };

    let extracted: any = {};

    // ---- RUN VEHICLE EXTRACTOR IF URL PRESENT ----
    if (url) {
      console.log("🔎 Calling vehicle extractor for:", url);

      try {
        const extractorRes = await fetch(
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

        const bodyText = await extractorRes.text();

        try {
          const json = JSON.parse(bodyText);
          extracted = json?.vehicle ?? json?.extracted ?? {};
        } catch (err: any) {
          console.error("❌ Extractor returned non-JSON:", bodyText);
          extracted = {};
        }
      } catch (err: any) {
        console.error("❌ Extractor call failed:", err?.message);
        extracted = {};
      }
    } else {
      console.log("📝 No listing URL — using manual values only");
    }

    // ---- MERGE VALUES SAFELY ----
    const merged = {
      ...baseVehicle,
      ...extracted,
      ...(vehicle ?? {}),
    };

    console.log("💾 Final merged vehicle >>>", merged);

    return res.status(200).json({
      ok: true,
      source: "vehicle-extractor",
      extracted: merged,
    });
  } catch (err: any) {
    console.error("💥 analyze-listing fatal error:", err?.message);
    return res.status(500).json({
      ok: false,
      error: err?.message ?? "Unknown server error",
    });
  }
}
