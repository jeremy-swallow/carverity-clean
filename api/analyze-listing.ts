// /api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel environment variables.");
}

// ------------------------------
// Helper: Fetch listing HTML
// ------------------------------
async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

  if (!res.ok) {
    throw new Error(`Failed to fetch listing (${res.status})`);
  }

  return await res.text();
}

// ------------------------------
// Helper: Extract simple vehicle fields
// ------------------------------
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);
  const yearMatch = text.match(/(19|20)\d{2}/); // only realistic years

  return {
    make: makeMatch?.[1]?.trim() || "",
    model: modelMatch?.[1]?.trim() || "",
    year: yearMatch?.[0] || "", // leave blank if uncertain — never guess
  };
}

// ------------------------------
// Gemini Prompt
// ------------------------------
function buildPrompt(listingText: string) {
  return `
You are CarVerity — a calm, helpful and independent used-car assistant for Australian buyers.

Your goal is to help the buyer make an informed and confident decision.
Write in a friendly, supportive, guidance-oriented tone — not salesy, not alarmist.

IMPORTANT RULES ABOUT FACTS & MISSING DATA
• Only use information that clearly appears in the listing text.
• If a detail is unclear, conflicting, or missing — do NOT guess or invent it.
• Instead, say that it is unclear and explain why it is worth confirming.

VEHICLE YEAR HANDLING
• If the year appears unrealistic or outside normal production ranges,
  do NOT assume a value and do NOT hallucinate a year.
• Instead, state that the year is uncertain and should be confirmed with
  registration records, VIN details, or the seller.

SERVICE HISTORY & DATES
• Future-dated “next service due” or warranty expiry dates are normal — do not treat them as risks.
• Only treat a date as suspicious if the listing explicitly claims a completed service in the future.
• If the meaning of a date is unclear, say so neutrally — do not speculate.

TONE & STYLE
• Focus on what details mean for the buyer — not just repeating the ad.
• Explain why a detail matters or how it may influence value, condition or decisions.
• Avoid exaggeration or absolute claims.
• Encourage sensible verification steps rather than fear-based warnings.

STRUCTURE YOUR RESPONSE EXACTLY AS:

CONFIDENCE ASSESSMENT
Brief statement: Low Risk / Moderate Risk / Needs Clarification — with one-line reasoning.

WHAT THIS MEANS FOR YOU
Explain the situation in practical, buyer-focused terms.

CARVERITY ANALYSIS — SUMMARY
Provide a clear, concise interpretation of the listing information, not a rewrite of it.

KEY RISK SIGNALS
List only genuine, evidence-based risks supported by the listing text.

BUYER CONSIDERATIONS
Supportive, practical guidance that helps the buyer confirm important details.

NEGOTIATION INSIGHTS (if appropriate)
Only include when relevant and reasonable — do not force it.

If a detail cannot be confirmed from the listing, say:
“This detail isn’t clearly stated in the listing and is worth confirming before moving ahead.”

LISTING TEXT
--------------------------------
${listingText}
--------------------------------
`;
}

// ------------------------------
// Gemini API Call
// ------------------------------
async function callGemini(prompt: string) {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" +
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
    const listingUrl = req.body?.listingUrl ?? req.body?.url;

    if (!listingUrl) {
      return res.status(400).json({ ok: false, error: "Missing listing URL" });
    }

    console.log("🔎 Running AI scan for:", listingUrl);

    const html = await fetchListingHtml(listingUrl);
    const vehicle = extractBasicVehicleInfo(html);

    const prompt = buildPrompt(html);
    const summary = await callGemini(prompt);

    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle,
      summary,
      source: "gemini-2.5-flash",
    });
  } catch (err: any) {
    console.error("❌ Analysis error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Analysis failed",
    });
  }
}
