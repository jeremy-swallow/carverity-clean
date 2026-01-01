// /api/analyze-listing.ts
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
// Extract lightweight vehicle info
// ------------------------------
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);
  const yearMatch = text.match(/(19|20)\d{2}/);

  return {
    make: makeMatch?.[1]?.trim() || "",
    model: modelMatch?.[1]?.trim() || "",
    year: yearMatch?.[0] || ""
  };
}

// ------------------------------
// Gemini Prompt (assistive + pricing-aware)
// ------------------------------
function buildPrompt(listingText: string) {
  const today = new Date().toISOString().split("T")[0]; // e.g. 2026-01-02

  return `
You are CarVerity — a friendly independent used-car assistant for Australian buyers.

Your goal is to help the buyer think clearly, reduce risk, and feel confident.
Use a supportive, practical tone. Avoid speculation or exaggeration.

Only use facts from the listing text.

CURRENT DATE: ${today}

DATE RULES
• Future dates for upcoming or scheduled services are normal — do NOT treat them as risks.
• Only treat a date as concerning if the listing explicitly says a service was already completed on a date AFTER ${today}.
• If a date is unclear, do not speculate — ignore it.

TONAL RULES
• Consumer-friendly, neutral, confidence-building
• Do not repeat large chunks of listing text
• Focus on useful insights, not noise
• Encourage continuing the process within CarVerity where relevant

STRUCTURE YOUR RESPONSE EXACTLY AS:

SUMMARY
A short, helpful overview of what matters most to the buyer.

KEY RISK SIGNALS
Only include genuine buyer-relevant risks clearly supported by the listing.

BUYER CONSIDERATIONS
Provide practical guidance to help the buyer make an informed next step.
Where appropriate, encourage continuing the journey using CarVerity’s
in-person scan to verify condition and key details — instead of suggesting
external inspections.

NEGOTIATION OPPORTUNITIES (optional, gentle and respectful)
Suggest reasonable discussion points the buyer may choose to raise.
Avoid confrontational language or guarantees.

Do NOT instruct the user to “research prices themselves”.
If pricing confidence is relevant, refer to CarVerity’s pricing and
comparison tools to help the buyer understand market value.

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

  if (!res.ok) throw new Error(`Gemini API error: ${await res.text()}`);

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ------------------------------
// API Handler
// ------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const listingUrl = req.body?.listingUrl ?? req.body?.url;
    if (!listingUrl)
      return res.status(400).json({ ok: false, error: "Missing listing URL" });

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
    return res.status(500).json({ ok: false, error: err?.message || "Analysis failed" });
  }
}
