import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

function normalise(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.body?.url || req.query?.url;

  if (!url) {
    return res.status(400).json({ ok: false, error: "Missing URL" });
  }

  let html: string;

  try {
    const response = await fetch(url);
    html = await response.text();
  } catch {
    return res.status(500).json({ ok: false, error: "fetch failed" });
  }

  const $ = cheerio.load(html);

  // ---------------- Multi-source title extraction ----------------
  let title: string =
    String($("h1").first().text() || "") ||
    String($("meta[property='og:title']").attr("content") || "") ||
    "";

  // ---------------- JSON-LD listing schema fallback ----------------
  if (!title) {
    const jsonCandidate = $("script[type='application/ld+json']")
      .map((_, el) => String($(el).text() || ""))
      .toArray()
      .filter(Boolean)
      .find(s => {
        const str = String(s);
        return str.includes("vehicle") || str.includes("car");
      });

    if (jsonCandidate) {
      try {
        const obj = JSON.parse(String(jsonCandidate)); // <-- force to string
        title = obj?.name || obj?.headline || title;
      } catch {
        // ignore malformed JSON
      }
    }
  }

  title = normalise(String(title));

  // ---------------- Simple parse fallback ----------------
  function parseTitle(t: string) {
    const parts = t.split(" ");
    return {
      make: parts[0] || "",
      model: parts[1] || "",
      year: parts.find(p => /^\d{4}$/.test(p)) || "",
      variant: "",
    };
  }

  const extracted = parseTitle(title);

  return res.json({
    ok: true,
    source: title ? "parsed" : "fallback",
    title,
    extracted,
  });
}
