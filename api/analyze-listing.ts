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
// Vehicle field helpers
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
  const kmMatch = text.match(/\b([\d,\.]+)\s*(km|kms|kilometres|kilometers)\b/i);
  if (kmMatch?.[1]) {
    kilometres = normaliseKilometres(kmMatch[1]);
  }

  return {
    make: makeMatch?.[1]?.trim() || "",
    model: modelMatch?.[1]?.trim() || "",
    year,
    kilometres: kilometres || null,
  };
}

// ------------------------------
// Gemini call helper
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
// PREVIEW PROMPT — minimal + neutral
// ------------------------------
function buildPreviewPrompt(listingText: string): string {
  return `
You are CarVerity — an independent used-car assistant for Australian buyers.

Generate a SHORT PREVIEW SUMMARY that:
• is neutral, calm and supportive
• does NOT include risks, warnings, defects, or advice
• does NOT interpret service history or condition
• does NOT include negotiation or inspection guidance
• does NOT provide insights that would replace the full scan

The preview MUST ONLY:
• explain that this is an early high-level snapshot, and
• invite the user to unlock the full scan for detailed checks.

Length: 1–2 sentences only.

LISTING TEXT
--------------------------------
${listingText}
--------------------------------
`;
}

// ------------------------------
// FULL SCAN PROMPT — main paid report
// ------------------------------
function buildFullPrompt(listingText: string): string {
  return `
You are CarVerity — an independent used-car assistant for Australian buyers.
Write in warm, calm, practical language that supports the buyer.

SERVICE HISTORY — STRICT RULES
Treat logbook entries that include:
• a workshop or dealer name
• an odometer value
• a status such as “Done” or “Completed”
as NORMAL completed services — even if date formatting looks unusual.

Do NOT infer:
• missed or overdue services
• gaps in servicing
• neglect or risk

unless the LISTING TEXT explicitly states this.
Future or scheduled services are normal and must NOT be treated as a risk.
If something looks unusual BUT the listing does not say there is a problem,
you must remain neutral and not present it as a risk.

CONFIDENCE MODEL
LOW      = Feels comfortable so far — nothing concerning stands out.
MODERATE = Looks mostly fine — a couple of things may be worth checking in person.
HIGH     = Proceed carefully — important details should be confirmed before moving ahead.

OUTPUT USING THIS EXACT STRUCTURE:

CONFIDENCE ASSESSMENT
(A short, plain-English explanation)

CONFIDENCE_CODE: LOW / MODERATE / HIGH

WHAT THIS MEANS FOR YOU
(2–4 supportive sentences helping the buyer interpret the listing)

CARVERITY ANALYSIS — SUMMARY
(A helpful overview based ONLY on the listing — no speculation)

KEY RISK SIGNALS
- Only include genuine, listing-supported buyer risks.
- Do NOT invent problems or reinterpret normal formatting as risk.

BUYER CONSIDERATIONS
- Calm, practical next-step guidance.
- You may suggest a CarVerity in-person scan as a way to confirm real-world condition.

NEGOTIATION INSIGHTS
- Realistic, polite talking points (e.g., cosmetic wear, age, kms).

GENERAL OWNERSHIP NOTES
This section MUST:
• Provide neutral, general-knowledge guidance about similar vehicles/age.
• NOT imply these points definitely apply to THIS specific car.
• Be phrased as “things some owners of similar vehicles watch for”.
Keep this section short (3–5 bullet points).

LISTING TEXT
--------------------------------
${listingText}
--------------------------------
`;
}

// ------------------------------
// Extract confidence code
// ------------------------------
function extractConfidence(text: string): string | null {
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
    const listingUrl =
      (req.body as any)?.listingUrl ?? (req.body as any)?.url;
    if (!listingUrl) {
      return res.status(400).json({ ok: false, error: "Missing listing URL" });
    }

    console.log("🔎 Running AI scan for:", listingUrl);

    const html = await fetchListingHtml(listingUrl);
    const vehicle = extractBasicVehicleInfo(html);

    // 1) Minimal preview
    const previewPrompt = buildPreviewPrompt(html);
    const preview = await callGemini(previewPrompt);

    // 2) Full paid scan
    const fullPrompt = buildFullPrompt(html);
    const fullReport = await callGemini(fullPrompt);
    const confidenceCode = extractConfidence(fullReport);

    // IMPORTANT: return BOTH new + legacy fields so the current UI keeps working.
    return res.status(200).json({
      ok: true,
      vehicle,
      // New fields
      preview,
      fullReport,
      // Legacy-style fields used elsewhere in the app
      summary: preview,         // used by the preview card fallback
      fullAnalysis: fullReport, // used by the full scan card
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
