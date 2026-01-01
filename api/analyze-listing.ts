// /api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface ExtractedVehicle {
  make?: string;
  model?: string;
  year?: string;
  variant?: string;
  importStatus?: string;
  title?: string;
  source?: string;
}

function parseFromTitle(title: string) {
  if (!title) return {};

  // Example match: "2016 Mitsubishi Lancer ES"
  const m = title.match(/(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9\-]+)/);
  if (!m) return {};

  return {
    year: m[1],
    make: m[2],
    model: m[3],
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    const { url: listingUrl } = req.body || {};

    if (!listingUrl || typeof listingUrl !== "string") {
      return res.status(400).json({
        ok: false,
        message: "Missing or invalid listing URL",
      });
    }

    console.log("🔎 Analyzing listing:", listingUrl);

    // -------------------------------------------
    // 🧠 This is your existing extractor call
    // -------------------------------------------
    const extracted: ExtractedVehicle = await fakeListingExtractor(listingUrl);

    // -------------------------------------------
    // ✅ NEW: fallback parsing from page title
    // -------------------------------------------
    const fallback = parseFromTitle(extracted?.title ?? "");

    const vehicle = {
      make: extracted?.make || fallback.make || "",
      model: extracted?.model || fallback.model || "",
      year: extracted?.year || fallback.year || "",
      variant: extracted?.variant || "",
      importStatus:
        extracted?.importStatus || "Sold new in Australia (default)",
      source: extracted?.source || "auto-search+extractor",
      listingUrl,
    };

    console.log("🚗 Final vehicle object >>>", vehicle);

    return res.status(200).json({
      ok: true,
      vehicle,
      message: "Scan complete",
    });
  } catch (err: any) {
    console.error("❌ analyze-listing failed:", err?.message || err);
    return res.status(500).json({
      ok: false,
      message: "Listing analysis failed",
    });
  }
}

/**
 * --------------------------------------------------
 * 🧩 Temporary mock extractor
 * Replace later w/ real site scrapers
 * --------------------------------------------------
 */
async function fakeListingExtractor(url: string): Promise<ExtractedVehicle> {
  return {
    title: "2016 Mitsubishi Lancer ES Sport",
    source: "auto-search+extractor",
  };
}
