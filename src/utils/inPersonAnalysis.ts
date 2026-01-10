import type { ScanProgress } from "./scanProgress";

export type Verdict = "proceed" | "caution" | "walk-away";

export type RiskSignal = {
  id: string;
  label: string;
  severity: "info" | "moderate" | "high";
  explanation: string;
};

export type AnalysisResult = {
  completenessScore: number; // 0–100
  confidenceScore: number; // 0–100
  verdict: Verdict;
  verdictReason: string;
  risks: RiskSignal[];
  adjustedPrice: {
    baseline: number | null;
    adjusted: number | null;
    explanation: string;
  };
  negotiationLeverage: {
    category: string;
    points: string[];
  }[];
};

const REQUIRED_PHOTO_STEPS = [
  "exterior-front",
  "exterior-side-left",
  "exterior-rear",
  "exterior-side-right",
];

export function analyseInPersonInspection(
  progress: ScanProgress
): AnalysisResult {
  const photos = progress.photos ?? [];
  const checks = progress.checks ?? {};

  /* =========================
     COMPLETENESS
  ========================== */

  const coveredSteps = new Set(photos.map((p) => p.stepId));
  const requiredCovered = REQUIRED_PHOTO_STEPS.filter((s) =>
    coveredSteps.has(s)
  ).length;

  const photoCompleteness =
    (requiredCovered / REQUIRED_PHOTO_STEPS.length) * 100;

  const checkAnswers = Object.values(checks);
  const answeredChecks = checkAnswers.filter((c) => c.value).length;
  const checkCompleteness =
    checkAnswers.length === 0
      ? 0
      : (answeredChecks / checkAnswers.length) * 100;

  const completenessScore = Math.round(
    photoCompleteness * 0.6 + checkCompleteness * 0.4
  );

  /* =========================
     CONFIDENCE
  ========================== */

  const concerns = checkAnswers.filter((c) => c.value === "concern").length;
  const unsure = checkAnswers.filter((c) => c.value === "unsure").length;

  let confidenceScore = 100;
  confidenceScore -= unsure * 6;
  confidenceScore -= (100 - completenessScore) * 0.4;
  confidenceScore = Math.max(30, Math.round(confidenceScore));

  /* =========================
     RISK SIGNALS
  ========================== */

  const risks: RiskSignal[] = [];

  if (unsure >= 3) {
    risks.push({
      id: "limited-access",
      label: "Limited inspection access",
      severity: "moderate",
      explanation:
        "Several areas couldn’t be checked, increasing uncertainty.",
    });
  }

  if (concerns >= 3) {
    risks.push({
      id: "multiple-observations",
      label: "Multiple condition observations",
      severity: "high",
      explanation:
        "Several things stood out during inspection and should be clarified.",
    });
  }

  if (requiredCovered < REQUIRED_PHOTO_STEPS.length) {
    risks.push({
      id: "incomplete-photos",
      label: "Incomplete exterior coverage",
      severity: "moderate",
      explanation:
        "Not all baseline exterior views were captured.",
    });
  }

  /* =========================
     VERDICT
  ========================== */

  let verdict: Verdict = "proceed";
  let verdictReason =
    "Based on what was visible, nothing stood out as a clear blocker.";

  if (concerns >= 4 || confidenceScore < 55) {
    verdict = "walk-away";
    verdictReason =
      "Too many uncertainties or concerns to proceed comfortably.";
  } else if (concerns >= 2 || confidenceScore < 75) {
    verdict = "caution";
    verdictReason =
      "There are some points worth resolving before committing.";
  }

  /* =========================
     PRICE ADJUSTMENT
  ========================== */

  const baseline = null; // future-safe: asking price input
  const deduction =
    concerns * 500 + unsure * 300 + (100 - confidenceScore) * 20;

  const adjusted =
    baseline != null ? Math.max(0, baseline - deduction) : null;

  /* =========================
     NEGOTIATION LEVERAGE
  ========================== */

  const negotiationLeverage = [];

  if (concerns > 0) {
    negotiationLeverage.push({
      category: "Condition observations",
      points: [
        "There were a few things that stood out during inspection",
        "I’d like to factor those into the price",
      ],
    });
  }

  if (unsure > 0) {
    negotiationLeverage.push({
      category: "Unverified areas",
      points: [
        "Some areas couldn’t be checked today",
        "That uncertainty affects how comfortable I feel",
      ],
    });
  }

  negotiationLeverage.push({
    category: "Buyer position",
    points: [
      "I’m ready to move forward if we can align on value",
      "I’m comparing this with other similar vehicles",
    ],
  });

  return {
    completenessScore,
    confidenceScore,
    verdict,
    verdictReason,
    risks,
    adjustedPrice: {
      baseline,
      adjusted,
      explanation:
        "Adjusted based on observed condition, uncertainty, and inspection confidence.",
    },
    negotiationLeverage,
  };
}
