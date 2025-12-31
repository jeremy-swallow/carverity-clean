import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

// Helper — safely parse JSON or return null
async function safeJson(res: any) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const listingUrl = body?.listingUrl ?? null;

    console.log("▶️ analyze-listing called — listingUrl =", listingUrl || "(manual)");

    let extractedListing: any = null;

    //
    // 1️⃣ If a listing URL exists → call /api/search-listing
    //
    if (listingUrl) {
      try {
        const searchRes = await fetch(`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/search-listing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: listingUrl })
        });

        extractedListing = await safeJson(searchRes);
        console.log("🔎 search-listing result =", extractedListing);
      } catch (err) {
        console.warn("⚠️ search-listing failed — continuing manual mode", err);
      }
    }

    //
    // 2️⃣ Build merged vehicle object (partial-safe)
    //
    const vehicle = {
      make: extractedListing?.make ?? body?.make ?? "",
      model: extractedListing?.model ?? body?.model ?? "",
      year: extractedListing?.year ?? body?.year ?? "",
      variant: extractedListing?.variant ?? body?.variant ?? "",
      importStatus: extractedListing?.importStatus ?? body?.importStatus ?? "unknown",
      source: listingUrl ? "auto-search+extractor" : "manual-entry",
      listingUrl: listingUrl ?? null,
    };

    console.log("✅ Final merged vehicle object >>>", vehicle);

    //
    // 3️⃣ Return valid success payload
    //
    return res.status(200).json({
      ok: true,
      vehicle,
      message: "Scan complete"
    });

  } catch (err: any) {
    console.error("❌ analyze-listing error:", err?.message || err);

    return res.status(500).json({
      ok: false,
      error: err?.message || "Analyze failed"
    });
  }
}
