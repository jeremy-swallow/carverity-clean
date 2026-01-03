// /api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;
if (!GEMINI_API_KEY) throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");

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
  if (!n || n < 10 || n > 1000000) return "";
  return String(n);
}

// ------------------------------
// Extract structured vehicle info
// ------------------------------
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);

  let year = "";
  const labelled = text.match(/(Build|Compliance|Year)[^0-9]{0,8}((19|20)\d{2})/i);
  if (labelled) year = labelled[2];
  year = normaliseYear(year);

  let kilometres = "";
  const kmMatch = text.match(/\b([\d,\.]+)\s*(km|kms|kilometres|kilometers)\b/i);
  if (kmMatch?.[1]) kilometres = normaliseKilometres(kmMatch[1]);

  return {
    make: makeMatch?.[1]?.trim() || "",
    model: modelMatch?.[1]?.trim() || "",
    year,
    kilometres: kilometres || null,
  };
}

// ------------------------------
// Prompt — stronger service rules + preview/full split
// ------------------------------
function buildPrompt(listingText: string): string {
  return `
You are CarVerity — an independent used-car assistant for Australian buyers.

Write in warm, calm, supportive language. Avoid speculation, alarmist framing, or technical/legal tone.

SERVICE HISTORY — STRICT SAFETY RULES

Treat logbook entries that include:
• a workshop or dealer name
• an odometer value
• a stamp, tick, or handwritten completion note

as NORMAL completed services — even if:
• formatting looks unusual
• the service page also includes future-scheduled boxes
• the odometer differs slightly from the current value

You MUST NOT label these as:
“anomalies”, “mismatches”, “risks”, “concerns”, or “issues”
unless the LISTING explicitly states there is a problem.

If a service entry appears on a logbook page that also contains future-scheduled service placeholders,
assume it is standard logbook formatting and DO NOT treat it as a concern.

Only mention service-history concerns when the listing clearly says:
• “no service history”
• “books missing”
• “incomplete history”
• “requires service” or “overdue”

Otherwise, remain neutral.

CONFIDENCE MODEL (must match tone)
LOW = Feels comfortable so far — nothing concerning stands out
MODERATE = Looks mostly fine — a couple of things are worth checking in person
HIGH = Proceed carefully — important details should be confirmed before moving ahead

OUTPUT FORMAT (MANDATORY)

PREVIEW SECTION
(This is the FREE preview. KEEP IT SHORT.)
• 3–5 friendly sentences only
• No bullet points
• No risk signals
• No negotiation insights
• No detailed checklist guidance

CONFIDENCE_CODE: LOW / MODERATE / HIGH

FULL ANALYSIS (LOCKED CONTENT)
(This section is ONLY for paid users.)
Include:
• WHAT THIS MEANS FOR YOU
• CARVERITY ANALYSIS — SUMMARY
• KEY RISK SIGNALS (listing-supported only)
• BUYER CONSIDERATIONS
• NEGOTIATION INSIGHTS
• GENERAL OWNERSHIP NOTES

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
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ------------------------------
// Extract confidence + split sections
// ------------------------------
function extractConfidence(text: string): string | null {
  const m = text.match(/CONFIDENCE_CODE:\s*(LOW|MODERATE|HIGH)/i);
  return m ? m[1].toUpperCase() : null;
}

function extractPreview(text: string): string | null {
  const m = text.match(/PREVIEW SECTION([\s\S]*?)CONFIDENCE_CODE/i);
  return m ? m[1].trim() : null;
}

function extractFull(text: string): string | null {
  const m = text.match(/FULL ANALYSIS([\s\S]*)$/i);
  return m ? m[1].trim() : null;
}

// ------------------------------
// API Handler
// ------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const listingUrl = (req.body as any)?.listingUrl ?? (req.body as any)?.url;
    if (!listingUrl)
      return res.status(400).json({ ok: false, error: "Missing listing URL" });

    const html = await fetchListingHtml(listingUrl);
    const vehicle = extractBasicVehicleInfo(html);

    const prompt = buildPrompt(html);
    const output = await callGemini(prompt);

    const confidenceCode = extractConfidence(output);
    const preview = extractPreview(output);
    const full = extractFull(output);

    return res.status(200).json({
      ok: true,
      vehicle,
      preview,
      full,
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
