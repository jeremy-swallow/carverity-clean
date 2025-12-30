/* api/extract-vehicle-from-listing.ts */
export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

interface ExtractResult {
  make?: string;
  model?: string;
  year?: string;
  variant?: string;
}

/**
 * Very lightweight HTML text extractor
 * We intentionally avoid scraping images, scripts, or full DOM parsing.
 */
function extractListingText(html: string): string {
  // Remove scripts & style blocks
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\s+/g, " ");

  // Try to capture title + description blocks
  const titleMatch = cleaned.match(/<title>(.*?)<\/title>/i);
  const metaMatch = cleaned.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
  );

  const bodySnippet = cleaned.slice(0, 4000); // safety limit

  return `
PAGE TITLE:
${titleMatch?.[1] ?? "N/A"}

META DESCRIPTION:
${metaMatch?.[1] ?? "N/A"}

PAGE TEXT SNIPPET:
${bodySnippet}
  `.trim();
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body ?? {};
  if (!url) {
    return res.status(400).json({ error: "Missing url" });
  }

  try {
    console.log("🔎 Extracting listing vehicle info:", url);

    const response = await fetch(url, {
      headers: { "user-agent": "CarVerityBot/1.0" },
    });

    const html = await response.text();
    const listingText = extractListingText(html);

    if (!GOOGLE_API_KEY) {
      console.warn("⚠️ GOOGLE_API_KEY missing — returning empty result");
      return res.status(200).json({ vehicle: {} });
    }

    const modelUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      GOOGLE_API_KEY;

    const prompt = `
You are assisting a used-car buyer. Extract structured vehicle details from
the listing text below. Only return values when confident and do NOT guess.

Return JSON ONLY in this structure:

{
  "make": "",
  "model": "",
  "year": "",
  "variant": ""
}

RULES:
- Year must be a 4-digit year if present.
- Variant is optional — include only if clearly identifiable.
- Do not hallucinate or invent values.
- Prefer values in title or description text.

LISTING TEXT:
${listingText}
`;

    const aiRes = await fetch(modelUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const json = await aiRes.json();

    const text =
      json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "{}";

    let parsed: ExtractResult = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      console.warn("⚠️ AI did not return valid JSON — continuing empty");
    }

    return res.status(200).json({
      ok: true,
      vehicle: {
        make: parsed.make || "",
        model: parsed.model || "",
        year: parsed.year || "",
        variant: parsed.variant || "",
      },
    });
  } catch (err: any) {
    console.error("❌ extract-vehicle-from-listing failed:", err?.message);

    return res.status(200).json({
      ok: false,
      vehicle: {},
      fallback: true,
    });
  }
}
