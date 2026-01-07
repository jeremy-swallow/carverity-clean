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

export function extractListingPhotosFromHtml(html: string): ListingPhotoSet {
  if (!html) return { hero: undefined, thumbnails: [] };

  const found: string[] = [];

  // <img> + lazy attributes + srcset
  const imgRegex =
    /<img[^>]+?(srcset|data-src|data-original|src)\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html))) {
    const url = normaliseUrl(match[2]);
    if (url && !found.includes(url)) found.push(url);
  }

  // <source srcset> inside <picture>
  const sourceRegex =
    /<source[^>]+srcset\s*=\s*["']([^"']+)["'][^>]*>/gi;
  while ((match = sourceRegex.exec(html))) {
    const url = normaliseUrl(match[1]);
    if (url && !found.includes(url)) found.push(url);
  }

  // CSS background-image thumbnails
  extractFromCssBackground(html).forEach((u) => {
    if (!found.includes(u)) found.push(u);
  });

  // JSON gallery extraction (CARS24, Carsales, FB Marketplace)
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

  // Filter UI assets
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

export function getPhotoSetFromResult(result: any): ListingPhotoSet {
  if (!result || !("photos" in result))
    return { hero: undefined, thumbnails: [] };

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
