import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * extract-vehicle-from-listing
 * Server-mode HTML fetch + resilient parsing
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.body ?? {};

  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  console.log("🔎 Extracting vehicle from:", url);

  //
  // ⏳ Safety timeout wrapper
  //
  const timeout = (ms: number) =>
    new Promise((_r, reject) =>
      setTimeout(() => reject(new Error("Fetch timeout exceeded")), ms)
    );

  let html = "";
  let status = 0;
  let contentType = "";

  try {
    const response: any = await Promise.race([
      fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/122.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-AU,en;q=0.9",
          "Cache-Control": "no-cache",
        },
      }),
      timeout(15000),
    ]);

    status = response.status;
    contentType = response.headers.get("content-type") ?? "";

    html = await response.text();
  } catch (err: any) {
    console.error("❌ Network fetch failed:", err?.message);
    return res.status(200).json({
      ok: false,
      blocked: true,
      reason: "network_error",
      vehicle: {},
    });
  }

  console.log("📡 Fetch result:", { status, contentType });

  //
  // 🛑 Anti-bot / invalid responses
  //
  if (!html || html.length < 200 || contentType.includes("json")) {
    console.warn("⚠️ Listing did not return valid HTML (likely blocked)");

    return res.status(200).json({
      ok: true,
      source: "vehicle-extractor",
      vehicle: {
        make: "",
        model: "",
        year: "",
        variant: "",
        importStatus: "Sold new in Australia (default)",
      },
      blocked: true,
    });
  }

  //
  // ✂️ Minimal HTML extract helpers
  //
  const pick = (pattern: RegExp) =>
    html.match(pattern)?.[1]?.trim() ?? "";

  //
  // 🧠 Cars24 heuristic field mapping
  //
  const make =
    pick(/"make"\s*:\s*"([^"]+)"/i) ||
    pick(/"manufacturer"\s*:\s*"([^"]+)"/i);

  const model =
    pick(/"model"\s*:\s*"([^"]+)"/i) ||
    pick(/"variant"\s*:\s*"([^"]+)"/i);

  const year =
    pick(/"year"\s*:\s*"([^"]+)"/i) ||
    pick(/"manufactureYear"\s*:\s*"([^"]+)"/i);

  const variant =
    pick(/"trim"\s*:\s*"([^"]+)"/i) ||
    pick(/"series"\s*:\s*"([^"]+)"/i);

  const vehicle = {
    make: make ?? "",
    model: model ?? "",
    year: year ?? "",
    variant: variant ?? "",
    importStatus: "Sold new in Australia (default)",
  };

  console.log("🚗 Extracted vehicle:", vehicle);

  return res.status(200).json({
    ok: true,
    source: "vehicle-extractor",
    vehicle,
  });
}
