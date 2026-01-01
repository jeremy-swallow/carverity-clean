import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel environment variables.");
}

// ------------------------------
// Fetch listing HTML
// ------------------------------
async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status})`);
  return await res.text();
}

// ------------------------------
// Lightweight text parsing
// ------------------------------
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);
  const yearMatch = text.match(/(19|20)\d{2}/);

  return {
    make: makeMatch?.[1]?.trim() || "",
    model: modelMatch?.[1]?.trim() || "",
    year: yearMatch?.[0] || "",
  };
}

// ------------------------------
// Prompt generator
// ------------------------------
function buildPrompt(listingText: string) {
  return `
You are CarVerity — an independent used-car risk assessor for Australian buyers.

ONLY use information from the listing.
If details are missing or unclear, treat that as a potential risk.

STRUCTURE:
SUMMARY
KEY RISK SIGNALS
BUYER CONSIDERATIONS

RULES:
- Do not speculate or invent details.
- If nothing concerning appears, say:
  "No obvious red flags in the listing — but confirm key details before purchase."

LISTING TEXT
--------------------------------
${listingText}
--------------------------------`;
}

// ------------------------------
// Gemini API — UPDATED TO v1
// ------------------------------
async function callGemini(prompt: string) {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-001:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ------------------------------
// API Handler
// ------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: "Missing listing URL" });

    console.log("🔎 Running AI scan for:", url);

    const html = await fetchListingHtml(url);
    const vehicle = extractBasicVehicleInfo(html);

    const prompt = buildPrompt(html);
    const summary = await callGemini(prompt);

    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle,
      summary,
      source: "gemini",
    });
  } catch (err: any) {
    console.error("❌ Analysis error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Analysis failed" });
  }
}
