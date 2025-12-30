import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

/** Normalise whitespace */
function normalise(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

/**
 * Extract fields from a listing title like:
 * "2021 Mazda CX-30 G20 Touring Auto"
 */
function parseTitle(title: string) {
  title = normalise(title).toLowerCase();

  const yearMatch = title.match(/\b(20[0-9]{2}|19[0-9]{2})\b/);
  const year = yearMatch ? yearMatch[0] : "";

  // remove year for easier parsing
  const cleaned = title.replace(year, "").trim();

  const parts = cleaned.split(" ");

  // first word after year should be make
  const make = parts[0] || "";

  // model = next token(s) until variant trigger words
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
    "hybrid"
  ];

  const modelTokens: string[] = [];
  const variantTokens: string[] = [];

  for (const p of parts.slice(1)) {
    if (VARIANT_TRIGGERS.includes(p)) {
      variantTokens.push(p);
    } else {
      modelTokens.push(p);
    }
  }

  return {
    make,
    model: modelTokens.join(" "),
    variant: variantTokens.join(" "),
    year
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = req.body?.url || req.query?.url;
    if (!url) {
      return res.status(400).json({ error: "Missing URL" });
    }

    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $("meta[property='og:title']").attr("content") ||
      $("title").text() ||
      "";

    const extracted = parseTitle(title);

    return res.json({
      ok: true,
      title,
      extracted
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unexpected error"
    });
  }
}
