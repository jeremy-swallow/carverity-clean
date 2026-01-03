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

  // YEAR — defensive
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

  // KILOMETRES
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
// Gemini Prompt (unchanged — business logic lives here)
// ------------------------------
function buildPrompt(listingText: string): string {
  return `
You are CarVerity — an independent used-car assistant for Australian buyers.
Your purpose is to help the buyer feel informed, supported and confident.

Tone:
• Warm, calm, practical
• No speculation or alarmist language
• No technical jargon unless necessary

SERVICE HISTORY RULES (STRICT)
Treat entries that contain workshop name + odometer + status such as “Done” or “Completed”
as NORMAL completed services — even if formatting looks unusual.
Do NOT infer missed or overdue servicing unless the listing explicitly says so.

CONFIDENCE MODEL
LOW       = Feels comfortable so far — nothing concerning stands out  
MODERATE  = Looks mostly fine — a couple of things are worth checking in person  
HIGH      = Proceed carefully — important details should be confirmed first

STRUCTURE — YOU MUST FOLLOW THIS ORDER

PREVIEW SECTION
(Short, friendly explanation)

CONFIDENCE_CODE: LOW / MODERATE / HIGH

FULL ANALYSIS
(Expanded structured analysis)

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
// Robust extractors + fallbacks
// ------------------------------
function extractConfidence(text: string): string | null {
  const m = text.match(/CONFIDENCE_CODE:\s*(LOW|MODERATE|HIGH)/i);
  return m ? m[1].toUpperCase() : null;
}

function extractPreview(text: string): string | null {
  const m =
    text.match(/PREVIEW SECTION([\s\S]*?)CONFIDENCE_CODE/i) ||
    text.match(/PREVIEW([\s\S]*?)CONFIDENCE_CODE/i) ||
    text.match(/FREE PREVIEW([\s\S]*?)CONFIDENCE_CODE/i);

  return m ? m[1].trim() : null;
}

function extractFull(text: string): string | null {
  const m =
    text.match(/FULL ANALYSIS([\s\S]*)$/i) ||
    text.match(/FULL REPORT([\s\S]*)$/i) ||
    text.match(/DETAILED ANALYSIS([\s\S]*)$/i);

  return m ? m[1].trim() : null;
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
    const output = await callGemini(prompt);

    const confidenceCode = extractConfidence(output);
    let preview = extractPreview(output);
    let full = extractFull(output);

    // SAFETY FALLBACKS — never return empty output
    if (!preview && full) {
      preview =
        "A short preview is not available for this listing. Unlock the full scan to view the complete analysis.";
    }

    if (!full && preview) {
      full = output.trim();
    }

    return res.status(200).json({
      ok: true,
      vehicle,
      confidenceCode,
      preview,
      full,
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
