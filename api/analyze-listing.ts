// api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

/* ===============================
   Fetch listing HTML (UPGRADED)
================================ */
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/121.0 Safari/537.36";

async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
    },
  });

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
   Extract structured info
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
   Fallback brand extraction
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

  return {
    ...vehicle,
    make: vehicle.make || match[3]?.trim() || "",
    model: vehicle.model || match[4]?.trim() || "",
  };
}

/* ===============================
   STRICT — tone & service rules
================================ */
function buildPrompt(listingText: string): string {
  return `
You are CarVerity — an assisting tool for Australian used-car buyers.

Use calm, neutral, human-friendly language.
Do NOT speculate, infer problems, or imply risk unless the listing explicitly states it.

SERVICE HISTORY — ZERO-SPECULATION RULES (CRITICAL)
• Future-dated service entries are treated as normal booking or admin entries.
• Do NOT call them anomalies, warnings, or risks.
• Do NOT infer missing history unless the listing clearly says it is missing.
• Do NOT imply odometer inconsistency unless the listing states a problem.
• If the listing presents service history as complete or transparent, accept it as valid.

CONFIDENCE MODEL
LOW = Comfortable so far — nothing concerning stands out
MODERATE = Mostly positive — a few details worth checking in person
HIGH = Proceed carefully — some details should be confirmed before moving ahead

STRUCTURE — EXACT ORDER

CONFIDENCE ASSESSMENT
CONFIDENCE_CODE: LOW / MODERATE / HIGH
WHAT THIS MEANS FOR YOU
CARVERITY ANALYSIS — SUMMARY
KEY RISK SIGNALS (ONLY IF THE LISTING ITSELF MENTIONS THEM)
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
        generationConfig: {
          temperature: 0.2,
          topP: 0.9
        }
      }),
    }
  );

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p: any) => p?.text || "").join("\n").trim();
}

/* ===============================
   Safety layer — extract confidence
================================ */
function extractConfidenceCode(text: string): string | null {
  const m = text.match(/CONFIDENCE_CODE:\s*(LOW|MODERATE|HIGH)/i);
  return m ? m[1].toUpperCase() : null;
}

/* ===============================
   Handler — confidence persists per scan
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

    const confidenceCode = extractConfidenceCode(raw) ?? "MODERATE";

    vehicle = applySummaryFallback(vehicle, raw);

    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle,
      summary: raw,
      confidenceCode,
      source: "gemini-2.5-flash",
      analysisVersion: "v1-persistent-confidence"
    });
  } catch (err: any) {
    console.error("❌ Analysis error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Analysis failed",
    });
  }
}
