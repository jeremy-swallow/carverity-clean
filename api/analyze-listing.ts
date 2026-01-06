// src/pages/api/analyze-listing.ts
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

  const fenced =
    raw.match(/```json([\s\S]*?)```/i)?.[1] ??
    raw.match(/```([\s\S]*?)```/i)?.[1];

  const candidate = (fenced ?? raw)
    .replace(/^[^\{]*/s, "")
    .replace(/[^}]*$/s, "");

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

    // Normal fetch mode
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

    if (!listingText || listingText.length < 400) {
      return res.status(200).json({
        ok: false,
        mode: assistMode ? "assist-manual" : "assist-required",
        reason: "insufficient-text",
        listingUrl,
      });
    }

    /* =====================================================
       🚗 Structured Guidance Model Prompt (CarVerity Mode)
    ====================================================== */

    const prompt = `
You are CarVerity — an independent car-buying assistant for Australia.

Analyse the listing text below and produce PRACTICAL, ACTION-ORIENTED buyer guidance.
Do NOT exaggerate risk. Do NOT infer faults unless the text clearly states them.

Return ONLY valid JSON in this structure:

{
  "vehicle": { "make": "", "model": "", "year": "", "kilometres": "" },

  "confidenceCode": "LOW | MODERATE | HIGH",

  "previewSummary": "1–2 short sentences suitable for teaser mode",

  "sections": [
    { "title": "Overview", "body": "" },
    { "title": "Key risk signals", "body": "" },
    { "title": "Buyer considerations", "body": "" },
    { "title": "General ownership notes", "body": "" }
  ],

  "negotiation": {
    "startingPoint": "",
    "justification": ""
  },

  "repairExposure": {
    "estimatedRange": "",
    "notes": ""
  },

  "fullSummary": "A readable full-report narrative version of all key insights"
}

RULES:
- If service history dates appear unusual, treat as POSSIBLE DATA ENTRY ISSUE — do NOT assume risk.
- Do not duplicate the same sentence across multiple sections.
- Write in calm, factual, supportive language.
- Focus on guidance the buyer can act on.
- Keep sections concise but meaningful (3–7 sentences).
- Prefer clarity over drama.

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
