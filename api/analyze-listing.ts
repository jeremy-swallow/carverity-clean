// api/analyze-listing.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

/* -----------------------------------------
   Basic normaliser
------------------------------------------ */
function normalise(t: string): string {
  return t.replace(/\s+/g, " ").trim();
}

/* -----------------------------------------
   Utility formatters
------------------------------------------ */
function titleCase(s: string): string {
  const parts = s.split(" ");
  const out: string[] = [];

  for (const raw of parts) {
    const word = raw.trim();
    if (!word) continue;

    if (word.length <= 2) {
      out.push(word.toUpperCase());
    } else {
      out.push(word[0].toUpperCase() + word.slice(1));
    }
  }

  return out.join(" ");
}

interface ParsedVehicle {
  year: string;
  make: string;
  model: string;
  variant: string;
}

/* -----------------------------------------
   Carsales refinement logic
------------------------------------------ */
function refineCarsales(parsed: ParsedVehicle): ParsedVehicle {
  let { year, make, model, variant } = parsed;

  // Title-case make
  make = titleCase(make);

  // Normalise CX-30 / CX-5 / MX-5 spacing and casing
  model = model
    .replace(/\b(cx)\s*(\d+)\b/i, (_match: string, a: string, b: string) => {
      return `${a.toUpperCase()}-${b}`;
    })
    .replace(/\b(mx)\s*(\d+)\b/i, (_match: string, a: string, b: string) => {
      return `${a.toUpperCase()}-${b}`;
    })
    .replace(/\s+/g, " ")
    .trim();

  // Move engine code (G20, G25, X20, etc) into the front of variant
  const engineMatch = variant.match(/\b[gx]\d{2}\b/i);
  if (engineMatch) {
    const engine = engineMatch[0].toUpperCase();
    variant = variant.replace(engineMatch[0], "").trim();
    variant = `${engine} ${variant}`.trim();
  }

  variant = titleCase(variant);

  return { year, make, model, variant };
}

/* -----------------------------------------
   Carsales URL token parser
------------------------------------------ */
function parseFromUrl(url: string): ParsedVehicle {
  try {
    const decoded = decodeURIComponent(url);
    const parts = decoded.split("/").filter((p) => p.length > 0);

    const slug = parts.find((p) => p.includes("-")) ?? "";
    const slugWithoutHtml = slug.replace(/\.html?.*/i, "");

    const tokens = slugWithoutHtml
      .split("-")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const yearToken = tokens.find((t) => /^\d{4}$/.test(t)) ?? "";

    const make = tokens.length > 1 ? tokens[1] : "";
    const model = tokens.length > 2 ? tokens[2] : "";

    const variantTokens = tokens.slice(3);
    const variant = variantTokens.join(" ").trim();

    return {
      year: yearToken,
      make,
      model,
      variant,
    };
  } catch {
    return { year: "", make: "", model: "", variant: "" };
  }
}

/* -----------------------------------------
   Main handler
------------------------------------------ */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const bodyUrl =
    (req.body as any)?.url ?? (req.query?.url as string | undefined);
  const url = typeof bodyUrl === "string" ? bodyUrl.trim() : "";

  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  try {
    // 🔹 Carsales — handle via URL parsing + refinement
    if (url.includes("carsales.com.au")) {
      const parsed = parseFromUrl(url);
      const refined = refineCarsales(parsed);

      return res.json({
        ok: true,
        source: "carsales:url-parser+refine",
        title: "",
        extracted: refined,
      });
    }

    // 🔹 Generic HTML fallback for other sites
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    let title =
      $("h1").first().text() ||
      $(`meta[property="og:title"]`).attr("content") ||
      $("title").text() ||
      "";

    title = normalise(title);

    return res.json({
      ok: true,
      source: "fallback",
      title,
      extracted: {
        year: "",
        make: "",
        model: "",
        variant: "",
      },
    });
  } catch (err) {
    console.error("analyze-listing error:", err);
    return res.status(500).json({ ok: false, error: "fetch failed" });
  }
}
