import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

/* =========================================================
   Types
========================================================= */

type BasicVehicle = {
  year: string;
  make: string;
  model: string;
  variant: string;
};

type AnalyzeResponse = {
  ok: boolean;
  error?: string;
  source?: string;
  title?: string;
  extracted?: BasicVehicle;
};

/* =========================================================
   Helpers
========================================================= */

function normalise(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isYear(token: string): boolean {
  return /^\d{4}$/.test(token);
}

function titleCase(str: string): string {
  return str
    .split(" ")
    .filter(Boolean)
    .map(w => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

/* =========================================================
   Carsales URL parser
========================================================= */

function parseCarsalesFromUrl(url: string): BasicVehicle | null {
  try {
    const u = new URL(url);
    const slug = u.pathname.split("/").find(p => /^\d{4}-/.test(p)) ?? "";
    if (!slug) return null;

    const parts = slug.split("-").filter(Boolean);
    const year = parts[0];
    if (!isYear(year)) return null;

    const make = titleCase(parts[1]);
    const rest = parts.slice(2);

    const model = titleCase(rest.slice(0, 2).join(" "));
    const variant = titleCase(rest.slice(2).join(" "));

    return { year, make, model, variant };
  } catch {
    return null;
  }
}

/* =========================================================
   HTML fallback parser
========================================================= */

function parseFromHtml(html: string): { title: string; vehicle: BasicVehicle | null } {
  const $ = cheerio.load(html);

  const raw =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text() ||
    $("h1").first().text() ||
    "";

  const title = normalise(raw);
  const parts = title.split(" ");

  let vehicle: BasicVehicle | null = null;

  if (parts.length >= 3 && isYear(parts[0])) {
    vehicle = {
      year: parts[0],
      make: titleCase(parts[1]),
      model: titleCase(parts.slice(2).join(" ")),
      variant: "",
    };
  }

  return { title, vehicle };
}

/* =========================================================
   Main handler
========================================================= */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const { url } = (req.body || {}) as { url?: string };

    if (!url) {
      return res.status(400).json({ ok: false, error: "Missing URL" });
    }

    const response = await fetch(url);
    const html = await response.text();

    let extracted: BasicVehicle | null = null;
    let source = "fallback";

    if (url.includes("carsales.com.au")) {
      extracted = parseCarsalesFromUrl(url);
      if (extracted) source = "carsales-url-parser";
    }

    const { title, vehicle: htmlVehicle } = parseFromHtml(html);

    if (!extracted && htmlVehicle) {
      extracted = htmlVehicle;
      source = "html-title-parser";
    }

    const safeExtracted: BasicVehicle = extracted ?? {
      year: "",
      make: "",
      model: "",
      variant: "",
    };

    return res.status(200).json({
      ok: true,
      source,
      title,
      extracted: safeExtracted,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message || "Unexpected error" });
  }
}
