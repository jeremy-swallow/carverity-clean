// /api/analyze-listing.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

function normalise(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

function parseTitleFallback(title: string) {
  title = normalise(title).toLowerCase();

  const yearMatch = title.match(/\b(20[0-9]{2}|19[0-9]{2})\b/);
  const year = yearMatch?.[0] ?? "";

  const cleaned = year ? title.replace(year, "").trim() : title;
  const parts = cleaned.split(" ");

  return {
    make: parts[0] ?? "",
    model: parts.slice(1, 2).join(" "),
    variant: parts.slice(2).join(" "),
    year,
  };
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
    if (!url) return res.status(400).json({ ok: false, error: "Missing URL" });

    const response = await fetch(String(url));
    const html = await response.text();
    const $ = cheerio.load(html);

    /*
     * ---------- 🎯 CARSALeS STRUCTURED SOURCES ----------
     * Try in this order:
     * 1) __INITIAL_STATE__
     * 2) __NEXT_DATA__
     * 3) fallback title parsing
     */

    if (url.includes("carsales.com.au")) {
      // 1) window.__INITIAL_STATE__
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
            return res.json({ ok: true, source: "carsales:state", extracted });
          }
        } catch {
          // ignore and continue to next strategy
        }
      }

      // 2) React __NEXT_DATA__
      const nextData = $("#__NEXT_DATA__").html();
      if (nextData) {
        try {
          const parsed = JSON.parse(nextData);

          const extracted =
            extractFromCarsalesPayload(parsed?.props?.pageProps) ||
            extractFromCarsalesPayload(parsed);

          if (extracted) {
            return res.json({ ok: true, source: "carsales:nextdata", extracted });
          }
        } catch {
          // ignore and fallback
        }
      }
    }

    /* ---------- 🌍 GENERIC TITLE FALLBACK ---------- */
    let title =
      $("h1").first().text() ||
      $("meta[property='og:title']").attr("content") ||
      $("title").text() ||
      "";

    title = normalise(title);

    return res.json({
      ok: true,
      source: "fallback:title",
      extracted: parseTitleFallback(title),
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unexpected error",
    });
  }
}
