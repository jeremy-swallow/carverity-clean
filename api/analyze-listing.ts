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

  // YEAR — defensive & preference-based
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

  // KILOMETRES
  let kilometres = "";
  const kmPatterns: RegExp[] = [
    /\b([\d,\.]+)\s*(km|kms|kilometres|kilometers)\b/i,
    /\bodometer[^0-9]{0,6}([\d,\.]+)\b/i,
    /\btravelled[^0-9]{0,6}([\d,\.]+)\b/i,
  ];

  for (const pattern of kmPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      kilometres = normaliseKilometres(match[1]);
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
// Gemini Prompt — Full CarVerity report
// ------------------------------
function buildPrompt(listingText: string): string {
  return `
You are CarVerity — a friendly assisting tool for Australian used-car buyers.
Your role is to act as a calm co-pilot: helping the buyer make sense of the listing,
feel informed about what to look for, and feel confident about their next steps.

You are NOT a mechanic, inspector, or authority figure.
Avoid sounding diagnostic, judgmental, technical, or alarmist.

Write in warm, everyday, human language.
Use Australian terminology (e.g. “kilometres”, not “mileage”).
Do NOT mention anything about “free”, “unlocking”, “subscriptions”, or “paid scans”.

VALUES & TONE
• Supportive, reassuring, and buyer-centred
• Observational rather than conclusive
• Encourage confirming, clarifying and noticing things in person
• No speculation, no assumptions, no fear-based language

SERVICE HISTORY — STRICT SAFETY RULES

Treat logbook / service entries that show:
• a workshop or dealer name
• an odometer value
• and language such as “Done”, “Completed”, or “Service carried out”
as NORMAL completed services — even if the date format looks unusual or appears “future dated”.

You MUST NOT infer:
• missed services
• overdue maintenance
• gaps between services
• odometer tampering
• neglect or mechanical risk

UNLESS the LISTING TEXT clearly and explicitly states this
(e.g. “no service history”, “books missing”, “overdue for service”, etc.).

If something looks unusual but the listing does not say there is a problem,
remain neutral and at most suggest politely clarifying it in person.

Future or scheduled services are normal and must NOT be treated as a risk.

CONFIDENCE MODEL — MUST MATCH HUMAN LANGUAGE

Explain confidence in plain English focused on buyer comfort:

LOW      = Feels comfortable so far — nothing concerning stands out
MODERATE = Looks mostly positive — a couple of small things are worth checking in person
HIGH     = Proceed carefully — there are important details to confirm in person before moving ahead

Your explanation MUST align with the confidence code you output.

Then output a separate line:

CONFIDENCE_CODE: LOW
or
CONFIDENCE_CODE: MODERATE
or
CONFIDENCE_CODE: HIGH

INSPECTION & NEXT STEPS
• Encourage seeing the vehicle in person and confirming details
• You may gently suggest a CarVerity in-person scan as a helpful next step
• A mechanic inspection may be mentioned only as an optional extra

GENERAL OWNERSHIP NOTES (SAFETY)
These should be neutral and general — framed as
“things some owners of similar vehicles like to keep an eye on”,
NOT suggestions that this vehicle has an issue.

YOU MUST USE THIS EXACT STRUCTURE AND ORDER:

CONFIDENCE ASSESSMENT
(A short, supportive explanation focused on buyer confidence and next-step awareness)

CONFIDENCE_CODE: LOW / MODERATE / HIGH

WHAT THIS MEANS FOR YOU
(2–4 calm sentences helping the buyer interpret the listing and what to focus on in person)

CARVERITY ANALYSIS — SUMMARY
(A simple overview based ONLY on the listing — no speculation or external assumptions)

KEY RISK SIGNALS
- Keep language calm and practical
- Treat these as “things to check or confirm in person”
- Only include genuine, listing-supported details

BUYER CONSIDERATIONS
- Gentle, practical suggestions for what to look for or ask about
- Encourage confirming real-world condition

NEGOTIATION INSIGHTS
- Possible talking points some buyers use
- Keep tone polite and non-aggressive

GENERAL OWNERSHIP NOTES
- 3–5 neutral general-knowledge tips for cars of similar age / type
- Clearly not diagnoses or statements about this specific car

LISTING TEXT
--------------------------------
${listingText}
--------------------------------
`;
}

// ------------------------------
// Gemini API — ROBUST PARSER
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

  const text = parts
    .map((p: any) => p?.text || "")
    .join("\n")
    .trim();

  console.log("📝 Gemini output length:", text.length);

  return text;
}

// ------------------------------
// Extract confidence code
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
      return res
        .status(400)
        .json({ ok: false, error: "Missing listing URL" });
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
