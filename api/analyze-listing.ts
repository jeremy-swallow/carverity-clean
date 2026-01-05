import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

// ------------------------------
// Helper — fetch listing HTML
// ------------------------------
async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 CarVerityBot" },
  });

  if (!res.ok) {
    throw new Error(`fetch-failed:${res.status}`);
  }

  return await res.text();
}

// ------------------------------
// Normalize text before sending to AI
// ------------------------------
function cleanPastedText(text: string) {
  return text
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ------------------------------
// API Handler
// ------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body || {};

    const mode = body.mode ?? "auto";
    const listingUrl: string | null = body.listingUrl ?? null;

    let listingText: string | null = null;

    // ------------------------------------------
    // 1️⃣  ASSIST MODE — pasted text from UI
    // ------------------------------------------
    if (mode === "assist-manual" && body.pastedText) {
      listingText = cleanPastedText(body.pastedText);
    }

    // ------------------------------------------
    // 2️⃣  NORMAL MODE — fetch listing HTML
    // ------------------------------------------
    if (!listingText && listingUrl) {
      try {
        const html = await fetchListingHtml(listingUrl);
        listingText = html;
      } catch (err) {
        return res.status(200).json({
          ok: false,
          mode: "assist-required",
          reason: "fetch-failed",
          listingUrl,
        });
      }
    }

    // ------------------------------------------
    // 3️⃣  If still no text → fail gracefully
    // ------------------------------------------
    if (!listingText || !listingText.trim()) {
      return res.status(200).json({
        ok: false,
        mode: "assist-required",
        reason: "no-text",
        listingUrl,
      });
    }

    // ------------------------------------------
    // 4️⃣  Send to Gemini
    // ------------------------------------------
    const aiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are CarVerity. Analyse the following vehicle listing text.
Return structured JSON ONLY.

FIELDS:
vehicle { make, model, year, kilometres }
confidenceCode
previewSummary
fullSummary

TEXT:
${listingText}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!aiRes.ok) throw new Error("ai-failed");

    const aiJson = await aiRes.json();

    return res.status(200).json({
      ok: true,
      mode: "analysis-complete",
      source: "gemini-2.5-flash",
      ...aiJson,
    });
  } catch (err: any) {
    console.error("❌ analyze-listing error", err);

    return res.status(200).json({
      ok: false,
      mode: "assist-required",
      reason: err?.message ?? "unknown-error",
    });
  }
}
