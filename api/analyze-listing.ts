// /api/analyze-listing.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

/** Normalise whitespace */
function normalise(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

/** Try to parse vehicle info from a title string */
function parseTitle(title: string) {
  title = normalise(title).toLowerCase();

  const yearMatch = title.match(/\b(20[0-9]{2}|19[0-9]{2})\b/);
  const year = yearMatch ? yearMatch[0] : "";

  const cleaned = year ? title.replace(year, "").trim() : title;
  const parts = cleaned.split(" ");

  const make = parts[0] || "";

  const VARIANT_TRIGGERS = [
    "g20",
    "g25",
    "touring",
    "maxx",
    "ascent",
    "sport",
    "gt",
    "sp",
    "x",
    "hybrid",
    "awd",
    "fwd",
    "turbo",
  ];

  const modelTokens: string[] = [];
  const variantTokens: string[] = [];

  for (const p of parts.slice(1)) {
    if (VARIANT_TRIGGERS.includes(p)) variantTokens.push(p);
    else modelTokens.push(p);
  }

  return {
    make,
    model: modelTokens.join(" "),
    variant: variantTokens.join(" "),
    year,
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const url = (req.body as any)?.url || (req.query as any)?.url;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    /** ---------- MULTI-SOURCE TITLE EXTRACTION ---------- */

    let title: string =
      $("h1").first().text() ||
      // JSON-LD title fallback (Carsales / CarsGuide / Cars24)
      $("script[type='application/ld+json']")
        .map((_, el) => String($(el).text() || ""))
        .toArray()
        .map(String)
        .find((s) =>
          s.toLowerCase().includes("vehicle") ||
          s.toLowerCase().includes("car")
        ) ||
      // OpenGraph title
      (String($("meta[property='og:title']").attr("content") || "")) ||
      // Fallback page title
      $("title").text() ||
      "";

    title = normalise(title);

    const extracted = parseTitle(title);

    return res.json({
      ok: true,
      title,
      extracted,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unexpected error",
    });
  }
}
