import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY — add it in Vercel env vars.");
}

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/123.0 Safari/537.36";

async function fetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-US,en;q=0.9",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "Upgrade-Insecure-Requests": "1",
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status})`);
  return await res.text();
}

/* =========================================================
   CLEAN TEXT — removes seller bio / profile noise
========================================================= */
function extractReadableText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let cleaned = stripped;

  cleaned = cleaned
    .replace(/member since\s+\d{4}/gi, "")
    .replace(/dealer profile/gi, "")
    .replace(/about our dealership[\s\S]*?(?=contact|summary|$)/gi, "");

  return cleaned.slice(0, 20000);
}

/* =========================================================
   (Gemini call + handler unchanged aside from above)
========================================================= */

function buildPromptFromListing(listingText: string): string {
  return `
You are CarVerity — a neutral guidance tool for Australian used-car buyers.

CONFIDENCE MODEL…
${listingText}
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
        generationConfig: { temperature: 0.2, topP: 0.9 },
      }),
    }
  );

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p: any) => p?.text || "").join("\n").trim();
}

function extractConfidenceCode(text: string): string | null {
  const m = text.match(/CONFIDENCE_CODE:\s*(LOW|MODERATE|HIGH)/i);
  return m ? m[1].toUpperCase() : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as any;
    const listingUrl = body?.listingUrl ?? body?.url;
    const rawTextInput = body?.rawText ?? null;

    if (!listingUrl && !rawTextInput) {
      return res.status(400).json({ ok: false, error: "Missing input" });
    }

    let listingText = "";
    let vehicle = { make: "", model: "", year: "", kilometres: "" };
    let mode: "html" | "raw-fallback" = "html";

    try {
      if (listingUrl) {
        const html = await fetchListingHtml(listingUrl);
        const readable = extractReadableText(html);

        if (readable.length < 400) {
          return res.status(200).json({
            ok: false,
            mode: "assist-required",
            reason: "scrape-blocked",
            listingUrl,
          });
        }

        listingText = readable;
      } else {
        mode = "raw-fallback";
        listingText = String(rawTextInput || "");
      }
    } catch {
      return res.status(200).json({
        ok: false,
        mode: "assist-required",
        reason: "fetch-failed",
        listingUrl,
      });
    }

    const prompt = buildPromptFromListing(listingText);
    const raw = await callGemini(prompt);
    const confidenceCode = extractConfidenceCode(raw) ?? "MODERATE";

    return res.status(200).json({
      ok: true,
      message: "Scan complete",
      vehicle,
      summary: raw,
      confidenceCode,
      source: "gemini-2.5-flash",
      analysisVersion: "v2-cleaned-text",
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
