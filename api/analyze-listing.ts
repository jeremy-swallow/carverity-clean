// api/analyze-listing.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractListingPhotosFromHtml } from "../src/utils/listingPhotos.js";

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
   Model Result Helpers
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
  if (!raw || !raw.trim()) throw new Error("empty-model-response");

  const fenced =
    raw.match(/```json([\s\S]*?)```/i)?.[1] ??
    raw.match(/```([\s\S]*?)```/i)?.[1] ??
    raw;

  const firstBrace = fenced.indexOf("{");
  const lastBrace = fenced.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    console.error("⚠️ Gemini response had no JSON braces — fallback.");
    return buildFallbackResult(raw);
  }

  try {
    const parsed = JSON.parse(fenced.slice(firstBrace, lastBrace + 1));
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
    console.error("⚠️ Gemini JSON parse failed — fallback.", err);
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
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!res.ok) throw new Error("model-call-failed");

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
    let photos: { hero?: string; thumbnails: string[] } = {
      hero: undefined,
      thumbnails: [],
    };

    if (!assistMode) {
      if (!listingUrl)
        return res.status(400).json({ ok: false, error: "missing-url" });

      try {
        const html = await fetchHtml(listingUrl);

        // Extract photos before stripping markup
        photos = extractListingPhotosFromHtml(html);

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
       ANALYSIS PROMPT — SERVICE HISTORY RULES (FIXED)
    ====================================================== */

    const prompt = `
You are CarVerity — a careful, factual Australian used-car buying assistant.
Analyse the listing below and respond ONLY with JSON in this shape:

{
  "vehicle": { "make": "", "model": "", "year": "", "kilometres": "" },
  "confidenceCode": "LOW | MODERATE | HIGH",
  "previewSummary": "",
  "fullSummary": ""
}

Rules (strict and conservative):

1) Do not speculate or invent problems. Only mention issues that are clearly
   supported by the listing wording.

2) SERVICE-HISTORY INTERPRETATION

   Distinguish between:
   • completed / evidenced services, and
   • scheduled / future service intervals.

   Treat the following as **normal and NOT a risk**:
     • future-dated service intervals printed in books
     • “Maintenance & Lubrication Service at 120,000 km / 78 months”
     • tables that list upcoming milestones
     • pages where only some boxes are stamped

   These represent **manufacturer schedule placeholders**, not missing history.

   Treat entries as **completed service evidence** when there is:
     • a workshop stamp, signature, handwritten entry, or receipt
     • a clearly marked “carried out on” date or odometer value

   Only treat service history as a risk if the listing explicitly shows:
     • decreasing / impossible odometer values
     • duplicated entries claiming the same km/date
     • seller-acknowledged missing history
     • signs of tampering or falsification

   If an item simply looks unusual but not contradictory,
   present it neutrally as “worth confirming with the seller” — do not frame
   it as a fault or warning.

3) Use Australian tone and kilometres.

4) previewSummary = short neutral overview.
   fullSummary = calm, factual guidance — avoid alarmist language.

Listing text:
${listingText}
`;

    const result = await callModel(prompt);

    return res.status(200).json({
      ok: true,
      mode: "analysis-complete",
      source: "gemini-2.5-flash",
      photos,
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
