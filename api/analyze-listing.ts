// /api/analyze-listing.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

function normalise(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

function parseTitleSmart(title: string) {
  const t = normalise(title);

  const yearMatch = t.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch?.[0] ?? "";
  const rest = year ? t.replace(year, "").trim() : t;

  const parts = rest.split(" ");
  const make = parts[0] ?? "";
  const model = parts.slice(1, 2).join(" ");
  const variant = parts.slice(2).join(" ");

  return { year, make, model, variant };
}

function extractFromCarsalesListing(obj: any) {
  const v =
    obj?.listingDetails?.data?.listing ??
    obj?.retailAd ??
    obj?.vehicle ??
    obj ??
    null;

  if (!v) return null;

  return {
    make: v.make || v.makeDescription || "",
    model: v.model || v.modelDescription || "",
    variant: v.badge || v.series || v.trim || "",
    year: String(v.year || v.buildYear || ""),
  };
}

async function tryCarsalesApi(url: string) {
  const idMatch = url.match(/OAG-AD-\d+/i);
  if (!idMatch) return null;

  const id = idMatch[0];

  const apiUrl = `https://api.carsales.com.au/retail/listings/v3/${id}`;

  const res = await fetch(apiUrl, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) return null;

  const json = await res.json();
  return extractFromCarsalesListing(json);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = (req.body as any)?.url || req.query?.url;
    if (!url) return res.status(400).json({ ok: false, error: "Missing URL" });

    /* ---------- Carsales API (most reliable) ---------- */

    if (String(url).includes("carsales.com.au")) {
      const apiExtract = await tryCarsalesApi(String(url));

      if (apiExtract) {
        return res.json({
          ok: true,
          source: "carsales:api",
          extracted: apiExtract,
        });
      }
    }

    /* ---------- HTML fallback ---------- */

    const response = await fetch(String(url));
    const html = await response.text();
    const $ = cheerio.load(html);

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
