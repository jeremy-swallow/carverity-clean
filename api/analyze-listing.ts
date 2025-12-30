/* api/analyze-listing.ts */
export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const STOP_WORDS = [
  "used",
  "buy",
  "for",
  "sale",
  "car",
  "cars",
  "vehicle",
  "price",
  "new",
  "demo",
];

function cleanToken(token: string) {
  return token
    .replace(/[^a-z0-9\-]/gi, "")
    .trim()
    .toLowerCase();
}

function extractBasicDetails(html: string, url: string) {
  const title =
    html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] ??
    html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] ??
    "";

  const yearMatch = title.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : "";

  const makes = [
    "Mazda",
    "Toyota",
    "Hyundai",
    "Kia",
    "Mitsubishi",
    "Honda",
    "Subaru",
    "Nissan",
    "Volkswagen",
    "BMW",
    "Mercedes",
    "Audi",
    "Ford",
  ];

  const make =
    makes.find((m) =>
      title.toLowerCase().includes(m.toLowerCase())
    ) ?? "";

  // --- URL-ASSISTED MODEL EXTRACTION ---
  let model = "";

  const urlParts = url
    .split("/")
    .flatMap((p) => p.split("-"))
    .map(cleanToken)
    .filter(Boolean)
    .filter((t) => !STOP_WORDS.includes(t));

  // Special handling for CX-30 / MX-5 / X-TRAIL style models
  const dashModel = urlParts.find((t) => /^[a-z]{1,3}\d{1,3}$/i.test(t));
  if (dashModel) model = dashModel.toUpperCase();

  if (!model) {
    const titleTokens = title
      .split(" ")
      .map(cleanToken)
      .filter(Boolean)
      .filter((t) => !STOP_WORDS.includes(t));

    const afterMakeIndex = titleTokens.indexOf(make.toLowerCase()) + 1;
    if (afterMakeIndex > 0 && afterMakeIndex < titleTokens.length) {
      model = titleTokens[afterMakeIndex].toUpperCase();
    }
  }

  return { make, model, year };
}

async function aiExtract(text: string) {
  if (!GOOGLE_API_KEY) return {};

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    GOOGLE_API_KEY;

  const prompt = `
Extract car details. Return ONLY JSON:

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

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { listingUrl } = req.body ?? {};
  if (!listingUrl) {
    return res.status(400).json({ error: "Missing listingUrl" });
  }

  try {
    const response = await fetch(listingUrl, {
      headers: { "user-agent": "CarVerityBot/1.0" },
    });

    const html = await response.text();

    const basic = extractBasicDetails(html, listingUrl);

    let ai = {};
    if (!basic.make || !basic.model || !basic.year) {
      ai = await aiExtract(html.slice(0, 4000));
    }

    return res.status(200).json({
      ok: true,
      extracted: {
        make: (ai as any).make || basic.make || "",
        model: (ai as any).model || basic.model || "",
        year: (ai as any).year || basic.year || "",
        variant: (ai as any).variant || "",
      },
    });
  } catch (err: any) {
    console.error("❌ analyze error", err?.message);
    return res.status(500).json({ ok: false, error: "ANALYSIS_FAILED" });
  }
}
