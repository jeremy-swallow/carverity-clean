export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { listingUrl } = req.body;

    if (!listingUrl) {
      return res.status(400).json({ error: "Missing listingUrl" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenAI key not configured" });
    }

    // ---- Call OpenAI ----
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You analyze used-car listings and return structured risk findings.",
          },
          {
            role: "user",
            content: `Analyze this car listing and return structured risk insights: ${listingUrl}`,
          },
        ],
      }),
    });

    const data = await response.json();

    // ---- Normalise result into our structure ----
    const parsed =
      typeof data?.choices?.[0]?.message?.content === "string"
        ? JSON.parse(data.choices[0].message.content)
        : data?.choices?.[0]?.message?.content ?? {};

    const report = {
      riskRating: parsed.riskRating ?? "Unknown",
      keyInsights: parsed.keyInsights ?? ["No structured output returned"],
      sections: parsed.sections ?? {
        pricing: [],
        language: [],
        sellerTrust: [],
        missingInfo: [],
        recommendations: [],
      },
      source: listingUrl,
    };

    return res.status(200).json(report);
  } catch (err) {
    console.error("AI error", err);
    return res.status(500).json({ error: "AI request failed" });
  }
}
