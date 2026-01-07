// src/pages/api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

/* =========================================================
   HTTP Helpers
========================================================= */

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
      "Accept-Language": "en-AU,en;q=0.9",
    },
  });

  if (!res.ok) throw new Error(`fetch-failed:${res.status}`);
  return await res.text();
}

/* =========================================================
   Photo Extraction — Normalised Output Shape
   - hero = best / primary image
   - listing[] = supporting images
========================================================= */

function cleanUrl(u: any): string | null {
  if (!u || typeof u !== "string") return null;
  const t = u.trim();
  if (!t) return null;
  if (t.startsWith("data:")) return null;
  if (t.includes("placeholder")) return null;
  return t;
}

function rankImage(url: string): number {
  const lower = url.toLowerCase();

  // Prefer full-size images
  if (lower.includes("1024") || lower.includes("full") || lower.includes("large"))
    return 1;

  // Mid-size is acceptable
  if (lower.includes("640") || lower.includes("medium")) return 2;

  // Thumbnails last
  if (lower.includes("thumb") || lower.includes("small")) return 3;

  // Unknown — middle bucket
  return 2;
}

function selectHeroAndThumbnails(list: string[]) {
  const unique = Array.from(new Set(list.map((u) => u.trim())));

  const sorted = unique
    .filter(Boolean)
    .map((u) => ({ url: u, score: rankImage(u) }))
    .sort((a, b) => a.score - b.score);

  const hero = sorted.length ? sorted[0].url : null;

  const thumbnails = sorted
    .slice(1)
    .map((p) => p.url)
    .slice(0, 6); // cap thumbnails

  return { hero, thumbnails };
}

function extractListingPhotosFromPage(html: string) {
  const urls: string[] = [];

  // Common marketplaces embed JSON blobs containing images
  const jsonMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonMatches) {
    for (const m of jsonMatches) {
      try {
        const body = m.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
        const obj = JSON.parse(body);

        if (Array.isArray(obj?.image)) {
          urls.push(...obj.image);
        }

        if (Array.isArray(obj?.photos)) {
          urls.push(...obj.photos);
        }
      } catch {}
    }
  }

  // Fallback <img> scraping as backup
  const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi);
  if (imgMatches) {
    for (const tag of imgMatches) {
      const m = tag.match(/src=["']([^"']+)["']/i);
      if (m?.[1]) urls.push(m[1]);
    }
  }

  const cleaned = urls
    .map(cleanUrl)
    .filter((u): u is string => Boolean(u));

  const { hero, thumbnails } = selectHeroAndThumbnails(cleaned);

  return {
    hero,
    listing: [hero, ...thumbnails].filter(Boolean),
    thumbnails,
    raw: cleaned,
  };
}

/* =========================================================
   Gemini Listing Analysis
========================================================= */

async function callGeminiAnalysis(listingHtml: string, listingUrl: string) {
  const prompt = `
You are analysing a used-car marketplace listing.

Focus on:
- condition signals
- risks or uncertainty
- ownership & suitability guidance
- service history clarity
- negotiation angles
- confidence level

Respond in **structured plain English paragraphs**.
Avoid hallucinating. If something is unclear, say it is unclear.

Return fields in JSON:
{
  "vehicle": { "make": string | null, "model": string | null, "year": string | null, "kilometres": string | null },
  "summary": string,
  "confidenceCode": "LOW" | "MODERATE" | "HIGH" | null
}
`;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: prompt }] },
          { role: "user", parts: [{ text: listingHtml.slice(0, 180_000) }] },
        ],
      }),
    }
  );

  const json = await res.json();

  const text =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    json?.candidates?.[0]?.content?.parts?.[0]?.data ??
    "";

  let parsed: any = {};
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    parsed = { summary: text };
  }

  return {
    vehicle: parsed.vehicle ?? {},
    summary: parsed.summary ?? "",
    confidenceCode: parsed.confidenceCode ?? null,
    source: "gemini-2.5-flash",
  };
}

/* =========================================================
   Handler
========================================================= */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const listingUrl = (req.body?.listingUrl ?? req.body?.url)?.trim();
    if (!listingUrl) {
      return res.status(400).json({ ok: false, error: "missing-url" });
    }

    const html = await fetchHtml(listingUrl);

    const photos = extractListingPhotosFromPage(html);

    const analysis = await callGeminiAnalysis(html, listingUrl);

    return res.status(200).json({
      ok: true,
      ...analysis,
      listingUrl,
      photos: {
        hero: photos.hero,
        listing: photos.listing,
        thumbnails: photos.thumbnails,
      },
      imageUrls: photos.raw,
    });
  } catch (err: any) {
    console.error("analyze-listing error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message ?? "internal-error" });
  }
}
