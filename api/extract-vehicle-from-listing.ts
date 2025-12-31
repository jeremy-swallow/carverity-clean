/* api/extract-vehicle-from-listing.ts */
export const config = { runtime: "nodejs" };

import type { VercelRequest, VercelResponse } from "@vercel/node";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/* -------------------- Types -------------------- */

export interface ExtractVehicleResult {
  ok: boolean;
  vehicle: {
    make: string;
    model: string;
    year: string;
    variant: string;
  };
  error?: string;
  rawText?: string;
}

/**
 * Very lightweight HTML text extractor.
 * We intentionally avoid scraping images, scripts, or full DOM parsing.
 */
function extractListingText(html: string): string {
  const cleaned = html
    // strip scripts & styles
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // collapse whitespace
    .replace(/\s+/g, " ");

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

/* ------------------------------------------------
   Core helper: call this from other API routes
------------------------------------------------- */

export async function extractVehicleFromListing(
  url: string
): Promise<ExtractVehicleResult> {
  console.log("🔎 [extract] Fetching listing HTML:", url);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "CarVerityBot/1.0 (+https://www.carverity.com.au/)",
      },
    });

    const html = await response.text();
    const listingText = extractListingText(html);

    if (!GOOGLE_API_KEY) {
      console.warn("⚠️ GOOGLE_API_KEY missing — returning empty vehicle");
      return {
        ok: false,
        vehicle: { make: "", model: "", year: "", variant: "" },
        error: "GOOGLE_API_KEY missing",
        rawText: listingText,
      };
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

    console.log("🤖 [extract] Calling Gemini model…");

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

    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch (err: any) {
      console.warn(
        "⚠️ [extract] AI did not return valid JSON — using empty values. Raw text:",
        text
      );
      parsed = {};
    }

    const vehicle = {
      make: parsed.make || "",
      model: parsed.model || "",
      year: parsed.year || "",
      variant: parsed.variant || "",
    };

    console.log("✅ [extract] Parsed vehicle:", vehicle);

    return {
      ok: true,
      vehicle,
      rawText: text,
    };
  } catch (err: any) {
    console.error("❌ [extract] extractVehicleFromListing failed:", err?.message);
    return {
      ok: false,
      vehicle: { make: "", model: "", year: "", variant: "" },
      error: err?.message || "Unknown extraction error",
    };
  }
}

/* ------------------------------------------------
   Default API handler wrapper
------------------------------------------------- */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { url } = req.body ?? {};
  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing url" });
  }

  try {
    const result = await extractVehicleFromListing(url);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("❌ [extract] API handler crashed:", err?.message);
    return res.status(500).json({
      ok: false,
      error: "extract-vehicle-from-listing crashed",
      vehicle: { make: "", model: "", year: "", variant: "" },
    });
  }
}
