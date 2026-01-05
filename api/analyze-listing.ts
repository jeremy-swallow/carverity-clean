// api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

/* =========================================================
   Helpers
========================================================= */

function stripCodeFence(text: string): string {
  if (!text) return "";
  return text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

function safeJsonParse<T = any>(text: string): T | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/* =========================================================
   Fetch Listing HTML
========================================================= */

async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/123.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status})`);
  return await res.text();
}

function extractReadableText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20000);
}

/* =========================================================
   Gemini Call — now returns JSON in code fence
========================================================= */

async function callGemini(prompt: string) {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();

  const rawText =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

  const stripped = stripCodeFence(rawText);
  const parsed = safeJsonParse<any>(stripped);

  if (!parsed) throw new Error("Model returned invalid JSON format");

  return parsed;
}

/* =========================================================
   Handler
========================================================= */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { listingUrl, rawText } = req.body ?? {};

    if (!listingUrl && !rawText) {
      return res.status(400).json({ ok: false, error: "Missing input" });
    }

    let listingText = "";

    if (listingUrl) {
      try {
        const html = await fetchListingHtml(listingUrl);
        listingText = extractReadableText(html);

        if (listingText.length < 300) {
          return res.status(200).json({
            ok: false,
            mode: "assist-required",
            reason: "scrape-blocked",
            listingUrl,
          });
        }
      } catch {
        return res.status(200).json({
          ok: false,
          mode: "assist-required",
          reason: "fetch-failed",
          listingUrl,
        });
      }
    } else {
      listingText = String(rawText || "");
    }

    const model = await callGemini(listingText);

    return res.status(200).json({
      ok: true,
      mode: "analysis-complete",
      source: "gemini-2.5-flash",
      vehicle: model.vehicle ?? {},
      confidenceCode: model.confidenceCode ?? null,
      previewSummary: model.previewSummary ?? null,
      fullSummary: model.fullSummary ?? null,
      summary: model.fullSummary ?? model.previewSummary ?? null,
      sections: model.sections ?? [],
    });
  } catch (err: any) {
    console.error("❌ Analysis error", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Analysis failed",
    });
  }
}
