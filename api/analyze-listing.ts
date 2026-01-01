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
  const yearMatch = text.match(/(19|20)\d{2}/);

  return {
    make: makeMatch?.[1]?.trim() || "",
    model: modelMatch?.[1]?.trim() || "",
    year: yearMatch?.[0] || "",
  };
}

// ------------------------------
// Gemini Prompt
// ------------------------------
function buildPrompt(listingText: string) {
  const currentDate = new Date().toISOString().split("T")[0];

  return `
You are CarVerity — a friendly, supportive used-car buying assistant for Australian consumers.

Your role is to provide calm, practical, buyer-focused guidance based ONLY on the information
contained in the vehicle listing. Do not speculate or invent facts.

TODAY'S DATE: ${currentDate}

IMPORTANT DATE RULES
• A date is only a “future date” if it is later than today's date.
• Past dates should be treated as normal records unless the listing explicitly claims a task was completed in the future.
• If a date looks unusual but is not clearly unsafe, encourage the buyer to politely confirm the detail — do not dramatise it.

PRODUCT-ALIGNED GUIDANCE RULES
• Do NOT recommend booking an external mechanic or third-party inspection by default.
• When referring to further condition checking, prefer language such as:
  “Consider continuing the process using CarVerity’s in-person scan to validate real-world condition and important details.”
• Do NOT tell the buyer to manually research or compare pricing.
• Where relevant, say:
  “Use pricing context and comparable-vehicle insights available through CarVerity to help assess fairness and value.”

TONE REQUIREMENTS
• Supportive, reassuring, neutral, and non-alarmist
• Consumer-advice style — simple language, practical steps
• Focus on helping the buyer feel informed and confident

STRUCTURE YOUR RESPONSE EXACTLY AS:

SUMMARY
A short, friendly overview with key context for the buyer.

KEY RISK SIGNALS
Only include risks that are clearly visible in the listing and could matter to a cautious buyer.
If there are no major risks, say so in a balanced, reassuring way.

BUYER CONSIDERATIONS
Practical follow-up checks, questions to ask the seller, and guidance that helps the buyer move forward with confidence — while keeping the user within the CarVerity journey.

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
