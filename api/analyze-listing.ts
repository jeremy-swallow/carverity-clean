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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = (req.body as any)?.url || req.query?.url;
    if (!url) return res.status(400).json({ ok: false, error: "Missing URL" });

    const response = await fetch(String(url));
    const html = await response.text();
    const $ = cheerio.load(html);

    /* ---------- 🎯 CARSALeS — STRUCTURED PAYLOAD ---------- */
    if (url.includes("carsales.com.au")) {
      const script = $("script")
        .toArray()
        .map(s => $(s).html() || "")
        .find(s => s.includes("__INITIAL_STATE__"));

      if (script) {
        try {
          const jsonText = script
            .replace(/^window\.__INITIAL_STATE__\s*=\s*/, "")
            .replace(/;$/, "");

          const data = JSON.parse(jsonText);

          const vehicle =
            data?.listingDetails?.data?.listing ??
            data?.search?.vehicle ??
            null;

          if (vehicle) {
            return res.json({
              ok: true,
              source: "carsales:structured",
              extracted: {
                make: vehicle?.make || "",
                model: vehicle?.model || "",
                variant: vehicle?.badge || "",
                year: String(vehicle?.year || ""),
              },
            });
          }
        } catch {
          // fall back below
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
