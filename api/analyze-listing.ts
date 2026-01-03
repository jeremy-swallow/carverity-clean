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
  const labelled = text.match(
    /(Build|Compliance|Year)[^0-9]{0,8}((19|20)\d{2})/i
  );
  const beforeMake = text.match(
    /\b((19|20)\d{2})\b[^,\n]{0,30}(Hyundai|Toyota|Kia|Mazda|Ford|Nissan)/i
  );
  const afterMake = text.match(
    /(Hyundai|Toyota|Kia|Mazda|Ford|Nissan)[^0-9]{0,20}\b((19|20)\d{2})\b/i
  );

  if (labelled) year = labelled[2];
  else if (beforeMake) year = beforeMake[1];
  else if (afterMake) year = afterMake[2];

  year = normaliseYear(year);

  // Kilometres
  let kilometres = "";
  const kmPatterns = [
    /\b([\d,\.]+)\s*(km|kms|kilometres|kilometers)\b/i,
    /\bodometer[^0-9]{0,6}([\d,\.]+)\b/i,
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
// Gemini Prompt — paid + preview safe rules
// ------------------------------
function buildPrompt(listingText: string): string {
  return `
You are CarVerity — an independent used-car assistant for Australian buyers.

Tone:
• Warm, calm, reassuring, practical
• No speculation, no alarmist language, no legal tone
• Focus on clarity, confidence and helpful next steps

SERVICE HISTORY RULES (STRICT — NO GUESSING)
Treat entries with workshop name + odometer + status like “Done” or “Completed”
as NORMAL completed services, even if formatting looks unusual.

Do NOT infer missed services, overdue maintenance, gaps, risk or neglect
unless the listing explicitly states:
“no service history”, “books missing”, “incomplete history”,
“requires service”, or “overdue”.

If something appears unusual but no problem is stated,
remain neutral and do NOT treat it as a risk.

CONFIDENCE MODEL
LOW  = Feels comfortable so far — nothing concerning stands out
MODERATE = Looks mostly fine — a few things worth checking in person
HIGH = Proceed carefully — important details should be confirmed first

STRUCTURE (PAID FULL SCAN)

CONFIDENCE ASSESSMENT
(Short friendly explanation in plain English)

CONFIDENCE_CODE: LOW / MODERATE / HIGH

WHAT THIS MEANS FOR YOU
(2–4 supportive buyer-focused sentences)

CARVERITY ANALYSIS — SUMMARY
(Helpful overview based ONLY on the listing)

KEY RISK SIGNALS
(Only genuine, listing-supported risks — no speculation)

BUYER CONSIDERATIONS
(Calm, practical in-person checks + recommend CarVerity in-person scan)

NEGOTIATION INSIGHTS
(Polite, realistic talking points)

GENERAL OWNERSHIP NOTES
(3–5 neutral, general-knowledge tips — NOT implying faults)

———

FREE PREVIEW VERSION — IMPORTANT

When producing the PREVIEW summary, you MUST:
• Provide a light, high-level first impression ONLY
• Include 1–2 reassuring observations
• Clearly state that deeper insights require the full scan
• Do NOT reveal risk signals, concerns, or negotiation advice
• Do NOT mention service history interpretation
• Do NOT imply that the user already has enough information

Preview tone:
Supportive, encouraging, curiosity-building — NOT fear-based.

———

LISTING TEXT
--------------------------------
${listingText}
--------------------------------
`;
}

// ------------------------------
// Gemini API Call
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
// Extract confidence code
// ------------------------------
function extractConfidenceCode(text: string): string | null {
  const m = text.match(/CONFIDENCE_CODE:\s*(LOW|MODERATE|HIGH)/i);
  return m ? m[1].toUpperCase() : null;
}

// ------------------------------
// Create trimmed preview (teaser)
// ------------------------------
function buildPreviewFromFull(full: string): string {
  const firstPara = full.split("\n").find(l => l.trim()) ?? "";
  return `
${firstPara.trim()}

Unlock the full CarVerity scan to see detailed insights, risk signals, service-history context, and practical buyer guidance based on the fine details of this listing.
  `.trim();
}

// ------------------------------
// API Handler
// ------------------------------
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const listingUrl =
      (req.body as any)?.listingUrl ?? (req.body as any)?.url;

    if (!listingUrl) {
      return res.status(400).json({ ok: false, error: "Missing listing URL" });
    }

    const html = await fetchListingHtml(listingUrl);
    const vehicle = extractBasicVehicleInfo(html);

    const prompt = buildPrompt(html);
    const fullSummary = await callGemini(prompt);

    const confidenceCode = extractConfidenceCode(fullSummary);
    const preview = buildPreviewFromFull(fullSummary);

    return res.status(200).json({
      ok: true,
      vehicle,
      confidenceCode,
      previewSummary: preview,   // used in FREE mode
      fullSummary,               // shown ONLY after unlock
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
