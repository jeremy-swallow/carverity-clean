/* api/analyze-listing.ts */
export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

function extractBasicDetails(html: string) {
  const lower = html.toLowerCase();

  const titleMatch =
    html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] ??
    html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] ??
    "";

  const text = titleMatch.replace(/[\n\r]/g, " ").trim();

  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : "";

  const makes = [
    "Toyota","Mazda","Hyundai","Kia","Mitsubishi","Honda","Subaru",
    "Ford","Volkswagen","Mercedes","BMW","Audi","Nissan","Suzuki"
  ];

  const make =
    makes.find((m) => text.toLowerCase().includes(m.toLowerCase())) ?? "";

  const modelMatch = text
    .replace(year, "")
    .replace(make, "")
    .trim()
    .split(" ")[0] ?? "";

  return { year, make, model: modelMatch };
}

async function aiExtract(text: string) {
  if (!GOOGLE_API_KEY) return {};

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    GOOGLE_API_KEY;

  const prompt = `
Extract car details from this listing text.
Return ONLY JSON in this format:

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
  const out = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    return JSON.parse(out);
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

    const basic = extractBasicDetails(html);

    let ai = {};
    if (!basic.make || !basic.model || !basic.year) {
      ai = await aiExtract(html.slice(0, 4000));
    }

    return res.status(200).json({
      ok: true,
      extracted: {
        make: (ai as any).make ?? basic.make ?? "",
        model: (ai as any).model ?? basic.model ?? "",
        year: (ai as any).year ?? basic.year ?? "",
        variant: (ai as any).variant ?? "",
      },
    });
  } catch (err: any) {
    console.error("❌ analyze error", err?.message);
    return res.status(500).json({ ok: false, error: "ANALYSIS_FAILED" });
  }
}
