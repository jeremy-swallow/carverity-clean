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
// Year Normaliser — safer & smarter
// ------------------------------
function normaliseYear(raw: string | null | undefined) {
  if (!raw) return "";

  const n = parseInt(raw, 10);
  const currentYear = new Date().getFullYear();

  const minYear = 1970;
  const maxYear = currentYear + 1; // allow near-future models

  if (!n || n < minYear || n > maxYear) return "";
  return String(n);
}

// ------------------------------
// Improved Vehicle Extractor
//  - prefers explicit year patterns
//  - avoids guessing when uncertain
// ------------------------------
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);

  let year = "";

  // Strong signals first
  const labelled = text.match(/(Build|Compliance|Year)[^0-9]{0,6}((19|20)\d{2})/i);
  const beforeMake = text.match(/\b((19|20)\d{2})\b[^,\n]{0,30}(Hyundai|Toyota|Kia|Mazda|Ford|Nissan)/i);
  const afterMake = text.match(/(Hyundai|Toyota|Kia|Mazda|Ford|Nissan)[^0-9]{0,20}\b((19|20)\d{2})\b/i);
  const myCode = text.match(/\bMY\s?(\d{2})\b/i);

  if (labelled) year = labelled[2];
  else if (beforeMake) year = beforeMake[1];
  else if (afterMake) year = afterMake[2];
  else if (myCode) year = `20${myCode[1]}`;

  year = normaliseYear(year);

  return {
    make: makeMatch?.[1]?.trim() || "",
    model: modelMatch?.[1]?.trim() || "",
    year,
  };
}

// ------------------------------
// Gemini Prompt
// ------------------------------
function buildPrompt(listingText: string) {
  return `
You are CarVerity — an independent used-car assisting tool for Australian buyers.
Your role is to HELP the buyer feel informed and supported, not alarmed.

Tone:
- Calm, clear, practical
- Supportive and confidence-building
- No scare language, no exaggeration
- Speak like a trusted assistant, not a salesperson

SERVICE HISTORY & DATES — VERY IMPORTANT RULES

1) Logbook-style entries (tables with:
   - date
   - workshop / dealer name
   - odometer reading
   - status such as "Done", "Completed"
   )
   must be treated as NORMAL completed services.

   Even if a date looks "in the future" compared to today's real-world date,
   DO NOT call it an anomaly, discrepancy, suspicious, or a risk by itself.
   Many systems format or print service schedules in ways that can look unusual.
   Your job is NOT to second-guess the logbook.

2) Future services, upcoming services, or next-service-due entries are NORMAL.
   Do NOT flag them as risk signals.

3) You may ONLY describe service history as a concern if the LISTING TEXT itself
   clearly says things like:
   - "no service history"
   - "service history unknown"
   - "books not available"
   - "incomplete history"
   - or if it explicitly admits missing / uncertain records.

4) If something about the dates is unclear or odd to YOU,
   but the listing does NOT say there is a problem,
   then you MUST stay neutral and NOT present it as a risk.
   You can simply say nothing about it.

PRICING & VALUE

- You may summarise what the listing claims, e.g. "listed as below market price"
  or reference valuation numbers the listing itself provides.

- Do NOT tell the buyer to "go and do independent research" or
  "compare prices on other platforms". That pushes work back onto them.

- Instead, give gentle guidance such as:
  - what the listing's claims suggest in plain language, and
  - that pricing should feel comfortable once condition and history are confirmed.

MECHANICAL CHECKS & NEXT STEPS

- If you talk about checking the car in person,
  PRIORITISE CarVerity’s in-person scan as the main pathway.
  Example: "This is a good candidate to follow up with a CarVerity in-person scan."

- You may mention that some buyers also choose a mechanic inspection,
  but do NOT present it as the main or only recommended path.

STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:

CONFIDENCE ASSESSMENT
(one line: High Risk / Moderate Risk / Low Risk — plus a short reason)

WHAT THIS MEANS FOR YOU
(2–4 sentences explaining how a cautious everyday buyer should interpret this)

CARVERITY ANALYSIS — SUMMARY
(Short, helpful overview of the vehicle and key context, based ONLY on the listing)

KEY RISK SIGNALS
- Bullet list of genuine buyer-relevant risks that are clearly supported by the listing.
- Do NOT repeat harmless specs or re-describe ordinary features.
- Do NOT invent problems or call normal logbook formatting a risk.

BUYER CONSIDERATIONS
- Practical, concrete steps the buyer can take next.
- Encourage using CarVerity’s in-person scan to confirm real-world condition.

NEGOTIATION INSIGHTS
- Fair, realistic points the buyer could politely use when discussing price
  (e.g. clearly listed imperfections, age, kms, or normal wear).

GENERAL RULES

- Use ONLY information from the listing text below.
- Do NOT hallucinate missing details.
- If something is not mentioned, you can say it's not stated in the listing.
- Avoid repeating long chunks of the ad; focus on interpretation and guidance.

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
