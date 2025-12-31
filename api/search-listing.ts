import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ ok: false, error: "Missing ?q param" });
    }

    const apiKey = process.env.GOOGLE_SEARCH_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
      return res.status(500).json({ ok: false, error: "Missing Google API env vars" });
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(
      q
    )}`;

    const r = await fetch(url);
    const json = await r.json();

    if (!json.items || !Array.isArray(json.items)) {
      return res.status(404).json({ ok: false, results: [] });
    }

    const results = json.items.map((i: any) => ({
      title: i.title,
      url: i.link,
      snippet: i.snippet,
    }));

    return res.json({ ok: true, results });
  } catch (err: any) {
    console.error("search-listing error", err);
    return res.status(500).json({ ok: false, error: err?.message || "Search failed" });
  }
}
