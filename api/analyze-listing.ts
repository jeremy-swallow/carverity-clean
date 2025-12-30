// api/analyze-listing.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

function normalise(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

function parseTitle(title: string) {
  const parts = title
    .replace(/[,|]/g, " ")
    .split(" ")
    .map(t => t.trim())
    .filter(Boolean);

  let make = "";
  let model = "";
  let year = "";

  for (const p of parts) {
    if (!year && /^\d{4}$/.test(p)) year = p;
    else if (!make) make = p;
    else if (!model) model = p;
  }

  return { make, model, year, variant: "" };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = (req.body?.url || req.query?.url || "").toString().trim();
    if (!url) return res.status(400).json({ ok: false, error: "Missing URL" });

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        Accept: "text/html",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return res
        .status(500)
        .json({ ok: false, error: `Failed to fetch (${response.status})` });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // ---------------- Multi-source title extraction ----------------
    let title =
      $("h1").first().text() ||
      $("meta[property='og:title']").attr("content") ||
      "";

    // JSON-LD schema fallback
    if (!title) {
      const json = $("script[type='application/ld+json']")
        .map((_, el) => $(el).text())
        .toArray()
        .map(s => String(s))        // <-- force string array
        .filter(Boolean)
        .find(s => s.includes("vehicle") || s.includes("Car"));

      if (json) {
        try {
          const obj = JSON.parse(json);
          title = obj?.name || obj?.headline || title;
        } catch {
          /* ignore malformed json */
        }
      }
    }

    title = normalise(title);
    const extracted = parseTitle(title);

    return res.json({
      ok: true,
      source: title ? "title" : "fallback",
      extracted,
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Unknown error" });
  }
}
