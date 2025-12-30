import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

function normalise(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

function parseFromUrl(url: string) {
  // carsales pattern:
  // https://www.carsales.com.au/cars/details/2021-mazda-cx-30-g20-touring-...
  const m = url
    .split("/cars/details/")[1]
    ?.split("/")[0]
    ?.replace(/-/g, " ")
    ?.toLowerCase();

  if (!m) return null;

  const parts = m.split(" ");

  const year = parts.find(p => /^\d{4}$/.test(p)) ?? "";
  const make = parts[parts.indexOf(year) + 1] ?? "";
  const model = parts.slice(parts.indexOf(year) + 2, parts.indexOf(year) + 4).join(" ");

  return { year, make, model, variant: m.replace(`${year} ${make} ${model}`, "").trim() };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.body?.url || req.query?.url;
  if (!url) return res.status(400).json({ ok: false, error: "Missing URL" });

  // ---------- Carsales shortcut extractor ----------
  if (url.includes("carsales.com.au")) {
    const parsed = parseFromUrl(String(url)) ?? {
      make: "",
      model: "",
      year: "",
      variant: "",
    };

    return res.json({
      ok: true,
      source: "carsales:url-parser",
      title: "",
      extracted: parsed,
    });
  }

  // ---------- Generic fallback ----------
  let html = "";
  try {
    const r = await fetch(String(url));
    html = await r.text();
  } catch {
    return res.status(500).json({ ok: false, error: "fetch failed" });
  }

  const $ = cheerio.load(html);
  let title =
    String($("h1").first().text() || "") ||
    String($("meta[property='og:title']").attr("content") || "");

  title = normalise(title);

  const parts = title.split(" ");
  const extracted = {
    make: parts[0] ?? "",
    model: parts[1] ?? "",
    year: parts.find(p => /^\d{4}$/.test(p)) ?? "",
    variant: "",
  };

  return res.json({ ok: true, source: "generic", title, extracted });
}
