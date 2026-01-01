import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel environment variables.");
}

/* ----------------------------------------
   Fetch listing HTML
---------------------------------------- */
async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status})`);
  return await res.text();
}

/* ----------------------------------------
   Lightweight extractor (multi-pass)
---------------------------------------- */
function extractBasicVehicleInfo(text: string) {
  const clean = text.replace(/\s+/g, " ");

  // Try title-like patterns first: "2016 Mitsubishi Lancer ES"
  const titleMatch = clean.match(
    /(?:19|20)\d{2}\s+([A-Za-z]+)\s+([A-Za-z0-9\-]+)(?:\s+([A-Za-z0-9\-]+))?/i
  );

  // Generic Make / Model tags
  const makeMatch =
    clean.match(/Make:\s*([A-Za-z0-9\s]+)/i) ??
    clean.match(/Brand:\s*([A-Za-z0-9\s]+)/i);

  const modelMatch =
    clean.match(/Model:\s*([A-Za-z0-9\-\s]+)/i) ??
    clean.match(/Variant:\s*([A-Za-z0-9\-\s]+)/i);

  // Year — but only if realistic
  const yearMatch = clean.match(/(19|20)\d{2}/g);
  const validYears = (yearMatch || []).map(y => parseInt(y, 10))
    .filter(y => y >= 1980 && y <= new Date().getFullYear() + 1);

  const year = validYears[0]?.toString() || "";

  return {
    make:
      makeMatch?.[1]?.trim() ||
      titleMatch?.[1]?.trim() ||
      "",
    model:
      modelMatch?.[1]?.trim() ||
      titleMatch?.[2]?.trim() ||
      "",
    year
  };
}

/* ----------------------------------------
   Gemini — risk-analysis prompt
---------------------------------------- */
function buildSummaryPrompt(listingText: string) {
  return `
You are CarVerity — an independent used-car risk assessor for Australian buyers.

ONLY use information from the listing. If information is missing, treat it as risk.

Output format:

SUMMARY (2–4 short sentences)
KEY RISK SIGNALS (bullet list)
BUYER CONSIDERATIONS (bullet list)

LISTING TEXT:
--------------------------------
${listingText}
--------------------------------
`;
}

/* ----------------------------------------
   Gemini — structured vehicle extractor
   (Fallback if regex is weak)
---------------------------------------- */
function buildVehicleExtractPrompt(listingText: string) {
  return `
Extract vehicle details ONLY if clearly stated in the listing.

Return JSON:
{
 "make": string | "",
 "model": string | "",
 "year": string | ""
}

Do not guess or invent values.

LISTING:
${listingText}
`;
}

/* ----------------------------------------
   Gemini API call helper
---------------------------------------- */
async function callGemini(model: string, prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/* ----------------------------------------
   API Handler
---------------------------------------- */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: "Missing listing URL" });

    console.log("🔎 Running AI scan for:", url);

    const html = await fetchListingHtml(url);

    // Pass 1 — heuristic extraction
    let vehicle = extractBasicVehicleInfo(html);

    // Pass 2 — AI assist *only if fields missing*
    if (!vehicle.make || !vehicle.model || !vehicle.year) {
      const jsonText = await callGemini(
        "gemini-2.5-flash",
        buildVehicleExtractPrompt(html)
      );

      try {
        const aiParsed = JSON.parse(jsonText);
        vehicle = {
          make: aiParsed.make || vehicle.make,
          model: aiParsed.model || vehicle.model,
          year: aiParsed.year || vehicle.year
        };
      } catch {
        console.warn("⚠️ AI vehicle JSON not parseable — keeping regex values");
      }
    }

    // Final safety clamp on year
    if (vehicle.year && (parseInt(vehicle.year) < 1980 || parseInt(vehicle.year) > new Date().getFullYear() + 1)) {
      vehicle.year = "";
    }

    const summary = await callGemini(
      "gemini-2.5-flash",
      buildSummaryPrompt(html)
    );

    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle,
      summary,
      source: "gemini-2.5-flash"
    });

  } catch (err: any) {
    console.error("❌ Analysis error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Analysis failed" });
  }
}
