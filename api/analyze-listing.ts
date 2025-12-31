import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";
import { loadProgress, saveProgress } from "../src/utils/scanProgress";

/* =========================================================
   Types
========================================================= */

type BasicVehicle = {
  make: string;
  model: string;
  year: string;
  variant: string;
};

type AnalyzeResponse = {
  ok: boolean;
  source: string;
  title: string;
  extracted: BasicVehicle;
};

/* =========================================================
   Helpers
========================================================= */

function normalise(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

function titleCase(s: string) {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) =>
      w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)
    )
    .join(" ");
}

/**
 * Very small safety wrapper to ensure we always return a vehicle object
 */
function ensureVehicle(v: BasicVehicle | null): BasicVehicle {
  if (!v) {
    return { make: "", model: "", year: "", variant: "" };
  }
  return {
    make: v.make ?? "",
    model: v.model ?? "",
    year: v.year ?? "",
    variant: v.variant ?? "",
  };
}

/* =========================================================
   Parse Carsales-style listing HTML
========================================================= */

function parseFromHtml(html: string): {
  title: string;
  vehicle: BasicVehicle | null;
} {
  const $ = cheerio.load(html);

  // Try several title sources
  let title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text() ||
    $("h1").first().text() ||
    "";

  title = normalise(title);

  // Typical pattern:
  // "2021 Mazda CX-30 G20 Touring DM Series Auto"
  const m =
    title.match(
      /(?<year>20\d{2})\s+(?<make>[A-Za-z]+)\s+(?<model>[A-Za-z0-9\-]+)\s*(?<variant>.*)$/
    ) || undefined;

  if (!m || !m.groups) {
    // Fallback – no reliable parse, return just the title
    return { title, vehicle: null };
  }

  const year = m.groups.year || "";
  const make = titleCase(m.groups.make || "");
  const model = titleCase(m.groups.model || "");
  const variant = titleCase(normalise(m.groups.variant || ""));

  const vehicle: BasicVehicle = {
    year,
    make,
    model,
    variant,
  };

  return { title, vehicle };
}

/* =========================================================
   Main handler
========================================================= */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const { url } = (req.body || {}) as { url?: string };

    if (!url) {
      return res.status(400).json({ ok: false, error: "Missing URL" });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch listing (status ${response.status})`);
    }

    const html = await response.text();
    const { title, vehicle } = parseFromHtml(html);
    const extracted = ensureVehicle(vehicle);

    // ---------------- Save to scan progress ----------------
    const existing = (loadProgress() ?? {}) as any;

    saveProgress({
      ...existing,
      type: existing?.type ?? "online",
      step: "/online/vehicle-details",
      listingUrl: existing?.listingUrl ?? url,
      vehicle: {
        ...(existing?.vehicle ?? {}),
        make: extracted.make || existing?.vehicle?.make || "",
        model: extracted.model || existing?.vehicle?.model || "",
        year: extracted.year || existing?.vehicle?.year || "",
        variant: extracted.variant || existing?.vehicle?.variant || "",
        importStatus:
          existing?.vehicle?.importStatus ||
          "Sold new in Australia (default)",
      },
    });

    console.log("ANALYSIS RESULT >>>", {
      ok: true,
      source: "carsales-url-parser",
      title,
      extracted,
    });

    const payload: AnalyzeResponse = {
      ok: true,
      source: "carsales-url-parser",
      title,
      extracted,
    };

    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("❌ analyze-listing failed:", err?.message || err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unknown error",
    });
  }
}
