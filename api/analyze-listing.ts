/* ===========================================================
   Analyze Listing API — ALWAYS RUNS FRESH (NO CACHING)
   =========================================================== */

export const config = {
  runtime: "edge",
};

interface AnalyzeRequestBody {
  url: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, message: "Method not allowed" }),
      { status: 405 }
    );
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  });

  try {
    const body = (await req.json()) as AnalyzeRequestBody;

    if (!body?.url) {
      return new Response(
        JSON.stringify({ ok: false, message: "Missing URL" }),
        { status: 400, headers }
      );
    }

    const listingUrl = body.url.trim();

    console.log("🔍 FRESH SCAN STARTED FOR:", listingUrl);

    /* ===========================================================
       FETCH LISTING HTML — force NO cache
    =========================================================== */
    const pageRes = await fetch(listingUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CarVerityBot/1.0; +https://carverity.com)",
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
      },
    });

    const html = await pageRes.text();

    console.log("📄 HTML downloaded — length:", html.length);

    /* ===========================================================
       BASIC TEXT EXTRACTION (placeholder engine)
       TODO: AI enrichment coming later
    =========================================================== */

    function extract(pattern: RegExp, fallback = ""): string {
      const match = html.match(pattern);
      return match?.[1]?.trim() ?? fallback;
    }

    const vehicle = {
      make: extract(/"make"\s*:\s*"([^"]+)"/i) ||
        extract(/Make:\s*<\/[^>]+>\s*([^<]+)/i),
      model: extract(/"model"\s*:\s*"([^"]+)"/i) ||
        extract(/Model:\s*<\/[^>]+>\s*([^<]+)/i),
      year: extract(/"year"\s*:\s*"([^"]+)"/i) ||
        extract(/(\b20[0-3][0-9]\b)/i),
      variant: extract(/"variant"\s*:\s*"([^"]+)"/i),
      importStatus: "Sold new in Australia (default)",
      listingUrl,
      source: "auto-search+extractor",
    };

    console.log("🚗 PARSED VEHICLE:", vehicle);

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Scan complete",
        vehicle,
      }),
      { status: 200, headers }
    );

  } catch (err: any) {
    console.error("❌ Analyze failed:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        message: "Scan failed",
        error: err?.message ?? "Unknown error",
      }),
      { status: 500, headers }
    );
  }
}
