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
You are CarVerity — an independent used-car assistant for Australian buyers.
Your job is to analyse the listing and provide calm, practical buyer guidance.

Tone:
• Supportive, helpful, confidence-building
• Not alarmist, not speculative
• Speak like an assisting tool, not a salesperson

Very important service-history rules:

• If a service entry includes a workshop name, stamp, odometer reading,
  or logbook formatting — treat it as a NORMAL completed service record.
  Do NOT describe it as unusual, suspicious, inconsistent, or requiring clarification.

• Future or upcoming services shown in logbooks are normal. Do NOT flag them as risks.

• Only flag a date as concerning if the listing explicitly claims
  that a service was ALREADY completed in the future OR the entry clearly contradicts itself.

• When something is ambiguous, do NOT speculate — simply do not comment on it.

Your response MUST include these sections:

CONFIDENCE ASSESSMENT
• High Risk / Moderate Risk / Low Risk
• One-sentence explanation that helps the buyer understand why

WHAT THIS MEANS FOR YOU
• Explain how a cautious buyer should interpret the situation
• Support decision-making, not fear

CARVERITY ANALYSIS — SUMMARY
• Short, helpful overview of the vehicle based ONLY on the listing

KEY RISK SIGNALS
• Only include clear buyer-relevant risks supported by the listing
• Do NOT repeat harmless details or restate specs

BUYER CONSIDERATIONS
• Practical next-step guidance the buyer can act on
• Encourage continuing the process using CarVerity where appropriate

NEGOTIATION INSIGHTS
• Only include fair, realistic points a buyer could politely use in price discussion

Do NOT invent information. Do NOT hallucinate missing details.

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
