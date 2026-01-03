// /api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

// ------------------------------
// Fetch HTML
// ------------------------------
async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) {
    throw new Error(`Failed to fetch listing (${res.status})`);
  }
  return await res.text();
}

// ------------------------------
// Normalisers
// ------------------------------
function normaliseYear(raw?: string | null): string {
  if (!raw) return "";
  const n = parseInt(raw, 10);
  const now = new Date().getFullYear();
  if (!n || n < 1970 || n > now + 1) return "";
  return String(n);
}

function normaliseKilometres(raw?: string | null): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[,\.]/g, "").trim();
  const n = parseInt(cleaned, 10);
  if (!n || n < 10 || n > 1_000_000) return "";
  return String(n);
}

// ------------------------------
// Extract structured vehicle info
// ------------------------------
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);

  let year = "";
  const labelled = text.match(
    /(Build|Compliance|Year)[^0-9]{0,8}((19|20)\d{2})/i
  );
  const beforeMake = text.match(
    /\b((19|20)\d{2})\b[^,\n]{0,30}(Hyundai|Toyota|Kia|Mazda|Ford|Nissan)/i
  );
  const afterMake = text.match(
    /(Hyundai|Toyota|Kia|Mazda|Ford|Nissan)[^0-9]{0,20}\b((19|20)\d{2})\b/i
  );
  const myCode = text.match(/\bMY\s?(\d{2})\b/i);

  if (labelled) year = labelled[2];
  else if (beforeMake) year = beforeMake[1];
  else if (afterMake) year = afterMake[2];
  else if (myCode) year = `20${myCode[1]}`;

  year = normaliseYear(year);

  let kilometres = "";
  const kmPatterns: RegExp[] = [
    /\b([\d,\.]+)\s*(km|kms|kilometres|kilometers)\b/i,
    /\bodometer[^0-9]{0,6}([\d,\.]+)\b/i,
    /\btravelled[^0-9]{0,6}([\d,\.]+)\b/i,
  ];

  for (const p of kmPatterns) {
    const m = text.match(p);
    if (m?.[1]) {
      kilometres = normaliseKilometres(m[1]);
      if (kilometres) break;
    }
  }

  return {
    make: makeMatch?.[1]?.trim() || "",
    model: modelMatch?.[1]?.trim() || "",
    year,
    kilometres: kilometres || null,
  };
}

// ------------------------------
// Gemini Prompt — CarVerity tone
// ------------------------------
function buildPrompt(listingText: string): string {
  return `
You are CarVerity — a calm assisting tool for Australian used-car buyers.
Your role is to help the buyer feel informed and confident about what to look for.
You are NOT a mechanic, inspector, or authority. Avoid diagnostic or alarmist wording.

Use warm, everyday Australian language (“kilometres”, not “mileage”).
Do NOT mention pricing, subscriptions, unlocking, or paywalls.

SERVICE HISTORY — STRICT INTERPRETATION RULES

If a service entry includes:
• a workshop or dealer name, and
• an odometer reading, and
• a stamp, signature, or wording such as “Service completed / carried out / done”

→ Treat it as a NORMAL completed service entry.

Even if the date appears unusual or future-dated, you must still treat it as normal.
You must NOT imply uncertainty, risk, missing history, or ask the buyer to “clarify”
UNLESS the listing text explicitly states that something is missing or incorrect.

Future bookings, forward-dated stamps, or unusual formatting are NOT risks on their own.

You must never infer:
• overdue servicing
• gaps or neglect
• odometer concern
• mechanical risk
unless the listing clearly says so.

ASSISTING-TOOL PHILOSOPHY

Write as a supportive co-pilot.
Encourage seeing the car in person, confirming details, and noticing things calmly.
Use phrasing such as “worth checking in person” instead of “risk” language.

CONFIDENCE MODEL — MUST MATCH YOUR EXPLANATION

LOW      = Feels comfortable so far — nothing concerning stands out
MODERATE = Looks mostly positive — a couple of details are worth checking in person
HIGH     = Proceed carefully — important details should be confirmed before moving ahead

Then output:
CONFIDENCE_CODE: LOW / MODERATE / HIGH

STRUCTURE (USE EXACT ORDER)

CONFIDENCE ASSESSMENT
(Short, friendly explanation matching the code)

CONFIDENCE_CODE: LOW / MODERATE / HIGH

WHAT THIS MEANS FOR YOU
(2–4 calm sentences about what to focus on in person)

CARVERITY ANALYSIS — SUMMARY
(Overview based ONLY on the listing)

KEY RISK SIGNALS
(Treat these as things to check in person — practical, non-alarmist)

BUYER CONSIDERATIONS
(Gentle suggestions for inspection, test drive, clarifying details if relevant)

NEGOTIATION INSIGHTS
(Polite talking points some buyers use — realistic and fair)

GENERAL OWNERSHIP NOTES
(3–5 neutral tips phrased as “things some owners of similar vehicles watch for”)

LISTING TEXT
--------------------------------
${listingText}
--------------------------------
`;
}

// ------------------------------
// Gemini API
// ------------------------------
async function callGemini(prompt: string): Promise<string> {
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

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p: any) => p?.text || "").join("\n").trim();
}

// ------------------------------
function extractConfidenceCode(text: string): string | null {
  const m = text.match(/CONFIDENCE_CODE:\s*(LOW|MODERATE|HIGH)/i);
  return m ? m[1].toUpperCase() : null;
}

// ------------------------------
// API Handler
// ------------------------------
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const listingUrl = (req.body as any)?.listingUrl ?? (req.body as any)?.url;
    if (!listingUrl) {
      return res.status(400).json({ ok: false, error: "Missing listing URL" });
    }

    const html = await fetchListingHtml(listingUrl);
    const vehicle = extractBasicVehicleInfo(html);

    const prompt = buildPrompt(html);
    const summary = await callGemini(prompt);
    const confidenceCode = extractConfidenceCode(summary);

    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle,
      summary,
      confidenceCode,
      source: "gemini-2.5-flash",
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Analysis failed",
    });
  }
}
