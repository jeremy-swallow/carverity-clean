import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;

if (!GEMINI_API_KEY) {
  throw new Error(
    "Missing GOOGLE_API_KEY — add it in Vercel environment variables."
  );
}

// ------------------------------
// Helper: Fetch listing HTML
// ------------------------------
async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch listing (${res.status})`);
  }

  return await res.text();
}

// ------------------------------
// Helper: Extract simple vehicle fields (non-speculative)
// ------------------------------
function extractBasicVehicleInfo(text: string) {
  const makeMatch = text.match(/Make:\s*([A-Za-z0-9\s]+)/i);
  const modelMatch = text.match(/Model:\s*([A-Za-z0-9\s]+)/i);
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);

  let year = yearMatch?.[0] || "";

  // 🧠 Sanity guard — if obviously unrealistic, prefer "unknown"
  const yearNum = Number(year);
  const currentYear = new Date().getFullYear();
  if (yearNum < 1970 || yearNum > currentYear + 2) {
    year = "";
  }

  return {
    make: makeMatch?.[1]?.trim() || "",
    model: modelMatch?.[1]?.trim() || "",
    year,
  };
}

// ------------------------------
// Gemini Prompt — calibrated tone
// ------------------------------
function buildPrompt(listingText: string) {
  return `
You are CarVerity — an independent, consumer-focused used-car guidance assistant
for Australian buyers.

Your role is to interpret the listing in a practical, balanced and
non-alarmist way. Do NOT speculate or assume anything that is not clearly stated.

STRICT RULES ABOUT FACTS & DATES
• Future dates such as “next service due”, warranty expiry, or registration expiry
  are normal and must NOT be treated as risk signals.
• Only treat a date as a concern if the listing clearly states that a service
  WAS COMPLETED on a future date AND this is explicitly presented as past history.
• If a date or detail is ambiguous or cannot be confidently interpreted,
  do NOT guess — instead state: “The listing does not clearly explain this detail.”

TONE & STYLE
• Calm, helpful, factual, professional
• Avoid exaggeration, dramatic language, or legal-sounding warnings
• Prefer neutral phrasing such as “worth confirming with the seller”

STRUCTURE YOUR RESPONSE EXACTLY AS:

SUMMARY
2–3 short sentences explaining what the listing generally describes and any
important context a cautious buyer should be aware of.

KEY RISK SIGNALS
List ONLY genuine, clearly supported buyer-relevant risks from the listing text.
If there are no obvious risk signals, say:
“No clear red flags are visible in the listing — but a few details are still worth confirming.”

BUYER CONSIDERATIONS
Provide practical follow-up checks a sensible buyer should confirm,
written as friendly guidance — not instructions or assumptions.

Do NOT invent details. Do NOT speculate. Only use information from the listing.

LISTING TEXT
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
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ------------------------------
// API Handler
// ------------------------------
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const listingUrl = req.body?.listingUrl ?? req.body?.url;

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

    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle,
      summary,
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
