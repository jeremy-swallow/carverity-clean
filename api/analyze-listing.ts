import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

function normalise(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

const STOP_WORDS = [
  "used",
  "new",
  "demo",
  "automatic",
  "auto",
  "manual",
  "for sale",
  "car",
  "cars",
];

const VARIANT_WORDS = [
  "gx",
  "gxl",
  "touring",
  "ascent",
  "sport",
  "premium",
  "hybrid",
  "gt",
  "gts",
  "sr",
  "zr",
  "base",
  "xl",
  "xli",
  "trend",
  "ambiente",
  "platinum",
  "ultimate",
  "r-line",
  "pro",
  "ti",
  "st",
  "s-line",
];

function stripStopWords(text: string) {
  let out = text.toLowerCase();
  for (const w of STOP_WORDS) {
    out = out.replace(new RegExp(`\\b${w}\\b`, "gi"), "");
  }
  return normalise(out);
}

function detectYear(text: string) {
  const m = text.match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : "";
}

/**
 * NEW smarter model / variant logic
 */
function detectModelAndVariant(tokens: string[]) {
  let model = "";
  let variant = "";

  // Example: "CX-30 Touring" → model="CX-30" / variant="Touring"
  for (const t of tokens) {
    // Mazda CX-30 / CX-5 / CX-9 style
    if (/^cx[-\s]?\d+/i.test(t)) {
      model = t.toUpperCase();
      continue;
    }

    // Toyota / Hyundai style short codes (G20, GXL, SR, etc)
    if (/^[a-z]{1,2}\d{1,2}$/i.test(t) && !model) {
      model = t.toUpperCase();
      continue;
    }

    // Detect variant keywords
    if (VARIANT_WORDS.includes(t.toLowerCase())) {
      variant = variant ? `${variant} ${t}` : t;
    }
  }

  return {
    model: model || "",
    variant: variant || "",
  };
}

function extractFromTitle(title: string) {
  const cleaned = stripStopWords(title);
  const parts = cleaned.split(/\s+/);

  const year = detectYear(cleaned);
  const { model, variant } = detectModelAndVariant(parts);

  // First word is almost always make
  const make = parts[0] || "";

  return {
    make,
    model,
    variant,
    year,
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({ error: "Missing URL" });
  }

  const html = await fetch(url).then((r) => r.text());
  const $ = cheerio.load(html);

  const title =
    $("h1").text() ||
    $("title").text() ||
    $(".heading").text() ||
    "";

  const extracted = extractFromTitle(title);

  return res.json({
    ok: true,
    title,
    extracted,
  });
}
