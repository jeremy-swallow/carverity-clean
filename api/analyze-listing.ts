import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

/* ===============================
   Fetch listing HTML
================================ */
async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status})`);
  return await res.text();
}

/* ===============================
   Normalisers
================================ */
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

/* ===============================
   Extract structured info from HTML
================================ */
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);

  let year = "";
  const labelled = text.match(/(Build|Compliance|Year)[^0-9]{0,8}((19|20)\d{2})/i);
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
  for (const p of [
    /\b([\d,\.]+)\s*(km|kms|kilometres|kilometers)\b/i,
    /\bodometer[^0-9]{0,6}([\d,\.]+)\b/i,
    /\btravelled[^0-9]{0,6}([\d,\.]+)\b/i,
  ]) {
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

/* ===============================
   Fallback: derive make/model from AI summary
================================ */
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

/* ===============================
   Strict tone + structure prompt
================================ */
function buildPrompt(listingText: string): string {
  return `
You are CarVerity — an assisting tool for Australian used-car buyers.
Your role is to help the buyer feel informed and confident — not alarmed.

Use calm, warm, human-friendly language.
Do not speculate or diagnose. Do not imply risk unless the listing explicitly states it.
Use Australian wording (“kilometres”, not “mileage”).

SERVICE HISTORY — STRICT RULES
Treat stamped / logged entries as normal services, even if dates appear odd or future-dated.
Do not infer missing history, tampering, or risk unless the listing clearly says so.

CONFIDENCE MODEL — MUST MATCH LANGUAGE
LOW      = Feels comfortable so far — nothing concerning stands out
MODERATE = Mostly positive — a couple of details worth checking in person
HIGH     = Proceed carefully — important details should be confirmed before moving ahead

STRUCTURE — EXACT ORDER ONLY

CONFIDENCE ASSESSMENT
CONFIDENCE_CODE: LOW / MODERATE / HIGH
WHAT THIS MEANS FOR YOU
CARVERITY ANALYSIS — SUMMARY
KEY RISK SIGNALS
BUYER CONSIDERATIONS
NEGOTIATION INSIGHTS
GENERAL OWNERSHIP NOTES

LISTING TEXT
--------------------------------
${listingText}
--------------------------------
`;
}

/* ===============================
   Gemini API
================================ */
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

/* ===============================
   Validation & Tone-Safety Layer
================================ */
const bannedPhrases = [
  "red flag","serious risk","likely fault","dangerous",
  "mechanical failure","tampered","suspicious","unsafe"
];

function softenTone(text: string): string {
  let out = text;
  for (const p of bannedPhrases) {
    const r = new RegExp(p, "gi");
    out = out.replace(r, "worth checking in person");
  }
  return out;
}

function extractConfidenceCode(text: string): string | null {
  const m = text.match(/CONFIDENCE_CODE:\s*(LOW|MODERATE|HIGH)/i);
  return m ? m[1].toUpperCase() : null;
}

function ensureMinimumStructure(text: string): string {
  if (!text.includes("CONFIDENCE ASSESSMENT")) {
    return (
      "CONFIDENCE ASSESSMENT\nThis listing looks mostly positive so far, with a few details worth confirming in person.\n\n" +
      text
    );
  }
  return text;
}

function validateAndRepair(text: string) {
  let safe = softenTone(text);
  safe = ensureMinimumStructure(safe);

  const confidence = extractConfidenceCode(safe) ?? "MODERATE";
  return { safe, confidence };
}

/* ===============================
   API Handler
================================ */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const listingUrl = (req.body as any)?.listingUrl ?? (req.body as any)?.url;
    if (!listingUrl)
      return res.status(400).json({ ok: false, error: "Missing listing URL" });

    const html = await fetchListingHtml(listingUrl);
    let vehicle = extractBasicVehicleInfo(html);

    const prompt = buildPrompt(html);
    const raw = await callGemini(prompt);

    const { safe, confidence } = validateAndRepair(raw);

    // Fill missing make/model from AI report (only when empty)
    vehicle = applySummaryFallback(vehicle, safe);

    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle,
      summary: safe,
      confidenceCode: confidence,
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
