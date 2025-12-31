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

export interface ExtractVehicleResponse {
  ok: boolean;
  reason?: "blocked_source";
  error?: string;
  vehicle: {
    make: string;
    model: string;
    year: string;
    variant: string;
  };
}

/**
 * Very lightweight HTML text extractor.
 */
function extractListingText(html: string): string {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
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

/** Detect if the site blocked our request (Carsales / Cloudflare / etc.) */
function looksBlocked(html: string): boolean {
  const markers = [
    "access denied",
    "security challenge",
    "are you a human",
    "blocked request",
    "cloudflare",
    "captcha",
    "bot detection",
  ];

  const lower = html.toLowerCase();
  return markers.some((m) => lower.includes(m)) || html.length < 500;
}

/**
 * Core extraction logic that can be used from other API routes.
 */
async function coreExtractVehicleFromListing(
  url: string
): Promise<ExtractVehicleResponse> {
  try {
    console.log("🔎 Extracting vehicle from listing:", url);

    const response = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 CarVerityBot" },
    });

    const html = await response.text();

    // 🚧 Carsales / Cloudflare / blocked page handling
    if (looksBlocked(html)) {
      console.warn(
        "⚠️ Listing appears blocked or filtered — manual entry required"
      );

      return {
        ok: false,
        reason: "blocked_source",
        vehicle: {
          make: "",
          model: "",
          year: "",
          variant: "",
        },
      };
    }

    const listingText = extractListingText(html);

    if (!GOOGLE_API_KEY) {
      console.warn("⚠️ GOOGLE_API_KEY missing — returning empty result");
      return {
        ok: true,
        vehicle: {
          make: "",
          model: "",
          year: "",
          variant: "",
        },
      };
    }

    const modelUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      GOOGLE_API_KEY;

    const prompt = `
Extract vehicle details ONLY if clearly stated.
Return STRICT JSON:

{
  "make": "",
  "model": "",
  "year": "",
  "variant": ""
}

Do NOT guess or invent values.
Year must be 4 digits if present.

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
      console.warn("⚠️ AI did not return valid JSON — using empty values");
    }

    return {
      ok: true,
      vehicle: {
        make: parsed.make || "",
        model: parsed.model || "",
        year: parsed.year || "",
        variant: parsed.variant || "",
      },
    };
  } catch (err: any) {
    console.error("❌ extract-vehicle-from-listing failed:", err?.message);

    return {
      ok: false,
      error: "exception",
      vehicle: {
        make: "",
        model: "",
        year: "",
        variant: "",
      },
    };
  }
}

/**
 * Helper used by other API routes (like analyze-listing).
 */
export async function extractVehicleFromListing(
  url: string
): Promise<ExtractVehicleResponse> {
  return coreExtractVehicleFromListing(url);
}

/**
 * Default Vercel API handler so /api/extract-vehicle-from-listing
 * also works if ever called directly.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { url } = req.body ?? {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ ok: false, error: "Missing url" });
  }

  const result = await coreExtractVehicleFromListing(url);
  return res.status(200).json(result);
}
