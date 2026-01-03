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
  if (!n || n < 10 || n > 1_000_000) return "";
  return String(n);
}

// ------------------------------
// Extract structured info from HTML (first-pass)
// ------------------------------
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);

  let year = "";
  const labelled = text.match(
    /(Build|Compliance|Year)[^0-9]{0,8}((19|20)\d{2})/i
  );
  const beforeMake = text.match(
    /\b((19|20)\d{2})\b[^,\n]{0,30}(Hyundai|Toyota|Kia|Mazda|Ford|Nissan|Mitsubishi|Subaru|Honda|Volkswagen)/i
  );
  const afterMake = text.match(
    /(Hyundai|Toyota|Kia|Mazda|Ford|Nissan|Mitsubishi|Subaru|Honda|Volkswagen)[^0-9]{0,20}\b((19|20)\d{2})\b/i
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
// FALLBACK — derive make/model from Gemini summary
// (fills missing values only — never overwrites good data)
// ------------------------------
const BRANDS = [
  "Toyota","Kia","Mazda","Ford","Hyundai","Nissan","Mitsubishi",
  "Subaru","Honda","Volkswagen","Audi","BMW","Mercedes","Holden",
  "Peugeot","Renault","Jeep","Volvo","Lexus"
];

function applySummaryFallback(vehicle: any, summary: string) {
  if (!summary) return vehicle;

  const firstLine = summary.split("\n")[0] ?? "";
  const brandRegex = new RegExp(
    `\\b((19|20)\\d{2})?\\s*(${BRANDS.join("|")})\\s+([A-Za-z0-9-]+)`,
    "i"
  );

  const match = firstLine.match(brandRegex);
  if (!match) return vehicle;

  const detectedMake = match[3]?.trim() || "";
  const detectedModel = match[4]?.trim() || "";

  return {
    ...vehicle,
    make: vehicle.make || detectedMake,
    model: vehicle.model || detectedModel,
  };
}

// ------------------------------
// STRICT CARVERITY PROMPT — restored guard-rails
// ------------------------------
function buildPrompt(listingText: string): string {
  return `
You are CarVerity — an assisting tool for Australian used-car buyers.
Your goal is to help the buyer feel informed, supported, and confident — not alarmed.

Write in calm, warm, everyday language.
Avoid analytical, legal, mechanical, or diagnostic tone.
Do NOT mention pricing, subscriptions, unlocking, or paywalls.
Use Australian wording (“kilometres”, not “mileage”).

SERVICE HISTORY — STRICT SAFETY RULES

If a service entry shows:
• a workshop or dealer name
• an odometer reading
• wording such as “Done / Completed / Service carried out / Performed”
→ Treat it as a NORMAL completed service, even if the date looks unusual or “future-dated”.

You must NOT infer:
• missed services
• overdue maintenance
• gaps between services
• odometer tampering
• neglect or mechanical risk

UNLESS the listing clearly and explicitly states this
(e.g. “no service history”, “books missing”, “overdue for service”, “odometer incorrect”).

If something looks unusual BUT the listing does not say there is a problem,
stay neutral — you may gently suggest confirming details in person,
but do NOT imply risk or doubt.

Future or scheduled services are NORMAL and must NOT be treated as a risk.

CONFIDENCE MODEL — HUMAN-MEANING ALIGNMENT

LOW      = Feels comfortable so far — nothing concerning stands out
MODERATE = Looks mostly positive — a couple of details are worth checking in person
HIGH     = Proceed carefully — important details should be confirmed before moving ahead

Your written explanation MUST match the confidence code you output.

STRUCTURE — USE THIS EXACT ORDER:

CONFIDENCE ASSESSMENT
(short, friendly explanation matching the code)

CONFIDENCE_CODE: LOW / MODERATE / HIGH

WHAT THIS MEANS FOR YOU
(2–4 calm sentences guiding what to focus on in person)

CARVERITY ANALYSIS — SUMMARY
(overview based ONLY on the listing — no speculation)

KEY RISK SIGNALS
(include only genuine, listing-supported items —
frame them as practical things to check in person)

BUYER CONSIDERATIONS
(practical, supportive inspection + test-drive guidance)

NEGOTIATION INSIGHTS
(polite, realistic talking points — no exaggeration)

GENERAL OWNERSHIP NOTES
(3–5 neutral bullet points framed as
“things some owners of similar vehicles watch for”)

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
// Confidence code extractor
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
    let vehicle = extractBasicVehicleInfo(html);

    const prompt = buildPrompt(html);
    const summary = await callGemini(prompt);
    const confidenceCode = extractConfidenceCode(summary);

    // ✨ Fill missing make/model from AI summary (safe fallback)
    vehicle = applySummaryFallback(vehicle, summary);

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
