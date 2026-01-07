// src/utils/listingPhotos.ts

export interface ListingPhotoSet {
  hero?: string;
  thumbnails: string[];
}

function normaliseUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let url = raw.trim();
  if (!url) return null;

  if (url.startsWith("data:image")) return null;
  if (url.startsWith("//")) url = "https:" + url;

  // take first srcset candidate if present
  if (url.includes(" ")) url = url.split(" ")[0];

  url = url.replace(/(\?|#).*$/, "");
  return url || null;
}

export function extractListingPhotosFromHtml(html: string): ListingPhotoSet {
  if (!html) return { hero: undefined, thumbnails: [] };

  const found: string[] = [];

  const add = (v?: string | null) => {
    const u = normaliseUrl(v);
    if (u && !found.includes(u)) found.push(u);
  };

  // <img> sources
  const imgRegex =
    /<img[^>]+?(srcset|data-src|data-original|src)\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(html))) add(m[2]);

  // <source srcset>
  const sourceRegex =
    /<source[^>]+srcset\s*=\s*["']([^"']+)["'][^>]*>/gi;
  while ((m = sourceRegex.exec(html))) add(m[1]);

  // OpenGraph fallback
  if (!found.length) {
    const og = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    );
    add(og?.[1]);
  }

  const filtered = found.filter(
    (u) =>
      !u.includes("icon") &&
      !u.includes("logo") &&
      !u.includes("placeholder") &&
      !u.endsWith(".svg")
  );

  const hero = filtered[0];
  const thumbs = filtered.slice(0, 12);

  return {
    hero,
    thumbnails: thumbs,
  };
}

/**
 * Safe accessor from stored scan data.
 * Ensures:
 *  - hero falls back to first thumbnail when missing/broken
 *  - duplicates are removed
 */
export function getPhotoSetFromResult(result: any): ListingPhotoSet {
  if (!result || !("photos" in result))
    return { hero: undefined, thumbnails: [] };

  const thumbs =
    (result.photos?.thumbnails || result.photos?.listing || [])
      .map(normaliseUrl)
      .filter(Boolean) as string[];

  const unique = Array.from(new Set(thumbs));
  const hero = normaliseUrl(result.photos?.hero) || unique[0];

  // remove hero if duplicated
  const finalThumbs = unique.filter((u) => u !== hero);

  return {
    hero,
    thumbnails: finalThumbs,
  };
}
