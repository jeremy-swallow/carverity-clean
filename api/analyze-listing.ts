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
// Lightweight text extraction
// ------------------------------
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);
  const yearMatch = text.match(/(19|20)\d{2}/);

  const rawYear = yearMatch?.[0] ?? "";
  const yearNum = Number(rawYear);

  // 🛡️ Year sanity filter — avoid unrealistic values
  // Prefer honest uncertainty instead of incorrect confidence
  const currentYear = new Date().getFullYear();
  const safeYear =
    yearNum >= 1970 && yearNum <= currentYear + 1 ? rawYear : "";

  return {
    make: makeMatch?.[1]?.trim() || "",
    model: modelMatch?.[1]?.trim() || "",
    year: safeYear, // <-- may be "" if unclear
  };
}

// ------------------------------
// Professional advisory-style prompt
// ------------------------------
function buildPrompt(listingText: string) {
  return `
You are CarVerity — a professional, independent consumer-advice assistant
for Australian used-car buyers.

Your role is to provide calm, factual, buyer-focused guidance based ONLY on
what appears in the listing text. Do not speculate or invent details.

Tone & style:
• Professional, neutral, confidence-building
• Clear language, short paragraphs, practical advice
• Avoid exaggeration or alarmist statements

Very important — how to treat dates:
• Do NOT judge whether dates are “future” or “past” yourself
• Only describe dates factually if they are clearly stated in the listing
• If a date looks unusual or unclear, simply say the buyer may wish to
  confirm it with the seller — do not treat it as a risk by default

STRUCTURE YOUR RESPONSE EXACTLY AS:

SUMMARY
Provide a clear, high-level explanation of what the listing tells us about
the vehicle and its context, in a neutral and reassuring tone.

KEY POINTS FOR THE BUYER
List the most relevant details or gaps in information that a careful buyer
may want to confirm or understand better. Do not speculate.

BUYER CHECKLIST
Provide practical, supportive next-step suggestions the buyer can confirm
or review — phrased as guidance, not warnings.

Only use information from the listing text below.

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
