/* =========================================================
   Listing Photo Normalisation & Extraction Helpers
   ---------------------------------------------------------
   Ensures all photo formats are converted into:

     {
       hero?: string;
       thumbnails: string[];
     }

   Supports:
   • photos.listing[]        ← current format
   • photos.hero + thumbnails[]
   • legacy flat arrays
   • gracefully ignores invalid URLs

========================================================= */

export interface ListingPhotoSet {
  hero?: string;
  thumbnails: string[];
}

function normaliseUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let url = raw.trim();
  if (!url) return null;

  // ignore inline blobs
  if (url.startsWith("data:image")) return null;

  // protocol-relative -> https
  if (url.startsWith("//")) url = "https:" + url;

  // srcset — take first candidate
  if (url.includes(" ")) url = url.split(" ")[0];

  // strip params / anchors
  url = url.replace(/(\?|#).*$/, "");

  return url || null;
}

/**
 * Normalises any stored photo structure into:
 *   { hero, thumbnails[] }
 *
 * Handles:
 *  - photos.listing[]        (preferred)
 *  - photos.hero + thumbnails[]
 *  - legacy: photos[] array
 */
export function getPhotoSetFromResult(result: any): ListingPhotoSet {
  if (!result || typeof result !== "object")
    return { hero: undefined, thumbnails: [] };

  const photos = result.photos ?? {};

  const listingArray: string[] = Array.isArray(photos.listing)
    ? photos.listing
    : [];

  const legacyThumbs: string[] = Array.isArray(photos.thumbnails)
    ? photos.thumbnails
    : [];

  const legacyHero = photos.hero ?? null;

  // fallback — scans that stored an array directly
  const rawArray: string[] = Array.isArray(photos)
    ? (photos as string[])
    : [];

  // merge → clean → dedupe
  const all = Array.from(
    new Set(
      [...listingArray, ...legacyThumbs, ...rawArray]
        .map(normaliseUrl)
        .filter(Boolean) as string[]
    )
  );

  return {
    hero: normaliseUrl(legacyHero) || all[0],
    thumbnails: all.slice(0, 12),
  };
}
