import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel environment variables.");
}

// ------------------------------
// Helper: Fetch listing HTML
// ------------------------------
async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

  if (!res.ok) {
    throw new Error(`Failed to fetch listing (${res.status})`);
  }

  return await res.text();
}

// ------------------------------
// Helper: Extract simple vehicle fields from page text
// (Lightweight heuristic — Gemini fills gaps but does NOT invent facts)
// ------------------------------
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);
  const yearMatch = text.match(/(19|20)\d{2}/);

  return {
    make: makeMatch?.[1]?.trim() || "",
    model: modelMatch?.[1]?.trim() || "",
    year: yearMatch?.[0] || "",
  };
}

// ------------------------------
// Gemini Prompt (Consumer-Advice Style)
// ------------------------------
function buildPrompt(listingText: string) {
  return `
You are CarVerity — an independent used-car risk assessor for Australian buyers.

Your job is to analyse the vehicle listing text below and produce objective,
consumer-focused guidance that helps a cautious buyer decide how safely they
can proceed.

ONLY use information from the listing. If details are missing or unclear,
treat that as a potential risk and clearly say so.

Audience:
- Everyday buyers, not mechanics
- First-time or cautious shoppers
- Australian market context

Tone:
- Calm, helpful, professional, trustworthy
- Consumer-advice style — not technical, not salesy
- Short sentences, plain English
- Emphasise risk awareness and buyer protection

STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:

SUMMARY (2–4 sentences max)
- High-level confidence and main concerns
- If important information is missing, call it out

KEY RISK SIGNALS (bullet points)
- Missing service history
- Unclear ownership or import status
- Vague or generic condition statements
- Low kms without supporting evidence
- Anything that could disadvantage a buyer

BUYER CONSIDERATIONS (bullet points)
- Questions to ask the seller
- Documents to request
- Inspection or mechanic follow-up

RULES:
- Do not speculate. Do not invent details.
- If nothing concerning is visible, say:
  "No obvious red flags in the listing — but confirm key details before purchase."

LISTING TEXT STARTS BELOW
--------------------------------
${listingText}
--------------------------------
`;
}

// ------------------------------
// Gemini API Call
// ------------------------------
async function callGemini(prompt: string) {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ------------------------------
// API Handler
// ------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { url } = req.body || {};

    if (!url) {
      return res.status(400).json({ ok: false, error: "Missing listing URL" });
    }

    console.log("🔎 Running AI scan for listing:", url);

    const html = await fetchListingHtml(url);

    const vehicle = extractBasicVehicleInfo(html);

    const prompt = buildPrompt(html);
    const summary = await callGemini(prompt);

    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle,
      summary,
      source: "gemini",
    });
  } catch (err: any) {
    console.error("❌ Analysis error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Analysis failed",
    });
  }
}
