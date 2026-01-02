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
// Gemini Prompt — STRICT, ASSISTIVE, NON-SPECULATIVE
// ------------------------------
function buildPrompt(listingText: string) {
  return `
You are CarVerity — an independent used-car assisting tool for Australian buyers.
Your purpose is to SUPPORT the buyer with calm, practical guidance — not to alarm them or speculate.

Tone:
• Supportive, neutral, confidence-building
• Practical and helpful, not judgemental
• Avoid scare-language or dramatic claims
• Speak like a helpful assistant, not a salesperson

SERVICE HISTORY — CRITICAL RULES (NO SPECULATION)

1) Treat logbook-style entries with:
   • date
   • workshop/dealer
   • odometer
   • status such as “Done” or “Completed”
   as NORMAL completed services — EVEN if the date format looks unusual.

2) Never assume that a car has:
   • missed a service
   • an overdue service
   • a maintenance gap
   • neglect or poor servicing
   based on:
   • spacing between entries
   • odometer differences
   • dates that appear later than expected
   • future-looking table rows or placeholders

3) You MUST NOT calculate or infer:
   • “kms since last service”
   • “time gap between services”
   • “missed interval risk”
   unless the LISTING TEXT explicitly states it.

4) The ONLY time service history may be treated as a concern is when the listing clearly says:
   • “no service history”
   • “books missing”
   • “service history unknown”
   • “incomplete history”
   • “requires service” / “overdue service”

5) If something looks unusual BUT the listing does NOT state that there is a problem,
   stay neutral and DO NOT present it as a risk.
   It is acceptable to simply not comment on it.

PRICING & VALUE
• You may restate claims such as “below market price”.
• Do NOT instruct the buyer to perform external market research.
• Focus on supportive interpretation and buyer confidence.

NEXT-STEP GUIDANCE
• Prefer recommending a CarVerity in-person scan to confirm real-world condition.
• A mechanic inspection may be mentioned only as an optional extra — not the default.

YOU MUST RETURN OUTPUT IN THIS EXACT STRUCTURE:

CONFIDENCE ASSESSMENT
(A short, friendly explanation of how comfortable a cautious buyer should feel)

CONFIDENCE_CODE: LOW
OR
CONFIDENCE_CODE: MODERATE
OR
CONFIDENCE_CODE: HIGH

WHAT THIS MEANS FOR YOU
(2–4 sentences in simple, supportive language)

CARVERITY ANALYSIS — SUMMARY
(A short, helpful overview based ONLY on the listing — no speculation)

KEY RISK SIGNALS
- Only include genuine buyer-relevant risks that the listing clearly supports.
- Do NOT invent issues or treat normal formatting as risk.

BUYER CONSIDERATIONS
- Practical, calm next-step guidance.
- Encourage a CarVerity in-person scan to confirm real-world condition.

NEGOTIATION INSIGHTS
- Realistic, polite talking points such as cosmetic wear or age/kilometres.

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
