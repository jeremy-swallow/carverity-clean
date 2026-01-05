// api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

/* =========================================================
   USER-AGENT & FETCH (ANTI-BLOCKING + FALLBACK READY)
========================================================= */
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/123.0 Safari/537.36";

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
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status})`);
  return await res.text();
}

/* =========================================================
   BASIC FIELD NORMALISERS
========================================================= */
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

/* =========================================================
   LIGHT-TOUCH VEHICLE EXTRACTION
   (SAFE — NEVER GUESSES OR INFERENCES)
========================================================= */
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);

  let year = "";
  const labelled = text.match(/(Build|Compliance|Year)[^0-9]{0,8}((19|20)\d{2})/i);
  if (labelled) year = labelled[2];
  year = normaliseYear(year);

  let kilometres = "";
  for (const p of [
    /\b([\d,\.]+)\s*(km|kms|kilometres|kilometers)\b/i,
    /\bodometer[^0-9]{0,6}([\d,\.]+)\b/i,
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
    // 🔧 ALWAYS a string ("" when unknown) so TS is happy
    kilometres: kilometres || "",
  };
}

/* =========================================================
   STRICT — TRUST-FIRST, ZERO-SPECULATION PROMPT (PREMIUM)
========================================================= */
function buildPromptFromListing(listingText: string): string {
  return `
You are CarVerity — a calm, neutral guidance tool for Australian used-car buyers.

Tone requirements:
• Human-friendly, measured, factual.
• Do NOT speculate or infer problems.
• Do NOT exaggerate risk or imply hidden issues.
• Only discuss concerns if the listing explicitly states them.

SERVICE HISTORY — ZERO-SPECULATION RULES (CRITICAL)
• Future-dated or administrative entries are treated as normal bookings.
• Do NOT label them anomalies, warnings, or risks.
• Do NOT infer missing history unless the listing clearly states it.
• Do NOT imply odometer or ownership concerns unless stated.

CONFIDENCE MODEL
LOW = Comfortable so far — nothing concerning stands out
MODERATE = Mostly positive — a few details worth confirming in person
HIGH = Proceed carefully — the listing itself mentions details worth checking

OUTPUT FORMAT — EXACT ORDER

CONFIDENCE ASSESSMENT
CONFIDENCE_CODE: LOW / MODERATE / HIGH
WHAT THIS MEANS FOR YOU
CARVERITY ANALYSIS — SUMMARY
KEY RISK SIGNALS (ONLY IF THE LISTING ITSELF MENTIONS THEM)
BUYER CONSIDERATIONS
NEGOTIATION INSIGHTS
GENERAL OWNERSHIP NOTES

Now analyse ONLY the text below.

LISTING TEXT
--------------------------------
${listingText}
--------------------------------
`;
}

/* =========================================================
   GEMINI CALL
========================================================= */
async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, topP: 0.9 },
      }),
    }
  );

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p: any) => p?.text || "").join("\n").trim();
}

function extractConfidenceCode(text: string): string | null {
  const m = text.match(/CONFIDENCE_CODE:\s*(LOW|MODERATE|HIGH)/i);
  return m ? m[1].toUpperCase() : null;
}

/* =========================================================
   RAW-TEXT FALLBACK MODE
   (Used when scraping fails or page blocks bots)
========================================================= */
function extractReadableText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return stripped.slice(0, 20000); // safety limit
}

/* =========================================================
   HANDLER
========================================================= */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const body = req.body as any;
    const listingUrl = body?.listingUrl ?? body?.url;
    const rawTextInput = body?.rawText ?? null;

    if (!listingUrl && !rawTextInput) {
      return res.status(400).json({ ok: false, error: "Missing input" });
    }

    let listingText = "";
    let vehicle = { make: "", model: "", year: "", kilometres: "" };
    let mode: "html" | "raw-fallback" = "html";

    try {
      if (listingUrl) {
        const html = await fetchListingHtml(listingUrl);
        const readable = extractReadableText(html);

        // If page is heavily blocked / empty → trigger fallback
        if (readable.length < 400 && rawTextInput) {
          mode = "raw-fallback";
          listingText = rawTextInput;
        } else {
          listingText = readable;
          vehicle = extractBasicVehicleInfo(html);
        }
      } else {
        mode = "raw-fallback";
        listingText = String(rawTextInput || "");
      }
    } catch {
      // Network fail → fallback to raw input if provided
      if (rawTextInput) {
        mode = "raw-fallback";
        listingText = String(rawTextInput || "");
      } else {
        throw new Error("Listing could not be scraped and no fallback supplied");
      }
    }

    const prompt = buildPromptFromListing(listingText);
    const raw = await callGemini(prompt);
    const confidenceCode = extractConfidenceCode(raw) ?? "MODERATE";

    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle,
      summary: raw,
      confidenceCode,
      source: "gemini-2.5-flash",
      analysisVersion: "v2-raw-text-fallback",
      mode,
    });
  } catch (err: any) {
    console.error("❌ Analysis error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Analysis failed",
    });
  }
}
