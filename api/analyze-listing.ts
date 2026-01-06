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
   Model Response — Safe JSON Extractor (hardened)
========================================================= */

function safeParseModelJson(raw: string): any {
  if (!raw) throw new Error("empty-model-response");

  // Prefer fenced JSON if present
  const fenced =
    raw.match(/```json([\s\S]*?)```/i)?.[1] ??
    raw.match(/```([\s\S]*?)```/i)?.[1];

  const candidate = (fenced ?? raw)
    // remove anything before first {
    .replace(/^[\s\S]*?(\{)/, "$1")
    // remove anything after last }
    .replace(/(\})[\s\S]*$/, "$1")
    // normalise curly quotes
    .replace(/[“”]/g, `"`)
    .replace(/[‘’]/g, "'")
    .trim();

  try {
    return JSON.parse(candidate);
  } catch {
    console.error("❌ JSON parse failed — candidate was:\n", candidate);
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

  // 🔍 TEMP DIAGNOSTIC LOGGING
  console.log("🧾 RAW MODEL OUTPUT:\n", text);

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
       Build structured analysis prompt
    ====================================================== */

    const prompt = `
Analyse this Australian used-car listing and reply ONLY as JSON.

Required JSON structure:
{
  "vehicle": { "make": "", "model": "", "year": "", "kilometres": "" },
  "confidenceCode": "LOW | MODERATE | HIGH",
  "previewSummary": "",
  "fullSummary": ""
}

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
