// /api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;

if (!GEMINI_API_KEY) {
  throw new Error(
    "Missing GOOGLE_API_KEY — add it in Vercel environment variables."
  );
}

// ------------------------------
// Fetch listing HTML
// ------------------------------
async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

  if (!res.ok) {
    throw new Error(`Failed to fetch listing (${res.status})`);
  }

  return await res.text();
}

// ------------------------------
// Lightweight vehicle extraction
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
// Gemini Prompt — Assistive Tone
// ------------------------------
function buildPrompt(listingText: string) {
  return `
You are CarVerity — a friendly, independent used-car assistant for Australian buyers.

Your role is to help the buyer think clearly, reduce risk, and feel confident —
not to alarm them or speculate. Use a calm, supportive, consumer-advice tone.

ONLY use information from the listing text. Do not invent facts.

DATE RULES
• Future dates for *upcoming or scheduled services* are normal — do NOT treat them as risks.
• Only flag a date as concerning if the listing claims a service was ALREADY completed in the future.
• If a date is ambiguous, do not speculate — simply ignore it.

WRITING STYLE
• Plain English
• Helpful, neutral, and reassuring
• Avoid repeating large chunks of listing text
• Focus on insight, not noise

STRUCTURE YOUR RESPONSE EXACTLY AS:

SUMMARY (2–4 short sentences)
A helpful overview of what matters most to a cautious buyer.

KEY RISK SIGNALS (bullet points, only real buyer-relevant risks)
Keep this factual and grounded in listing evidence.

BUYER CONSIDERATIONS (bullet points)
Support decision-making, encourage sensible validation steps.
If appropriate, mention continuing the process with CarVerity’s in-person scan
to verify real-world condition and important details.

NEGOTIATION OPPORTUNITIES (optional — soft and respectful)
Suggest fair talking points a buyer MAY choose to discuss.
Do not frame negotiation as confrontational or guaranteed.

IMPORTANT TONE RULES
• No fear-based language
• No speculation
• Do not exaggerate
• Keep guidance practical and confidence-building

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
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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
