// src/utils/inPersonAnalysis.ts

import type { ScanProgress } from "./scanProgress";

/* =========================================================
   Types
========================================================= */

export type Verdict = "proceed" | "caution" | "walk-away";

export type RiskSignal = {
  id: string;
  label: string;
  severity: "info" | "moderate" | "high";
  explanation: string;
};

export type AnalysisResult = {
  completenessScore: number;
  confidenceScore: number;
  verdict: Verdict;
  verdictReason: string;
  risks: RiskSignal[];
  inferredSignals: {
    adasLikelyDisabled: boolean;
    confidence: number;
  };
};

/* =========================================================
   Constants
========================================================= */

const REQUIRED_PHOTO_STEPS = [
  "exterior-front",
  "exterior-side-left",
  "exterior-rear",
  "exterior-side-right",
];

const ADAS_RELATED_CHECKS = [
  "adas-lane-keep",
  "adas-blind-spot",
  "adas-adaptive-cruise",
  "adas-collision-warning",
];

/* =========================================================
   Main analysis
========================================================= */

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

  const checkValues = Object.values(checks);
  const answeredChecks = checkValues.filter(
    (c) => typeof c?.value === "string"
  ).length;

  const checkCompleteness =
    checkValues.length === 0
      ? 0
      : (answeredChecks / checkValues.length) * 100;

  const completenessScore = Math.round(
    photoCompleteness * 0.6 + checkCompleteness * 0.4
  );

  /* =========================
     CONFIDENCE
  ========================== */

  const concerns = checkValues.filter(
    (c) => c?.value === "concern"
  ).length;

  const unsure = checkValues.filter(
    (c) => c?.value === "unsure"
  ).length;

  let confidenceScore = 100;
  confidenceScore -= concerns * 8;
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
     ADAS INFERENCE (no UI)
  ========================== */

  const adasChecksPresent = ADAS_RELATED_CHECKS.some(
    (id) => checks[id]
  );

  const adasNegativeSignals = ADAS_RELATED_CHECKS.filter(
    (id) =>
      checks[id]?.value === "concern" ||
      checks[id]?.value === "unsure"
  ).length;

  const adasLikelyDisabled =
    adasChecksPresent && adasNegativeSignals >= 2;

  const adasConfidence = adasChecksPresent
    ? Math.max(40, 100 - adasNegativeSignals * 20)
    : 0;

  if (adasLikelyDisabled) {
    risks.push({
      id: "adas-disabled",
      label: "Driver assistance systems may be disabled",
      severity: "info",
      explanation:
        "Some driver assistance features appear unavailable or inactive. This can be intentional or indicate a fault.",
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
     RETURN
  ========================== */

  return {
    completenessScore,
    confidenceScore,
    verdict,
    verdictReason,
    risks,
    inferredSignals: {
      adasLikelyDisabled,
      confidence: adasConfidence,
    },
  };
}
