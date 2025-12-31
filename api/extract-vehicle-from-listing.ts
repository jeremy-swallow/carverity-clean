/**
 * Extracts vehicle details from a listing URL.
 * 
 * Strategy (progressively safe):
 * 1) Fetch page HTML
 * 2) Look for JSON-LD schema.org vehicle data
 * 3) Look for <title> / <meta> patterns (Carsales, Gumtree, FBMP, etc)
 * 4) Fall back to defaults if nothing is found
 */

export type ExtractedVehicle = {
  make: string;
  model: string;
  year: string;
  variant: string;
  importStatus: string;
};

const DEFAULT_IMPORT_STATUS = "Sold new in Australia (default)";

export async function extractVehicleFromListing(url: string): Promise<ExtractedVehicle> {
  try {
    const res = await fetch(url, { method: "GET" });

    if (!res.ok) {
      console.warn("⚠️ Listing fetch failed", res.status, url);
      return emptyVehicle();
    }

    const html = await res.text();

    // ========= 1) Try JSON-LD vehicle schema =========
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      const vehicle = tryParseJsonLd(jsonLdMatch[1]);
      if (vehicle) return normalize(vehicle);
    }

    // ========= 2) Try META title / og:title =========
    const titleFromMeta = getMetaTitle(html);
    if (titleFromMeta) {
      const parsed = parseTitle(titleFromMeta);
      if (parsed) return normalize(parsed);
    }

    // ========= 3) Try page <title> =========
    const pageTitle = getPageTitle(html);
    if (pageTitle) {
      const parsed = parseTitle(pageTitle);
      if (parsed) return normalize(parsed);
    }

    // ========= 4) Nothing found — fallback =========
    return emptyVehicle();

  } catch (err) {
    console.error("❌ Extractor failed", err);
    return emptyVehicle();
  }
}

/* ========================= Helpers ========================= */

function emptyVehicle(): ExtractedVehicle {
  return {
    make: "",
    model: "",
    year: "",
    variant: "",
    importStatus: DEFAULT_IMPORT_STATUS,
  };
}

function normalize(v: Partial<ExtractedVehicle>): ExtractedVehicle {
  return {
    make: v.make?.trim() ?? "",
    model: v.model?.trim() ?? "",
    year: v.year?.toString().trim() ?? "",
    variant: v.variant?.trim() ?? "",
    importStatus: v.importStatus?.trim() || DEFAULT_IMPORT_STATUS,
  };
}

function tryParseJsonLd(raw: string): Partial<ExtractedVehicle> | null {
  try {
    const data = JSON.parse(raw);

    // handle array or single object
    const node = Array.isArray(data) ? data[0] : data;

    if (!node) return null;

    return {
      make: node?.brand?.name ?? node?.brand ?? "",
      model: node?.model ?? "",
      year: node?.productionDate ?? node?.releaseDate ?? "",
      variant: node?.vehicleConfiguration ?? "",
      importStatus: DEFAULT_IMPORT_STATUS,
    };
  } catch {
    return null;
  }
}

function getMeta(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]*(property|name)=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
  const m = html.match(re);
  return m?.[2] ?? null;
}

function getMetaTitle(html: string): string | null {
  return (
    getMeta(html, "og:title") ||
    getMeta(html, "twitter:title") ||
    null
  );
}

function getPageTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1] ?? null;
}

/**
 * Tries to parse titles like:
 *  - "2018 Mazda 3 Neo Sport Hatch"
 *  - "Toyota Corolla 2015 SX Auto"
 *  - "2017 Hyundai i30 Active — Low kms"
 */
function parseTitle(title: string): Partial<ExtractedVehicle> | null {
  const clean = title.replace(/\s+-\s+.*/i, "").trim();

  const yearMatch = clean.match(/(19|20)\d{2}/);
  const year = yearMatch ? yearMatch[0] : "";

  const parts = clean
    .replace(year, "")
    .trim()
    .split(/\s+/);

  if (parts.length < 2) return null;

  const make = parts[0];
  const model = parts[1];
  const variant = parts.slice(2).join(" ");

  return {
    make,
    model,
    year,
    variant,
    importStatus: DEFAULT_IMPORT_STATUS,
  };
}

export default extractVehicleFromListing;
