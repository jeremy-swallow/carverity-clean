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
    vehicle: { make: "", model: "", year: "", kilometres: "" },
    confidenceCode: "MODERATE",
    previewSummary: safeText.slice(0, 280),
    fullSummary: safeText,
  };
}

function safeParseModelJson(raw: string): ModelResult {
  if (!raw || !raw.trim()) {
    throw new Error("empty-model-response");
  }

  const fenced =
    raw.match(/```json([\s\S]*?)```/i)?.[1] ??
    raw.match(/```([\s\S]*?)```/i)?.[1] ??
    raw;

  const firstBrace = fenced.indexOf("{");
  const lastBrace = fenced.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    console.error(
      "⚠️ Gemini response had no JSON braces — falling back to text summary."
    );
    return buildFallbackResult(raw);
  }

  const candidate = fenced.slice(firstBrace, lastBrace + 1);

  try {
    const parsed = JSON.parse(candidate);
    return {
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

    if (!listingText || listingText.length < 400) {
      return res.status(200).json({
        ok: false,
        mode: assistMode ? "assist-manual" : "assist-required",
        reason: "insufficient-text",
        listingUrl,
      });
    }

    /* =====================================================
       Structured analysis prompt (service-history rules strengthened)
    ====================================================== */

    const prompt = `
You are CarVerity — a cautious, factual Australian used-car buying assistant.

Analyse the following Australian used-car listing and respond ONLY with JSON.

Return exactly this structure:

{
  "vehicle": { "make": "", "model": "", "year": "", "kilometres": "" },
  "confidenceCode": "LOW | MODERATE | HIGH",
  "previewSummary": "",
  "fullSummary": ""
}

Reasoning rules (strict and non-negotiable):

1) Do not speculate or invent problems. Only mention risks that are
   *clearly supported by the listing text itself*.

2) Service-history interpretation (very important):

   Treat photographed logbook pages, workshop stamps, handwritten service notes,
   receipts, or images of a stamped service-book entry as **evidence of a
   completed service**.

   — If a date appears future-dated because it is part of a printed
     schedule layout, or the page is stamped with recorded work completed,
     this is **NOT a red flag**.

   — Only treat service history as a risk if the listing text explicitly
     indicates:
       • odometer inconsistency or rollback
       • missing or blank service records
       • evidence of tampering or falsification
       • contradictory mileage vs service entries

   — If something looks unusual but there is no contradiction,
     describe it neutrally as **“worth confirming with the seller”**,
     not as a fault or risk.

3) Use Australian language, kilometres, and neutral tone.

4) previewSummary = short neutral overview.
   fullSummary = factual explanation with grounded context only.

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
