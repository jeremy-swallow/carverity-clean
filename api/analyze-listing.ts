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
   Types
========================================================= */

type Section = { title: string; body: string };

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
  sections?: Section[];
};

/* =========================================================
   Section Fallback Builder
========================================================= */

function synthesiseSections(text: string): Section[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25);

  if (!sentences.length) {
    return [
      { title: "Overview", body: text },
      {
        title: "Key risk signals",
        body:
          "No major risks identified from listing text alone — confirm during in-person inspection.",
      },
    ];
  }

  const mk = (title: string, lines: string[]) => ({
    title,
    body: lines.join(" "),
  });

  if (sentences.length <= 3) {
    return [
      mk("Overview", sentences.slice(0, 1)),
      mk("Key risk signals", sentences.slice(1)),
    ];
  }

  const third = Math.ceil(sentences.length / 3);

  return [
    mk("Overview", sentences.slice(0, third)),
    mk("Key risk signals", sentences.slice(third, third * 2)),
    mk("Buyer considerations", sentences.slice(third * 2)),
  ];
}

/* =========================================================
   Fallback & Safe Parsing
========================================================= */

function buildFallbackResult(raw: string): ModelResult {
  const safe = raw?.trim() || "No structured response returned.";
  return {
    vehicle: { make: "", model: "", year: "", kilometres: "" },
    confidenceCode: "MODERATE",
    previewSummary: safe.slice(0, 240),
    fullSummary: safe,
    sections: synthesiseSections(safe),
  };
}

function safeParseModelJson(raw: string): ModelResult {
  if (!raw?.trim()) throw new Error("empty-model-response");

  const fenced =
    raw.match(/```json([\s\S]*?)```/i)?.[1] ??
    raw.match(/```([\s\S]*?)```/i)?.[1] ??
    raw;

  const first = fenced.indexOf("{");
  const last = fenced.lastIndexOf("}");

  if (first === -1 || last === -1 || last < first) {
    console.warn("⚠️ No JSON braces found — using fallback");
    return buildFallbackResult(raw);
  }

  try {
    const parsed = JSON.parse(fenced.slice(first, last + 1));

    const fullSummary = (parsed?.fullSummary ?? "").trim();
    const previewSummary =
      (parsed?.previewSummary ?? "").trim() ||
      fullSummary.split(".").slice(0, 2).join(". ") + ".";

    return {
      vehicle: {
        make: parsed?.vehicle?.make ?? "",
        model: parsed?.vehicle?.model ?? "",
        year: parsed?.vehicle?.year ?? "",
        kilometres: parsed?.vehicle?.kilometres ?? "",
      },
      confidenceCode: parsed?.confidenceCode ?? "MODERATE",
      previewSummary,
      fullSummary,
      sections:
        Array.isArray(parsed?.sections) && parsed.sections.length > 0
          ? parsed.sections
          : synthesiseSections(fullSummary || raw),
    };
  } catch (err) {
    console.error("⚠️ JSON parse failure — fallback in use", err);
    return buildFallbackResult(raw);
  }
}

/* =========================================================
   Gemini Call
========================================================= */

async function callModel(listingText: string): Promise<ModelResult> {
  const prompt = `
You are CarVerity — a cautious Australian used-car analysis assistant.

Analyse the listing and return ONLY JSON in this exact structure:

{
  "vehicle": { "make": "", "model": "", "year": "", "kilometres": "" },
  "confidenceCode": "LOW" | "MODERATE" | "HIGH",
  "previewSummary": "",
  "fullSummary": "",
  "sections": [
    { "title": "Overview", "body": "" },
    { "title": "Key risk signals", "body": "" },
    { "title": "Buyer considerations", "body": "" },
    { "title": "General ownership notes", "body": "" },
    { "title": "Negotiation insights", "body": "" }
  ]
}

Rules:
- Use Australian context and kilometres.
- Call out service-history gaps, future-dated entries, price disclaimers.
- Never invent facts — only infer from the listing.
- If unsure, say "not stated" instead of guessing.

Listing text:
${listingText}
`;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
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
    const { listingUrl, pastedText } = (req.body ?? {}) as {
      listingUrl?: string;
      pastedText?: string;
    };

    const assistMode = Boolean(pastedText);
    let listingText = pastedText ?? "";

    if (!assistMode) {
      if (!listingUrl)
        return res.status(400).json({ ok: false, error: "missing-url" });

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

    const result = await callModel(listingText);

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
