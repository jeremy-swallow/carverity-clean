// /api/analyze-listing.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

function normalise(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

/**
 * Fallback smart title parser
 * Handles formats like:
 *  "2021 Mazda CX-30 G20 Touring DM Series Auto"
 */
function parseTitleSmart(title: string) {
  const t = normalise(title);

  const yearMatch = t.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch?.[0] ?? "";
  const rest = year ? t.replace(year, "").trim() : t;

  const parts = rest.split(" ");

  const make = parts[0] ?? "";
  const model = parts.slice(1, 2).join(" ");

  // Everything after model → variant
  const variant = parts.slice(2).join(" ");

  return { year, make, model, variant };
}

function extractFromCarsalesPayload(data: any) {
  const vehicle =
    data?.listingDetails?.data?.listing ||
    data?.vehicle ||
    data?.ad ||
    null;

  if (!vehicle) return null;

  return {
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    variant: vehicle?.badge || vehicle?.variant || "",
    year: String(vehicle?.year || ""),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = (req.body as any)?.url || req.query?.url;
    if (!url)
      return res.status(400).json({ ok: false, error: "Missing URL" });

    const response = await fetch(String(url));
    const html = await response.text();
    const $ = cheerio.load(html);

    /* ---------- Carsales structured sources ---------- */

    if (url.includes("carsales.com.au")) {
      // __INITIAL_STATE__
      const stateScript = $("script")
        .toArray()
        .map(s => $(s).html() || "")
        .find(s => s.includes("__INITIAL_STATE__"));

      if (stateScript) {
        try {
          const jsonText = stateScript
            .replace(/^window\.__INITIAL_STATE__\s*=\s*/, "")
            .replace(/;$/, "");

          const parsed = JSON.parse(jsonText);
          const extracted = extractFromCarsalesPayload(parsed);

          if (extracted) {
            return res.json({
              ok: true,
              source: "carsales:state",
              extracted,
            });
          }
        } catch {}
      }

      // __NEXT_DATA__
      const nextData = $("#__NEXT_DATA__").html();
      if (nextData) {
        try {
          const parsed = JSON.parse(nextData);

          const extracted =
            extractFromCarsalesPayload(parsed?.props?.pageProps) ||
            extractFromCarsalesPayload(parsed);

          if (extracted) {
            return res.json({
              ok: true,
              source: "carsales:nextdata",
              extracted,
            });
          }
        } catch {}
      }
    }

    /* ---------- Smart TITLE fallback ---------- */

    let title =
      $("h1").first().text() ||
      $("meta[property='og:title']").attr("content") ||
      $("title").text() ||
      "";

    title = normalise(title);

    return res.json({
      ok: true,
      source: "fallback:smart-title",
      extracted: parseTitleSmart(title),
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unexpected error",
    });
  }
}
