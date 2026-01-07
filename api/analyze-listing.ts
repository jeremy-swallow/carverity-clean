// api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

/* =========================================================
   PHOTO EXTRACTION — INLINE
========================================================= */

type ListingPhotoSet = {
  hero?: string;
  thumbnails: string[];
};

function normaliseUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let url = raw.trim();
  if (!url) return null;

  if (url.startsWith("data:image")) return null;
  if (url.startsWith("//")) url = "https:" + url;

  if (url.includes(" ")) url = url.split(" ")[0];

  url = url.replace(/(\?|#).*$/, "");
  return url || null;
}

function extractFromCssBackground(html: string): string[] {
  const results: string[] = [];
  const regex =
    /style=["'][^"']*background-image:\s*url\(([^)]+)\)[^"']*["']/gi;
  let m;
  while ((m = regex.exec(html))) {
    const url = normaliseUrl(m[1].replace(/['"]/g, ""));
    if (url && !results.includes(url)) results.push(url);
  }
  return results;
}

function extractListingPhotosFromHtml(html: string): ListingPhotoSet {
  if (!html) return { hero: undefined, thumbnails: [] };

  const found: string[] = [];

  // <img> + lazy variants
  const imgRegex =
    /<img[^>]+?(srcset|data-src|data-original|src)\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(html))) {
    const url = normaliseUrl(m[2]);
    if (url && !found.includes(url)) found.push(url);
  }

  // <source> inside <picture>
  const sourceRegex = /<source[^>]+srcset\s*=\s*["']([^"']+)["'][^>]*>/gi;
  while ((m = sourceRegex.exec(html))) {
    const url = normaliseUrl(m[1]);
    if (url && !found.includes(url)) found.push(url);
  }

  // CSS backgrounds
  extractFromCssBackground(html).forEach((u) => {
    if (!found.includes(u)) found.push(u);
  });

  // JSON gallery blocks
  const jsonBlocks = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  if (jsonBlocks) {
    for (const block of jsonBlocks) {
      try {
        const json = JSON.parse(block.replace(/<[^>]+>/g, "").trim());
        const images =
          json?.image ||
          json?.photos ||
          json?.offers?.itemOffered?.image ||
          [];
        const arr = Array.isArray(images) ? images : [images];

        arr
          .map(normaliseUrl)
          .filter(Boolean)
          .forEach((u: any) => {
            if (!found.includes(u)) found.push(u as string);
          });
      } catch {
        // ignore invalid fragments
      }
    }
  }

  // OpenGraph fallback
  if (!found.length) {
    const ogMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    );
    const fallback = normaliseUrl(ogMatch?.[1]);
    if (fallback) found.push(fallback);
  }

  // remove UI / icons / SVG / placeholders
  const filtered = found.filter(
    (u) =>
      !u.includes("icon") &&
      !u.includes("logo") &&
      !u.includes("placeholder") &&
      !u.endsWith(".svg") &&
      !u.includes("sprite")
  );

  return {
    hero: filtered[0],
    thumbnails: filtered.slice(0, 12),
  };
}

/* =========================================================
   LISTING FETCH + TEXT EXTRACTION
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

function extractReadableText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   MODEL HELPERS
========================================================= */

type ModelResult = {
  vehicle: { make: string; model: string; year: string; kilometres: string };
  confidenceCode: string;
  previewSummary: string;
  fullSummary: string;
};

function buildFallbackResult(raw: string): ModelResult {
  const safe = (raw || "").trim() || "No structured response was returned.";
  return {
    vehicle: { make: "", model: "", year: "", kilometres: "" },
    confidenceCode: "MODERATE",
    previewSummary: safe.slice(0, 280),
    fullSummary: safe,
  };
}

function safeParseModelJson(raw: string): ModelResult {
  if (!raw?.trim()) throw new Error("empty-model-response");

  const fenced =
    raw.match(/```json([\s\S]*?)```/i)?.[1] ??
    raw.match(/```([\s\S]*?)```/i)?.[1] ??
    raw;

  const first = fenced.indexOf("{");
  const last = fenced.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first)
    return buildFallbackResult(raw);

  try {
    const parsed = JSON.parse(fenced.slice(first, last + 1));
    return {
      vehicle: {
        make: parsed?.vehicle?.make ?? "",
        model: parsed?.vehicle?.model ?? "",
        year: parsed?.vehicle?.year ?? "",
        kilometres: parsed?.vehicle?.kilometres ?? "",
      },
      confidenceCode: parsed?.confidenceCode ?? "MODERATE",
      previewSummary: parsed?.previewSummary ?? "",
      fullSummary: parsed?.fullSummary ?? "",
    };
  } catch {
    return buildFallbackResult(raw);
  }
}

async function callModel(prompt: string): Promise<ModelResult> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!res.ok) throw new Error("model-call-failed");

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ?? "";
  return safeParseModelJson(text);
}

/* =========================================================
   API HANDLER
========================================================= */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { listingUrl, pastedText } =
      (req.body ?? {}) as { listingUrl?: string; pastedText?: string };

    const assistMode = Boolean(pastedText);

    let listingText = pastedText ?? "";
    let photos: ListingPhotoSet = { hero: undefined, thumbnails: [] };

    if (!assistMode) {
      if (!listingUrl)
        return res.status(400).json({ ok: false, error: "missing-url" });

      const html = await fetchHtml(listingUrl);

      // extract BEFORE stripping text
      photos = extractListingPhotosFromHtml(html);
      listingText = extractReadableText(html);
    }

    if (!listingText || listingText.length < 400) {
      return res.status(200).json({
        ok: false,
        mode: assistMode ? "assist-manual" : "assist-required",
        reason: "insufficient-text",
        listingUrl,
      });
    }

    const prompt = `
… (prompt unchanged — service history rules, etc)
${listingText}
`;

    const result = await callModel(prompt);

    /* =====================================================
       🔹 FINAL PHOTO NORMALISATION (IMPORTANT FIX)
    ====================================================== */

    const hero =
      photos.hero ??
      photos.thumbnails[0] ??
      null;

    const thumbnails = photos.thumbnails.filter(
      (u) => u && u !== hero
    );

    return res.status(200).json({
      ok: true,
      mode: "analysis-complete",
      source: "gemini-2.5-flash",

      photos: {
        hero,
        thumbnails,
      },

      ...result,
    });
  } catch (err: any) {
    console.error("❌ analyze-listing error:", err?.message || err);
    return res.status(200).json({
      ok: false,
      mode: "error",
      reason: err?.message ?? "unknown-error",
    });
  }
}
