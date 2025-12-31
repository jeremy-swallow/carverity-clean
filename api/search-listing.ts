import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { query } = req.body || {};
    if (!query) {
      return res.status(400).json({ ok: false, error: "Missing query" });
    }

    const apiKey = process.env.GOOGLE_SEARCH_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
      console.error("❌ Missing Google API env vars");
      return res.status(500).json({ ok: false, error: "Server config error" });
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

    const r = await fetch(url);
    const text = await r.text();

    // 💡 Try to parse JSON safely
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("❌ Google returned NON-JSON:", text);
      return res.status(502).json({ ok: false, error: "Google search failed" });
    }

    if ((json as any)?.error) {
      console.error("❌ Google API error:", json.error);
      return res.status(502).json({ ok: false, error: json.error.message });
    }

    return res.json({
      ok: true,
      source: "google-search",
      results: json?.items ?? []
    });

  } catch (err: any) {
    console.error("🔥 search-listing fatal error:", err?.message || err);
    return res.status(500).json({ ok: false, error: "Search failed" });
  }
}
