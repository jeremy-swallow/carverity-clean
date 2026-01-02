// /api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

// ------------------------------
// Fetch listing HTML
// ------------------------------
async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status})`);
  return await res.text();
}

// ------------------------------
// Normalisers
// ------------------------------
function normaliseYear(raw?: string | null) {
  if (!raw) return "";
  const n = parseInt(raw, 10);
  const y = new Date().getFullYear();
  if (!n || n < 1970 || n > y + 1) return "";
  return String(n);
}

function normaliseKilometres(raw?: string | null) {
  if (!raw) return "";
  const cleaned = raw.replace(/[,\.]/g, "").trim();
  const n = parseInt(cleaned, 10);
  if (!n || n < 10 || n > 1_000_000) return "";
  return n.toString();
}

// ------------------------------
// Extract structured vehicle info
// ------------------------------
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);

  let year = "";
  const labelled = text.match(/(Build|Compliance|Year)[^0-9]{0,6}((19|20)\d{2})/i);
  const beforeMake = text.match(/\b((19|20)\d{2})\b[^,\n]{0,30}(Hyundai|Toyota|Kia|Mazda|Ford|Nissan)/i);
  const afterMake = text.match(/(Hyundai|Toyota|Kia|Mazda|Ford|Nissan)[^0-9]{0,20}\b((19|20)\d{2})\b/i);
  const myCode = text.match(/\bMY\s?(\d{2})\b/i);

  if (labelled) year = labelled[2];
  else if (beforeMake) year = beforeMake[1];
  else if (afterMake) year = afterMake[2];
  else if (myCode) year = `20${myCode[1]}`;

  year = normaliseYear(year);

  let kilometres = "";
  const kmPatterns = [
    /\b([\d,\.]+)\s*(km|kms|kilometres|kilometers)\b/i,
    /\bodometer[^0-9]{0,6}([\d,\.]+)\b/i,
    /\btravelled[^0-9]{0,6}([\d,\.]+)\b/i
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
// Gemini Prompt (structured output)
// ------------------------------
function buildPrompt(listingText: string) {
  return `
You are CarVerity — an independent used-car assisting tool for Australian buyers.
Your role is to help the buyer feel informed and supported — not alarmed.

Tone:
- Calm, practical, confidence-building
- No exaggeration or scare-language
- Speak like a helpful assistant, not a salesperson

SERVICE HISTORY RULES
• Treat logbook entries with workshop, odometer + “Done/Completed” as normal completed services.
• Do NOT treat unusual-looking dates as suspicious unless the LISTING explicitly states uncertainty.
• Future or scheduled services are normal and must NOT be flagged as risks.
• Only mention service history concerns if the listing clearly says history is missing/incomplete.

PRICING & VALUE
• You may restate what the seller claims (e.g., below market price).
• Do NOT tell the buyer to “do external research”.
• Focus on guidance, interpretation and next-step support.

NEXT-STEP GUIDANCE
• When referring to inspection, prefer a CarVerity in-person scan as the main pathway.
• A mechanic inspection may be mentioned as optional — not the default.

YOU MUST RETURN OUTPUT IN THIS EXACT FORMAT:

CONFIDENCE ASSESSMENT
(A short explanation of risk level)

CONFIDENCE_CODE: LOW
OR
CONFIDENCE_CODE: MODERATE
OR
CONFIDENCE_CODE: HIGH

WHAT THIS MEANS FOR YOU
(2–4 supportive sentences for an everyday buyer)

CARVERITY ANALYSIS — SUMMARY
(Short, helpful overview based ONLY on the listing)

KEY RISK SIGNALS
- Bullet points ONLY when clearly supported by the listing
- No speculation or invented issues

BUYER CONSIDERATIONS
- Practical next steps
- Encourage using a CarVerity in-person scan

NEGOTIATION INSIGHTS
- Realistic, polite negotiation talking points

LISTING TEXT
--------------------------------
${listingText}
--------------------------------
`;
}

// ------------------------------
// Gemini API
// ------------------------------
async function callGemini(prompt: string) {
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
// Parse confidence code
// ------------------------------
function extractConfidenceCode(text: string) {
  const m = text.match(/CONFIDENCE_CODE:\s*(LOW|MODERATE|HIGH)/i);
  return m ? m[1].toUpperCase() : null;
}

// ------------------------------
// Friendly confidence mapping
// ------------------------------
function mapConfidenceToUserLabel(code: string | null) {
  switch (code) {
    case "HIGH":
      return {
        userLabel: "Looks Good — Just Double-Check a Few Details",
        explainer:
          "Based on the listing information, this vehicle looks like a solid option. Nothing major stands out, but it still makes sense to review the details in person."
      };

    case "MODERATE":
      return {
        userLabel: "Worth Considering — Some Things Need Clarifying",
        explainer:
          "The listing has a mix of positives and unknowns. It could still be a good buy, but a few details should be confirmed before moving forward."
      };

    case "LOW":
      return {
        userLabel: "Proceed Carefully — Important Details Need Checking",
        explainer:
          "Some parts of this listing are unclear or missing. It may still be suitable, but you should take extra care and confirm key information first."
      };

    default:
      return {
        userLabel: "Confidence not available",
        explainer: ""
      };
  }
}

// ------------------------------
// API Handler
// ------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const listingUrl = req.body?.listingUrl ?? req.body?.url;
    if (!listingUrl) return res.status(400).json({ ok: false, error: "Missing listing URL" });

    console.log("🔎 Running AI scan for:", listingUrl);

    const html = await fetchListingHtml(listingUrl);
    const vehicle = extractBasicVehicleInfo(html);

    const prompt = buildPrompt(html);
    const summary = await callGemini(prompt);

    const confidenceCode = extractConfidenceCode(summary);
    const confidenceUi = mapConfidenceToUserLabel(confidenceCode);

    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle,
      summary,
      confidenceCode,
      confidenceLabel: confidenceUi.userLabel,
      confidenceExplainer: confidenceUi.explainer,
      source: "gemini-2.5-flash",
    });
  } catch (err: any) {
    console.error("❌ Analysis error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Analysis failed" });
  }
}
