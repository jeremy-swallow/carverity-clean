// src/utils/inPersonAnalysisVerdict.ts

import type {
  AnalysisResult,
  RiskItem,
  UncertaintyFactor,
  BuyerContextInterpretation,
} from "./inPersonAnalysisTypes";

/* =========================================================
   Verdict builder
========================================================= */

export function buildVerdict(args: {
  risks: RiskItem[];
  concernCount: number;
  unsureCount: number;
  completenessScore: number;
  confidenceScore: number;
}): Pick<
  AnalysisResult,
  | "verdict"
  | "verdictReason"
  | "whyThisVerdict"
  | "whyThisVerdictBullets"
  | "riskWeightingExplanation"
  | "riskWeightingBullets"
  | "uncertaintyFactors"
  | "counterfactuals"
  | "buyerContextInterpretation"
> {
  const {
    risks,
    concernCount,
    unsureCount,
    completenessScore,
    confidenceScore,
  } = args;

  const criticalCount = risks.filter((r) => r.severity === "critical").length;
  const moderateCount = risks.filter((r) => r.severity === "moderate").length;

  /* -----------------------------
     Verdict decision
  ----------------------------- */
  let verdict: AnalysisResult["verdict"] = "proceed";

  // Buyer-safe posture:
  // - Multiple criticals => walk-away
  // - Any critical OR multiple moderates => caution
  // - Very low confidence => walk-away
  if (criticalCount >= 2 || confidenceScore < 35) verdict = "walk-away";
  else if (criticalCount >= 1 || moderateCount >= 2) verdict = "caution";

  const verdictReason =
    verdict === "proceed"
      ? "No major red flags were recorded in the inspection you captured."
      : verdict === "caution"
      ? "One or more meaningful concerns (or uncertainties) were recorded — clarifying them would materially improve confidence."
      : "Multiple high-impact concerns were recorded — walking away is a reasonable option unless evidence strongly improves the picture.";

  /* -----------------------------
     Why-this-verdict
  ----------------------------- */
  const whyThisVerdictBullets: string[] = [
    verdict === "proceed"
      ? "No recorded findings were assessed as high impact."
      : verdict === "caution"
      ? "Recorded findings included at least one meaningful concern or uncertainty."
      : "Multiple high-impact concerns were recorded, increasing downside risk.",
    unsureCount > 0
      ? "Uncertainty here comes only from items you marked as ‘unsure’."
      : "No items were marked as ‘unsure’, so certainty is based on recorded observations.",
    completenessScore >= 75
      ? "You captured strong coverage, which supports the confidence score."
      : completenessScore >= 55
      ? "Coverage was moderate; confidence reflects that."
      : "Coverage was limited; confidence reflects that.",
    concernCount > 0
      ? "Your recorded ‘something off’ items contribute to negotiation pressure."
      : "No check items were marked ‘something off’ in what you recorded.",
  ];

  const whyThisVerdict = whyThisVerdictBullets.join(" ");

  /* -----------------------------
     Risk weighting explanation (string + bullets)
  ----------------------------- */
  const riskWeightingBullets: string[] = [];

  if (criticalCount > 0) {
    riskWeightingBullets.push(
      criticalCount === 1
        ? "A high-impact concern was recorded and weighted heavily."
        : `${criticalCount} high-impact concerns were recorded and weighted heavily.`
    );
  } else if (moderateCount > 0) {
    riskWeightingBullets.push(
      moderateCount === 1
        ? "A meaningful concern was recorded and weighted moderately."
        : `${moderateCount} meaningful concerns were recorded and weighted moderately.`
    );
  } else {
    riskWeightingBullets.push(
      "No major concerns were recorded in the inspection you captured."
    );
  }

  if (unsureCount > 0) {
    riskWeightingBullets.push(
      unsureCount === 1
        ? "One item was explicitly marked ‘unsure’, which lowers certainty."
        : `${unsureCount} items were explicitly marked ‘unsure’, which lowers certainty.`
    );
  } else {
    riskWeightingBullets.push(
      "No items were marked ‘unsure’, so certainty is based on recorded observations."
    );
  }

  if (completenessScore >= 80) {
    riskWeightingBullets.push(
      "Coverage is strong — you captured most of the key checks and baseline photos."
    );
  } else if (completenessScore >= 60) {
    riskWeightingBullets.push(
      "Coverage is moderate — enough to guide a decision posture, but not enough to be definitive."
    );
  } else if (completenessScore >= 40) {
    riskWeightingBullets.push(
      "Coverage is limited — the result is still useful, but it should be treated as provisional until more is recorded."
    );
  } else {
    riskWeightingBullets.push(
      "Coverage is very limited — capture a few more checks/photos to make the report meaningfully stronger."
    );
  }

  if (confidenceScore >= 80) {
    riskWeightingBullets.push(
      "High confidence means you captured strong coverage and recorded enough evidence for the posture to be reliable."
    );
  } else if (confidenceScore >= 60) {
    riskWeightingBullets.push(
      "Moderate confidence means the posture is reasonable, but there are a few unknowns or gaps worth verifying."
    );
  } else if (confidenceScore >= 40) {
    riskWeightingBullets.push(
      "Lower confidence means there are gaps or unknowns that reduce certainty. Clarifying key items will improve the outcome."
    );
  } else {
    riskWeightingBullets.push(
      "Very low confidence means too much is unknown. Treat this as a prompt to verify key items before deciding."
    );
  }

  if (verdict === "walk-away") {
    riskWeightingBullets.push(
      "This posture is intentionally buyer-safe: unresolved high-impact items can create expensive regret."
    );
  } else if (verdict === "caution") {
    riskWeightingBullets.push(
      "This posture is buyer-safe: clarify the recorded items first, then decide with confidence."
    );
  } else {
    riskWeightingBullets.push(
      "This posture is buyer-safe: proceed normally, but still confirm paperwork and service history."
    );
  }

  const riskWeightingExplanation = riskWeightingBullets.join(" ");

  /* -----------------------------
     Uncertainty factors
  ----------------------------- */
  const uncertaintyFactors: UncertaintyFactor[] =
    unsureCount > 0
      ? [
          {
            label:
              unsureCount === 1
                ? "One inspection item was marked ‘unsure’"
                : `${unsureCount} inspection items were marked ‘unsure’`,
            impact: "moderate",
            source: "user_marked_unsure",
          },
        ]
      : [];

  /* -----------------------------
     Counterfactuals
  ----------------------------- */
  const counterfactuals: string[] = [];

  if (unsureCount > 0) {
    counterfactuals.push(
      "Clarifying the items marked ‘unsure’ would increase confidence without changing what was observed."
    );
  }

  if (verdict === "caution") {
    counterfactuals.push(
      "Clear evidence that the recorded concerns are resolved (e.g., documented repairs) would likely improve the outcome."
    );
  }

  if (verdict === "walk-away") {
    counterfactuals.push(
      "Only strong, independent evidence resolving the recorded high-impact concerns would justify reassessing this verdict."
    );
  }

  counterfactuals.push(
    "A longer test drive (where safe and permitted) can help confirm whether any recorded behaviour is repeatable."
  );

  /* -----------------------------
     Buyer context interpretation (typed correctly)
  ----------------------------- */
  const buyerContextInterpretation: BuyerContextInterpretation[] =
    verdict === "proceed"
      ? [
          {
            buyerType: "risk-averse",
            guidance:
              "This profile looks acceptable based on what you recorded, but still request service records and a final confirmation drive.",
          },
          {
            buyerType: "practical",
            guidance:
              "Based on recorded observations, this looks like a reasonable candidate to proceed with at the right price.",
          },
          {
            buyerType: "short-term",
            guidance:
              "If you plan to keep the car briefly, ensure no recorded items would affect immediate usability or resale.",
          },
        ]
      : verdict === "caution"
      ? [
          {
            buyerType: "risk-averse",
            guidance:
              "Clarify the recorded concerns (and any items marked ‘unsure’) before committing. Avoid rushing.",
          },
          {
            buyerType: "practical",
            guidance:
              "Proceed only if the recorded concerns are explainable and priced in. Use the report to frame clarifying questions.",
          },
          {
            buyerType: "short-term",
            guidance:
              "Be cautious of anything that could impact resale or immediate reliability unless you’re getting a strong price adjustment.",
          },
        ]
      : [
          {
            buyerType: "risk-averse",
            guidance:
              "Walking away is reasonable. The recorded profile carries meaningful downside risk.",
          },
          {
            buyerType: "practical",
            guidance:
              "Only proceed if the seller provides strong evidence addressing the recorded high-impact items and the price reflects the remaining risk.",
          },
          {
            buyerType: "short-term",
            guidance:
              "High-risk profiles are rarely worth it short-term unless the purchase price is exceptionally low and evidence is strong.",
          },
        ];

  return {
    verdict,
    verdictReason,
    whyThisVerdict,
    whyThisVerdictBullets,
    riskWeightingExplanation,
    riskWeightingBullets,
    uncertaintyFactors,
    counterfactuals,
    buyerContextInterpretation,
  };
}
