// src/utils/listingPhotos.ts

export interface ListingPhotoSet {
  hero?: string;
  thumbnails: string[];
}

/**
 * Normalises image URLs and removes duplicates, lazy-load attributes, etc.
 */
function normaliseUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let url = raw.trim();

  // Handle lazy-loaded attributes
  if (url.startsWith("data:image")) return null;
  if (url.startsWith("//")) url = "https:" + url;

  // Strip tracking junk
  url = url.replace(/(\?|#).*$/, "");

  return url || null;
}

/**
 * Extracts images from scraped HTML content.
 * Supports:
 * - standard <img src="">
 * - lazy images (data-src / data-original)
 * - srcset fallbacks
 */
export function extractListingPhotosFromHtml(html: string): ListingPhotoSet {
  const thumbnails: string[] = [];

  if (!html) return { hero: undefined, thumbnails: [] };

  const imgRegex =
    /<img[^>]+?(srcset|data-src|data-original|src)\s*=\s*["']([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(html))) {
    const url = normaliseUrl(match[2]);
    if (url && !thumbnails.includes(url)) thumbnails.push(url);
  }

  // OpenGraph fallback (works on Carsales, Marketplace, etc.)
  if (!thumbnails.length) {
    const ogMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    );
    const fallback = normaliseUrl(ogMatch?.[1]);
    if (fallback) thumbnails.push(fallback);
  }

  // Filter out tiny icons / sprites
  const filtered = thumbnails.filter(
    (u) =>
      !u.includes("icon") &&
      !u.includes("logo") &&
      !u.includes("placeholder") &&
      !u.endsWith(".svg")
  );

  return {
    hero: filtered[0],
    thumbnails: filtered.slice(0, 8),
  };
}

/**
 * Safe accessor for stored photo sets in SavedResult
 */
export function getPhotoSetFromResult(result: any): ListingPhotoSet {
  if (!result || !("photos" in result)) {
    return { hero: undefined, thumbnails: [] };
  }

  const hero = normaliseUrl(result.photos?.hero);
  const thumbs =
    (result.photos?.thumbnails || [])
      .map(normaliseUrl)
      .filter(Boolean) as string[];

  return {
    hero: hero || thumbs[0],
    thumbnails: thumbs,
  };
}
