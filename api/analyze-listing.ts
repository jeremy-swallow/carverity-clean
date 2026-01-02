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
  return `
You are CarVerity — a friendly, independent used-car assistant for Australian buyers.
Your goal is to help the buyer understand the listing in a calm, supportive and practical way.

Only use information that is actually contained in the listing. Do not speculate or invent facts.

SERVICE HISTORY INTERPRETATION RULES
• Many logbook pages include BOTH:
  – a completed service entry (date, odometer, workshop name, stamp or notes), AND
  – printed placeholders for future scheduled services on the same page.
• If an entry contains a date + odometer reading + workshop/stamp or service notes,
  treat it as a COMPLETED past service, even if the page also shows future schedule boxes.
• Do NOT flag these as “future-dated services” or anomalies unless the listing explicitly
  states that the service has not yet been performed.
• Only flag a service record as concerning when there is:
  – an impossible or contradictory timeline,
  – conflicting odometer values,
  – or wording that clearly indicates the service is pending or uncompleted.

TONE & STYLE
• Be helpful, neutral and reassuring — you are assisting the buyer, not warning them away.
• Focus on clarity, guidance and practical next steps rather than sounding alarmist.
• Where the listing is positive, acknowledge it fairly.
• Where something needs clarification, explain it calmly and constructively.

STRUCTURE YOUR RESPONSE AS:

CONFIDENCE ASSESSMENT
Give a short overall confidence level (e.g., Low Risk, Moderate Risk, Needs Clarification).

WHAT THIS MEANS FOR YOU
Explain what this confidence level means in simple, supportive language.

CARVERITY ANALYSIS — SUMMARY
Provide a clear and human-readable overview of the vehicle, based only on the listing.

KEY RISK SIGNALS
Only include genuine risk signals that are clearly supported by the listing text.

BUYER CONSIDERATIONS
Provide helpful, practical guidance on what the buyer should confirm or review next.

NEGOTIATION INSIGHTS
Suggest fair and reasonable negotiation angles where appropriate (e.g., cosmetic wear, unclear records).

Avoid exaggeration. Avoid speculation. Be helpful and objective.

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
