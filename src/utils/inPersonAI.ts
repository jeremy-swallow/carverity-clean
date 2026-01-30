/* =======================================================
   In-person AI interpretation helper
   - Buyer-safe
   - Never returns raw JSON
   - Graceful fallback
======================================================= */

export type InPersonAIResult = {
  summary: string;
  reasoning: string[];
};

export function normaliseInPersonAI(ai: unknown): InPersonAIResult | null {
  if (!ai || typeof ai !== "object") return null;

  const obj = ai as Record<string, unknown>;

  const summary =
    typeof obj.summary === "string"
      ? obj.summary.trim()
      : typeof obj.verdict === "string"
      ? obj.verdict.trim()
      : "";

  const reasoning = Array.isArray(obj.reasoning)
    ? (obj.reasoning as unknown[]).filter(
        (r: unknown): r is string => typeof r === "string"
      )
    : [];

  if (!summary && reasoning.length === 0) return null;

  return {
    summary,
    reasoning,
  };
}

export function fallbackInPersonAI(analysis: unknown): InPersonAIResult {
  const a = (analysis ?? {}) as Record<string, unknown>;
  const risksRaw = Array.isArray(a.risks) ? (a.risks as unknown[]) : [];
  const unsureCount = Array.isArray(a.uncertaintyFactors)
    ? (a.uncertaintyFactors as unknown[]).length
    : 0;

  const hasCritical = risksRaw.some((r: unknown) => {
    if (!r || typeof r !== "object") return false;
    const rr = r as Record<string, unknown>;
    return rr.severity === "critical";
  });

  let summary =
    "Based on what was recorded, there are no immediate deal-breaking issues.";
  if (hasCritical) {
    summary =
      "Some higher-risk signals were recorded. Clarification is recommended before proceeding.";
  }

  const reasoning: string[] = [];

  if (unsureCount > 0) {
    reasoning.push(
      "Some items were marked as unsure. Getting clarity here reduces buyer risk."
    );
  }

  if (risksRaw.length === 0) {
    reasoning.push(
      "No significant risk signals were recorded during the inspection."
    );
  }

  return { summary, reasoning };
}
