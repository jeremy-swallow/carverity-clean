// api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

/* =========================================================
   HTTP Fetch Helpers
========================================================= */

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
      "Accept-Language": "en-AU,en;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`fetch-failed:${res.status}`);
  }

  return await res.text();
}

function extractReadableText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   Model Response — Safe JSON Extractor
========================================================= */

function safeParseModelJson(raw: string): any {
  if (!raw) throw new Error("empty-model-response");

  // Grab ```json ... ``` if present
  const fenced =
    raw.match(/```json([\s\S]*?)```/i)?.[1] ??
    raw.match(/```([\s\S]*?)```/i)?.[1];

  const candidate = (fenced ?? raw)
    .replace(/^[^\{]*/s, "") // trim anything before first {
    .replace(/[^}]*$/s, ""); // trim anything after last }

  try {
    return JSON.parse(candidate);
  } catch {
    throw new Error("model-json-parse-failed");
  }
}

/* =========================================================
   Gemini Call
========================================================= */

async function callModel(prompt: string) {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) throw new Error("model-call-failed");

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ?? "";

  return safeParseModelJson(text);
}

/* =========================================================
   API Handler
========================================================= */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = (req.body ?? {}) as {
      listingUrl?: string;
      pastedText?: string;
    };

    const { listingUrl, pastedText } = body;
    const assistMode = Boolean(pastedText);

    let listingText = pastedText ?? "";

    // Normal mode — fetch from URL
    if (!assistMode) {
      if (!listingUrl) {
        return res.status(400).json({ ok: false, error: "missing-url" });
      }

      try {
        const html = await fetchHtml(listingUrl);
        listingText = extractReadableText(html);
      } catch {
        return res.status(200).json({
          ok: false,
          mode: "assist-required",
          reason: "fetch-failed",
          listingUrl,
        });
      }
    }

    // If text is still too small → ask user to paste
    if (!listingText || listingText.length < 400) {
      return res.status(200).json({
        ok: false,
        mode: assistMode ? "assist-manual" : "assist-required",
        reason: "insufficient-text",
        listingUrl,
      });
    }

    /* =====================================================
       CarVerity analysis prompt (richer, section-based)
    ====================================================== */

    const prompt = `
You are "CarVerity", an assistant that turns Australian used-car listings into
clear, buyer-friendly guidance.

Analyse the listing text below and respond with **ONLY valid JSON** using this
exact structure (no extra top-level keys):

{
  "vehicle": {
    "make": "Hyundai",
    "model": "Sonata Premium",
    "year": "2016",
    "kilometres": "57386"
  },
  "confidenceCode": "LOW" | "MODERATE" | "HIGH",
  "previewSummary": "short 1–2 sentence hook for the buyer",
  "fullSummary": "multi-section markdown report as described below"
}

/* -------- VEHICLE FIELD --------
- Infer make, model, year and odometer from the listing.
- Use strings only.
- Kilometres should be numeric with no units or commas if possible
  (e.g. "57386"), but if the listing only has formatted text like
  "57,386 km" you may keep that string.
*/

/* -------- CONFIDENCE CODE --------
Map your overall confidence in the listing into:

- "HIGH"      → Strong positive listing, low risk, good transparency.
- "MODERATE"  → Mixed positives and concerns; buyer should proceed carefully.
- "LOW"       → Significant risks, missing information, or major red flags.

Focus especially on:
- Service history quality and gaps.
- Signs of accident damage, write-offs, or finance owing.
- Import/compliance issues.
- Odometer concerns or inconsistencies.
*/

/* -------- PREVIEW SUMMARY --------
- 1–2 sentences, **plain text**, no headings.
- Designed as a hook for the preview screen.
- Mention overall vibe + one interesting insight or risk.
*/

/* -------- FULL SUMMARY --------
"fullSummary" must be a SINGLE markdown string that uses the
following headings in **THIS exact order**, separated by blank lines:

CONFIDENCE ASSESSMENT
<1–3 short paragraphs explaining the confidenceCode in plain language.>

WHAT THIS MEANS FOR YOU
<2–3 paragraphs translating the listing into buyer-friendly guidance.
 Explain what type of buyer this car might suit, and overall risk level.>

KEY RISK SIGNALS
<2–4 paragraphs focusing ONLY on risks and uncertainties.
 Prioritise:
 - any mentions of damage, imperfections, prior accidents, write-offs,
   or structural concerns
 - warning lights, dashboard issues, leaks, noises
 - vague or missing information that matters
 - ANY odometer or service history concerns (see rules below).>

BUYER CONSIDERATIONS
<2–4 paragraphs of balanced pros and cons.
 Include features, safety, practicality, dealer inclusions, warranty,
 finance, and anything that genuinely helps a buyer decide.>

NEGOTIATION INSIGHTS
<Very practical money guidance.
 - Give an approximate negotiation band in AUD, for example:
   "A reasonable opening offer might be around \$X, with a walk-away
    ceiling near \$Y, depending on inspection results."
 - Explain why (market positioning, kilometres, service history quality,
   dealer extras, visible risks).
 - Stress that prices vary by city and this is guidance, not a guarantee.>

GENERAL OWNERSHIP NOTES
<2–3 paragraphs about what day-to-day life with this car might look like:
 running costs, fuel use, comfort, safety tech, parking, family use, etc.>

SERVICE HISTORY & HIDDEN RISKS
<ALWAYS include this section, even if the listing barely mentions servicing.

SERVICE-HISTORY RULES (IMPORTANT):
- If service history entries are mentioned, explicitly list them in words:
  e.g. "Service entries at 21,571 km (Dec 2019), 28,334 km (Jun 2020),
  and 57,315 km (Oct 2023)".
- If there is a **future-dated** service entry or a clearly impossible date,
  treat it as a **high-risk data anomaly**:
  - say that it might be a data entry error
  - BUT clearly explain that the buyer must confirm logbook and invoices
    before trusting the odometer or condition claims.
- Highlight **big gaps** in the logbook:
  - more than ~18 months between services, or
  - more than ~30,000 km between services.
  Explain why those gaps matter for engine and transmission health.
- If service history is strong and consistent, say so and treat it as a
  MAJOR positive signal.
- When the history is patchy OR has anomalies:
  - DO NOT say that "immediate repair exposure is expected to be low".
  - Instead emphasise uncertainty and recommend a thorough
    independent inspection and logbook check.

In this section, be very direct and concrete about what the buyer should ask
the seller or dealer to prove.

COST EXPOSURE & NEXT STEPS
<Estimate likely cost exposure in simple bands and give clear actions.

- Choose a band and state it clearly:
  - "Low — likely under \$1,000 in the near term"
  - "Moderate — roughly \$1,000–\$3,000 depending on inspection"
  - "High — could exceed \$3,000 if issues are confirmed"
- Explain **why** you chose that band (based on risks, age, kilometres).
- Recommend 2–4 concrete next steps:
  - e.g. "order a PPSR check", "book an independent pre-purchase inspection",
    "ask for stamped logbook photos", "walk away if the dealer can't explain
    the service history gap", etc.
>

IMPORTANT STYLISTIC RULES:
- Write in Australian English (kilometres, tyres, bonnet, etc.).
- Do NOT invent information that clearly isn't in the listing.
- It’s okay to infer sensible context (e.g. older turbo cars usually need
  careful servicing) but be clear when you are inferring.
- Avoid repeating the exact same sentence in multiple sections.
- Stay neutral and helpful — never alarmist, never salesy.
- Your output MUST be valid JSON. Do not include markdown outside the
  "fullSummary" string.
- Escape newlines as needed so the JSON parses correctly.
*/

Listing text:
${listingText}
`;

    const result = await callModel(prompt);

    return res.status(200).json({
      ok: true,
      mode: "analysis-complete",
      source: "gemini-2.5-flash",
      ...result,
    });
  } catch (err: any) {
    console.error("❌ analyze-listing error:", err?.message || err);
    return res.status(200).json({
      ok: false,
      mode: "error",
      reason: err?.message ?? "unknown-error",
    });
  }
}
