import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status})`);
  return await res.text();
}

function extractReadableText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20000);
}

function buildPromptFromListing(text: string): string {
  return `
You are CarVerity — provide neutral buyer guidance only.

OUTPUT FORMAT
CONFIDENCE ASSESSMENT
CONFIDENCE_CODE: LOW / MODERATE / HIGH
WHAT THIS MEANS FOR YOU
CARVERITY ANALYSIS — SUMMARY
KEY RISK SIGNALS
BUYER CONSIDERATIONS
NEGOTIATION INSIGHTS
GENERAL OWNERSHIP NOTES

LISTING TEXT
--------------------------------
${text}
--------------------------------
`;
}

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: any) => p?.text || "").join("\n").trim();
}

function extractConfidenceCode(text: string): string | null {
  const m = text.match(/CONFIDENCE_CODE:\s*(LOW|MODERATE|HIGH)/i);
  return m ? m[1].toUpperCase() : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as any;
    const listingUrl = body?.listingUrl ?? null;
    const rawText = body?.rawText ?? null;

    let listingText = "";
    let mode: "html" | "raw-fallback" = "html";

    /* ------------------------------------------
       🔹 ASSIST MODE — RAW TEXT ONLY
       ------------------------------------------ */
    if (rawText && String(rawText).trim().length > 0) {
      mode = "raw-fallback";
      listingText = String(rawText);
    }

    /* ------------------------------------------
       🔹 NORMAL MODE — FETCH HTML
       ------------------------------------------ */
    else if (listingUrl) {
      try {
        const html = await fetchListingHtml(listingUrl);
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

    /* ------------------------------------------
       ❌ Nothing to analyse
       ------------------------------------------ */
    else {
      return res
        .status(400)
        .json({ ok: false, error: "No listing or text provided" });
    }

    /* ------------------------------------------
       🔹 Run model
       ------------------------------------------ */
    const prompt = buildPromptFromListing(listingText);
    const raw = await callGemini(prompt);

    const confidenceCode = extractConfidenceCode(raw) ?? "MODERATE";

    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle: { make: "", model: "", year: "", kilometres: "" },
      summary: raw,
      confidenceCode,
      source: "gemini-2.5-flash",
      analysisVersion: "v2-assist-stable",
      mode,
    });
  } catch (err: any) {
    console.error("❌ Analysis error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Analysis failed",
    });
  }
}
