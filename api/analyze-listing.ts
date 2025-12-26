export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const listingUrl = body?.listingUrl;

    if (!listingUrl) {
      return new Response(
        JSON.stringify({ error: "Missing listingUrl" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = `
You are an automotive risk analysis assistant.

Analyze the wording of this used-car listing URL and return structured findings only.
Listing: ${listingUrl}

Output JSON with:
- rating (low | medium | high)
- keyInsights[]
- pricingSignals[]
- languageRisks[]
- sellerTrust[]

Return ONLY valid JSON.
`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    const data = await aiResponse.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);

    return new Response(
      JSON.stringify({ ok: true, analysis: parsed }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("AI analysis error:", err);
    return new Response(
      JSON.stringify({ error: "Processing failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
