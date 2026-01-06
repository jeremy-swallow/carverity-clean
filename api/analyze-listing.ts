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

type ModelResult = {
  vehicle: {
    make: string;
    model: string;
    year: string;
    kilometres: string;
  };
  confidenceCode: "LOW" | "MODERATE" | "HIGH" | string;
  previewSummary: string;
  fullSummary: string;
};

function buildFallbackResult(raw: string): ModelResult {
  const trimmed = (raw || "").trim();
  const safeText = trimmed || "No structured response was returned.";

  return {
    vehicle: {
      make: "",
      model: "",
      year: "",
      kilometres: "",
    },
    confidenceCode: "MODERATE",
    previewSummary: safeText.slice(0, 280),
    fullSummary: safeText,
  };
}

function safeParseModelJson(raw: string): ModelResult {
  if (!raw || !raw.trim()) {
    throw new Error("empty-model-response");
  }

  // Try to extract the JSON body, even if the model wrapped it in prose or fences.
  const fenced =
    raw.match(/```json([\s\S]*?)```/i)?.[1] ??
    raw.match(/```([\s\S]*?)```/i)?.[1] ??
    raw;

  const firstBrace = fenced.indexOf("{");
  const lastBrace = fenced.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    // Can't even find a JSON-looking region → fall back to safe text.
    console.error(
      "⚠️ Gemini response had no JSON braces — falling back to text summary."
    );
    return buildFallbackResult(raw);
  }

  const candidate = fenced.slice(firstBrace, lastBrace + 1);

  try {
    const parsed = JSON.parse(candidate);

    // Best-effort normalisation into our expected shape
    const result: ModelResult = {
      vehicle: {
        make: parsed?.vehicle?.make ?? "",
        model: parsed?.vehicle?.model ?? "",
        year: parsed?.vehicle?.year ?? "",
        kilometres: parsed?.vehicle?.kilometres ?? "",
      },
      confidenceCode: parsed?.confidenceCode ?? "MODERATE",
      previewSummary: parsed?.previewSummary ?? "",
      fullSummary: parsed?.fullSummary ?? "",
    };

    return result;
  } catch (err) {
    console.error(
      "⚠️ Gemini JSON parse failed — falling back to text summary.",
      err
    );
    return buildFallbackResult(raw);
  }
}

/* =========================================================
   Gemini Call
========================================================= */

async function callModel(prompt: string): Promise<ModelResult> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          // Ask Gemini to return strict JSON to minimise parsing issues.
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error("model-call-failed");
  }

  const data = await res.json();
  const text: string =
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
      } catch (err) {
        console.error("❌ Listing fetch failed:", err);
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
You are CarVerity, a cautious Australian used-car buying assistant.

Analyse the following Australian used-car listing and respond ONLY with JSON.

JSON shape (no extra fields):

{
  "vehicle": { "make": "", "model": "", "year": "", "kilometres": "" },
  "confidenceCode": "LOW | MODERATE | HIGH",
  "previewSummary": "",
  "fullSummary": ""
}

Rules:
- Be concise but specific to THIS listing.
- Mention any service-history gaps, future-dated entries, or red flags in the fullSummary.
- If prices are marked "non-negotiable", still assess risk but do not promise that the price can be negotiated.
- Use kilometres and Australian context.

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
