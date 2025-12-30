// /api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  try {
    const html = await fetch(url, {
      headers: { "user-agent": "CarVerityBot/1.0" }
    }).then(r => r.text());

    const $ = cheerio.load(html);

    // ---------- SMART TITLE SOURCES ----------
    const metaTitle =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content");

    const heading =
      $("h1").first().text() ||
      $("h2").first().text();

    const rawTitle = (metaTitle || heading || "").trim();

    // ---------- NORMALISATION ----------
    function clean(t: string) {
      return t
        .replace(/\s+/g, " ")
        .replace(/[,|–-]+/g, " ")
        .trim();
    }

    const title = clean(rawTitle).toLowerCase();

    const tokens = title.split(" ");

    // ---------- BASIC PARSE ----------
    let make = "";
    let model = "";
    let year = "";
    let variant = "";

    // year
    const yearToken = tokens.find(t => /^[12][0-9]{3}$/.test(t));
    if (yearToken) year = yearToken;

    // make = first non-year token
    make = tokens.find(t => t !== year && t.length > 2) || "";

    // model = next token after make
    const idx = tokens.indexOf(make);
    model = tokens[idx + 1] || "";

    // variant = rest
    variant = tokens.slice(idx + 2).join(" ");

    return res.json({
      ok: true,
      extracted: {
        make,
        model,
        year,
        variant
      }
    });

  } catch (err) {
    console.error("EXTRACTION ERROR", err);
    return res.status(500).json({
      ok: false,
      error: "SCRAPE_FAILED"
    });
  }
}
