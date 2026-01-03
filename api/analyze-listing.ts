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
  const kmPatterns: RegExp[] = [
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
// Gemini Prompt — service-safe + preview/full split
// ------------------------------
function buildPrompt(listingText: string): string {
  return `
You are CarVerity — an independent used-car assistant for Australian buyers.
Your purpose is to help the buyer feel informed, supported and confident — not alarmed.

Tone:
• Warm, calm, practical
• Everyday language, no legal or dramatic framing
• No speculation or guessing beyond the listing

SERVICE HISTORY — STRICT RULES (NO GUESSING)
• Treat logbook entries that show a workshop name, odometer reading, and notes as NORMAL completed services — even if the date formatting or page layout looks unusual.
• Future-dated logbook entries on the same page as past services are COMMON. They are scheduling placeholders and must NOT be treated as a risk or anomaly.
• Do NOT describe service history as an “anomaly”, “discrepancy”, “problem”, “unusual detail” or similar unless the LISTING TEXT explicitly says:
  - “no service history”
  - “books missing”
  - “service history unknown”
  - “incomplete history”
  - “requires service” or “overdue”
• If something in the service log looks different BUT the listing does not say there is a problem, stay neutral and DO NOT treat it as a risk or negotiation point.

CONFIDENCE MODEL (MUST MATCH YOUR TONE)
LOW       = Feels comfortable so far — nothing concerning stands out  
MODERATE  = Looks mostly fine — a couple of things are worth checking in person  
HIGH      = Proceed carefully — important details should be confirmed before moving ahead  

You MUST output in this exact template and order:

PREVIEW
(A short, friendly overview of the listing in **no more than 150 words**. Focus on the big picture, not all details.)

CONFIDENCE_CODE: LOW / MODERATE / HIGH

FULL ANALYSIS
CONFIDENCE ASSESSMENT
(1–3 sentences, plain English, matching the confidence code)

WHAT THIS MEANS FOR YOU
(2–4 supportive sentences helping the buyer interpret the listing)

CARVERITY ANALYSIS — SUMMARY
(A concise overview based ONLY on the listing — no speculation)

KEY RISK SIGNALS
- Only include genuine buyer risks that are clearly supported by the listing
- Do NOT invent mechanical faults or reinterpret normal formatting (like logbook layouts) as risk

BUYER CONSIDERATIONS
- Calm, practical next steps
- It is fine to recommend a CarVerity in-person scan to confirm real-world condition

NEGOTIATION INSIGHTS
- Polite, realistic talking points (e.g., cosmetic wear, age, kms, clearly disclosed issues)
- Do NOT use service history as a “problem” unless the listing explicitly says there is one

GENERAL OWNERSHIP NOTES
- 3–5 short bullet points of neutral, general guidance for similar vehicles (age/type)
- Phrase as “things some owners of similar vehicles pay attention to”
- Do NOT imply that these issues are present on THIS vehicle

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

  if (!res.ok) {
    throw new Error(await res.text());
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ------------------------------
// Extractors + robust fallbacks
// ------------------------------
function extractConfidenceCode(text: string): string | null {
  const m = text.match(/CONFIDENCE_CODE:\s*(LOW|MODERATE|HIGH)/i);
  return m ? m[1].toUpperCase() : null;
}

function extractPreview(text: string): string | null {
  // From PREVIEW down to just before CONFIDENCE_CODE
  const m =
    text.match(/PREVIEW([\s\S]*?)CONFIDENCE_CODE:/i) ||
    text.match(/PREVIEW([\s\S]*?)\nFULL ANALYSIS/i);
  return m ? m[1].trim() : null;
}

function extractFullAnalysis(text: string): string | null {
  const m = text.match(/FULL ANALYSIS([\s\S]*)$/i);
  return m ? m[1].trim() : null;
}

function makePreviewFromWhole(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  const maxWords = 150;
  return words.slice(0, maxWords).join(" ");
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

    console.log("🔎 Running AI scan for:", listingUrl);

    const html = await fetchListingHtml(listingUrl);
    const vehicle = extractBasicVehicleInfo(html);

    const prompt = buildPrompt(html);
    const output = await callGemini(prompt);

    const confidenceCode = extractConfidenceCode(output);
    let previewText = extractPreview(output);
    let fullAnalysis = extractFullAnalysis(output);

    // Fallbacks — never return an empty scan if we have any text
    if (!previewText && output) {
      previewText = makePreviewFromWhole(output);
    }
    if (!fullAnalysis && output) {
      fullAnalysis = output.trim();
    }

    // As a final safety net, if for some reason output is empty,
    // keep fields as empty strings so the frontend can show its default messages.
    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle,
      summary: output || "",
      confidenceCode,
      previewText: previewText || "",
      fullAnalysis: fullAnalysis || "",
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
