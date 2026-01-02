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
  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status})`);
  return await res.text();
}

// ------------------------------
// Normalisers
// ------------------------------
function normaliseYear(raw?: string | null) {
  if (!raw) return "";
  const n = parseInt(raw, 10);
  const now = new Date().getFullYear();
  if (!n || n < 1970 || n > now + 1) return "";
  return String(n);
}

function normaliseKilometres(raw?: string | null) {
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

  // YEAR — defensive & preference-based
  let year = "";
  const labelled = text.match(/(Build|Compliance|Year)[^0-9]{0,8}((19|20)\d{2})/i);
  const beforeMake = text.match(/\b((19|20)\d{2})\b[^,\n]{0,30}(Hyundai|Toyota|Kia|Mazda|Ford|Nissan)/i);
  const afterMake = text.match(/(Hyundai|Toyota|Kia|Mazda|Ford|Nissan)[^0-9]{0,20}\b((19|20)\d{2})\b/i);
  const myCode = text.match(/\bMY\s?(\d{2})\b/i);

  if (labelled) year = labelled[2];
  else if (beforeMake) year = beforeMake[1];
  else if (afterMake) year = afterMake[2];
  else if (myCode) year = `20${myCode[1]}`;

  year = normaliseYear(year);

  // KILOMETRES
  let kilometres = "";
  const kmPatterns = [
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
// Gemini Prompt — Assistive, Plain-English Confidence
// ------------------------------
function buildPrompt(listingText: string) {
  return `
You are CarVerity — an independent used-car assisting tool for Australian buyers.
Your goal is to SUPPORT the buyer with calm, confidence-building guidance — not to alarm, speculate, or over-interpret.

Tone:
• Supportive, reassuring, practical
• Buyer-centred and easy to understand
• No scare-language or dramatic conclusions
• Focus on clarity, confidence and next-step guidance

SERVICE HISTORY — CRITICAL RULES (NO SPECULATION)

1) Treat logbook-style entries with:
   • date
   • workshop / dealer
   • odometer
   • status such as “Done” or “Completed”
   as NORMAL completed services — even if the date format looks unusual.

2) You MUST NOT assume or infer:
   • missed services
   • overdue maintenance
   • long gaps between services
   • neglect or risk
   unless the LISTING TEXT explicitly states it.

3) Future / upcoming / scheduled services are NORMAL and must NOT be treated as risk.

4) Only mention service history concerns when the listing clearly states:
   • “no service history”
   • “books missing”
   • “service history unknown”
   • “incomplete history”
   • “requires service” or “overdue”

5) If something looks unusual BUT the listing does NOT say there is a problem,
   stay neutral and do NOT present it as risk.

PRICING & VALUE
• You may restate claims such as “below market price”.
• Do NOT tell the buyer to perform external research.
• Focus on reassurance and context, not instructions.

INSPECTION & NEXT STEPS
• Prefer recommending a CarVerity in-person scan to confirm real-world condition.
• A mechanic inspection may be mentioned only as an optional extra — not the default.

CONFIDENCE MODEL — IMPORTANT

First, express confidence in PLAIN-ENGLISH that is easy for everyday buyers to understand:

Examples of acceptable styles:
• “This listing feels generally comfortable so far, with no major concerns visible.”
• “This looks like a reasonable listing, but a few details are worth checking in person.”
• “You should proceed carefully here and make sure key details are confirmed first.”

Then output one of the following machine-readable codes:

CONFIDENCE_CODE: LOW
= “Looks comfortable so far”

CONFIDENCE_CODE: MODERATE
= “Likely fine, but some things should be checked”

CONFIDENCE_CODE: HIGH
= “Proceed carefully — confirm important details first”

YOU MUST RETURN YOUR OUTPUT IN THIS EXACT STRUCTURE:

CONFIDENCE ASSESSMENT
(A short, friendly, plain-English explanation)

CONFIDENCE_CODE: LOW / MODERATE / HIGH

WHAT THIS MEANS FOR YOU
(2–4 supportive sentences explaining how the buyer should think about the car)

CARVERITY ANALYSIS — SUMMARY
(A short helpful overview based ONLY on the listing — no speculation)

KEY RISK SIGNALS
- Only include genuine, listing-supported buyer risks
- Do NOT invent problems or reinterpret normal formatting as risk

BUYER CONSIDERATIONS
- Calm, practical next-step guidance
- Encourage using a CarVerity in-person scan to confirm condition

NEGOTIATION INSIGHTS
- Realistic, polite talking points (e.g., cosmetic wear, age, kms)

LISTING TEXT
--------------------------------
${listingText}
--------------------------------
`;
}

// ------------------------------
// Gemini API
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

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ------------------------------
// Extract confidence code
// ------------------------------
function extractConfidenceCode(text: string) {
  const m = text.match(/CONFIDENCE_CODE:\s*(LOW|MODERATE|HIGH)/i);
  return m ? m[1].toUpperCase() : null;
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
    console.error("❌ Analysis error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Analysis failed",
    });
  }
}
