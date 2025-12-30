/* api/analyze-listing.ts */
export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/* ------------------------
   Common helper rules
-------------------------*/

const STOP_WORDS = [
  "used", "buy", "for", "sale", "car", "cars", "vehicle", "price",
  "new", "demo", "review", "details", "listing", "preowned"
];

const VARIANT_WORDS = [
  "gt", "gt-line", "sport", "premium", "limited", "amg", "rs",
  "st", "trend", "xls", "xlt", "highlander", "evolve", "sle"
];

const MAKES = [
  "Mazda","Toyota","Hyundai","Kia","Mitsubishi","Honda","Subaru",
  "Nissan","Volkswagen","BMW","Mercedes","Audi","Ford","Jeep",
  "Land Rover","Peugeot","Skoda","Renault","Volvo","Mini"
];

function clean(t: string) {
  return t.replace(/[^a-z0-9\-]/gi, "").toLowerCase();
}

/* ------------------------
   Marketplace-aware logic
-------------------------*/

function extractFromUrl(url: string) {
  const parts = url
    .split("/")
    .flatMap(p => p.split("-"))
    .map(clean)
    .filter(Boolean)
    .filter(t => !STOP_WORDS.includes(t));

  return parts;
}

function extractFromTitle(html: string) {
  return (
    html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] ??
    html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] ??
    ""
  );
}

function findMake(text: string): string {
  return MAKES.find(m => text.toLowerCase().includes(m.toLowerCase())) ?? "";
}

function findYear(text: string): string {
  const y = text.match(/\b(19|20)\d{2}\b/);
  return y ? y[0] : "";
}

function detectModel(tokens: string[], make: string) {
  // handle CX-30 / MX-5 / X-TRAIL style tokens
  const dashModel = tokens.find(t => /^[a-z]{1,3}\d{1,3}$/i.test(t));
  if (dashModel) return dashModel.toUpperCase();

  // next token after make
  const i = tokens.indexOf(make.toLowerCase());
  if (i >= 0 && tokens[i+1]) return tokens[i+1].toUpperCase();

  // fallback first valid token
  return tokens[0]?.toUpperCase() ?? "";
}

function detectVariant(tokens: string[]) {
  const v = tokens.filter(t => VARIANT_WORDS.includes(t));
  return v.join(" ");
}

/* ------------------------
   Main extraction logic
-------------------------*/

function extractStructured(html: string, url: string) {
  const title = extractFromTitle(html);

  const urlTokens = extractFromUrl(url);
  const titleTokens = title
    .split(/\s+/)
    .map(clean)
    .filter(Boolean)
    .filter(t => !STOP_WORDS.includes(t));

  const make = findMake(title) || findMake(url) || "";
  const year = findYear(title);

  const allTokens = [...urlTokens, ...titleTokens];

  const model = detectModel(allTokens, make) || "";
  const variant = detectVariant(allTokens) || "";

  return { make, model, year, variant };
}

/* ------------------------
   AI fallback (only if needed)
-------------------------*/

async function aiExtract(text: string) {
  if (!GOOGLE_API_KEY) return {};

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    GOOGLE_API_KEY;

  const prompt = `
Extract vehicle details. Return ONLY JSON:

{ "make": "", "model": "", "year": "", "variant": "" }

Text:
${text}
`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try { return JSON.parse(raw); } catch { return {}; }
}

/* ------------------------
   API Handler
-------------------------*/

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { listingUrl } = req.body ?? {};
  if (!listingUrl)
    return res.status(400).json({ error: "Missing listingUrl" });

  try {
    const response = await fetch(listingUrl, {
      headers: { "user-agent": "CarVerityBot/1.1" },
    });

    const html = await response.text();

    const basic = extractStructured(html, listingUrl);

    // Only use AI if fields are missing
    let ai = {};
    if (!basic.make || !basic.model || !basic.year) {
      ai = await aiExtract(html.slice(0, 5000));
    }

    return res.status(200).json({
      ok: true,
      extracted: {
        make: (ai as any).make || basic.make || "",
        model: (ai as any).model || basic.model || "",
        year: (ai as any).year || basic.year || "",
        variant: (ai as any).variant || basic.variant || "",
      },
    });
  } catch (err: any) {
    console.error("❌ analyze error", err?.message);
    return res.status(500).json({ ok: false, error: "ANALYSIS_FAILED" });
  }
}
