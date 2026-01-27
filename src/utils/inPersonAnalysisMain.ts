// src/utils/inPersonAnalysisMain.ts

import type {
  ScanProgress,
  AnalysisResult,
  CheckAnswer,
  RiskItem,
  NegotiationPositioning,
  NegotiationLeverageGroup,
  PriceGuidance,
} from "./inPersonAnalysisTypes";

import { clamp, hasNote, dedupeImperfections, isRecord } from "./inPersonAnalysisHelpers";
import { buildRisks } from "./inPersonAnalysisRisks";
import { buildEvidenceSummary } from "./inPersonAnalysisEvidence";
import { buildVerdict } from "./inPersonAnalysisVerdict";

/* =========================================================
   Coverage definitions (main orchestrator)
========================================================= */

const REQUIRED_PHOTO_STEP_IDS = [
  "exterior-front",
  "exterior-side-left",
  "exterior-rear",
  "exterior-side-right",
];

const KEY_CHECK_IDS = [
  // Around
  "body-panels-paint",
  "headlights-condition",
  "windscreen-damage",
  "tyre-wear",
  "brakes-visible",

  // Cabin
  "interior-smell",
  "interior-condition",
  "seatbelts-trim",
  "aircon",

  // Drive
  "steering",
  "noise-hesitation",
  "adas-systems",

  // Legacy
  "body-panels",
  "paint",
  "glass-lights",
  "tyres",
  "underbody-leaks",
];

const DEFAULT_FILL_CHECK_IDS = [...new Set(KEY_CHECK_IDS)];

/* =========================================================
   Default-fill checks (buyer-safe)
========================================================= */

function withDefaultFilledChecks(
  raw: Record<string, CheckAnswer> | undefined | null
): Record<string, CheckAnswer> {
  const base: Record<string, CheckAnswer> = isRecord(raw) ? (raw as any) : {};
  const next: Record<string, CheckAnswer> = { ...base };

  for (const id of DEFAULT_FILL_CHECK_IDS) {
    const existing = next[id];
    if (!existing || !existing.value) {
      next[id] = { ...(existing ?? {}), value: "ok" };
    }
  }

  return next;
}

/* =========================================================
   Negotiation positioning (simple + stable)
========================================================= */

function rangeFromScore(score: number) {
  const s = clamp(score, 0, 25);
  const low = Math.round(clamp(120 + s * 90, 120, 2600));
  const high = Math.round(clamp(380 + s * 170, 380, 6200));
  return { low, high: Math.max(high, low + 150) };
}

function bandLabel(score: number) {
  if (score < 3) return "Very light";
  if (score < 7) return "Light";
  if (score < 12) return "Moderate";
  if (score < 18) return "Strong";
  return "Very strong";
}

function bandRationale(args: {
  stance: "conservative" | "balanced" | "aggressive";
  criticalCount: number;
  moderateCount: number;
  unsureCount: number;
  completenessScore: number;
}) {
  const { stance, criticalCount, moderateCount, unsureCount, completenessScore } = args;

  const parts: string[] = [];

  if (criticalCount > 0) {
    parts.push(
      criticalCount === 1
        ? "A high-impact concern was recorded."
        : `${criticalCount} high-impact concerns were recorded.`
    );
  } else if (moderateCount > 0) {
    parts.push(
      moderateCount === 1
        ? "A meaningful concern was recorded."
        : `${moderateCount} meaningful concerns were recorded.`
    );
  } else {
    parts.push("No major concerns were recorded.");
  }

  if (unsureCount > 0) {
    parts.push(
      unsureCount === 1
        ? "One item was marked unsure."
        : `${unsureCount} items were marked unsure.`
    );
  }

  if (completenessScore < 55) parts.push("Overall evidence coverage is limited.");
  else if (completenessScore < 75) parts.push("Evidence coverage is moderate.");
  else parts.push("Evidence coverage is strong.");

  if (stance === "conservative") parts.push("Use this range if you want minimal friction.");
  else if (stance === "aggressive") parts.push("Use this range only if you’re prepared to walk away.");
  else parts.push("This is a reasonable middle-ground position.");

  return parts.join(" ");
}

/* =========================================================
   Main orchestrator
========================================================= */

export function analyseInPersonInspectionMain(progress: ScanProgress): AnalysisResult {
  const rawChecks = (progress?.checks ?? {}) as Record<string, CheckAnswer>;
  const effectiveChecks = withDefaultFilledChecks(rawChecks);

  const photos = Array.isArray(progress?.photos) ? progress.photos : [];
  const followUps = Array.isArray(progress?.followUpPhotos) ? progress.followUpPhotos : [];

  const imperfectionsRaw = Array.isArray(progress?.imperfections) ? progress.imperfections : [];
  const imperfections = dedupeImperfections(imperfectionsRaw);

  /* -----------------------------
     Photo coverage
  ----------------------------- */
  const photoSteps = new Set(photos.map((p) => p.stepId));
  const photosCapturedBaseline = REQUIRED_PHOTO_STEP_IDS.filter((id) => photoSteps.has(id)).length;

  const photoCoverage =
    REQUIRED_PHOTO_STEP_IDS.length > 0
      ? photosCapturedBaseline / REQUIRED_PHOTO_STEP_IDS.length
      : 0;

  /* -----------------------------
     Check coverage (truthful: RAW)
  ----------------------------- */
  const answeredKeyChecks = KEY_CHECK_IDS.filter((id) => rawChecks[id]?.value).length;

  const checkCoverage =
    KEY_CHECK_IDS.length > 0 ? answeredKeyChecks / KEY_CHECK_IDS.length : 0;

  /* -----------------------------
     Completeness score (truthful)
  ----------------------------- */
  const completenessScore = Math.round(
    clamp(photoCoverage * 55 + checkCoverage * 40 + (followUps.length ? 5 : 0), 0, 100)
  );

  /* -----------------------------
     Confidence score (truthful: RAW)
  ----------------------------- */
  const rawValues = Object.values(rawChecks);
  const concernCount = rawValues.filter((v) => v?.value === "concern").length;
  const unsureCount = rawValues.filter((v) => v?.value === "unsure").length;

  const concernWithNotes = rawValues.filter(
    (v) => v?.value === "concern" && hasNote(v.note)
  ).length;

  let confidenceScore =
    32 +
    completenessScore * 0.68 -
    unsureCount * 5 +
    concernWithNotes * 1.5;

  confidenceScore = clamp(Math.round(confidenceScore), 0, 100);

  /* -----------------------------
     Risks
  ----------------------------- */
  const risks: RiskItem[] = buildRisks({
    rawChecks,
    effectiveChecks,
    imperfections,
    photosCapturedBaseline,
    requiredPhotoCount: REQUIRED_PHOTO_STEP_IDS.length,
  });

  /* -----------------------------
     Evidence summary (UI-ready)
  ----------------------------- */
  const evidenceSummary = buildEvidenceSummary({
    rawChecks,
    imperfections,
    photos,
    followUps,
    keyChecksExpected: KEY_CHECK_IDS.length,
    photosExpected: REQUIRED_PHOTO_STEP_IDS.length,
  });

  /* -----------------------------
     Verdict + reasoning outputs
  ----------------------------- */
  const verdictPack = buildVerdict({
    risks,
    concernCount,
    unsureCount,
    completenessScore,
    confidenceScore,
  });

  /* -----------------------------
     Negotiation leverage (simple, stable)
  ----------------------------- */
  const negotiationLeverage: NegotiationLeverageGroup[] = [
    {
      category: "Evidence-based leverage",
      points: risks
        .filter((r) => r.severity !== "info")
        .map((r) => `• ${r.label}: ${r.explanation}`),
    },
  ];

  if (negotiationLeverage[0].points.length === 0) {
    negotiationLeverage[0].points.push(
      "• Confirm service history, ownership, and any recent repairs."
    );
  }

  /* -----------------------------
     Negotiation positioning (simple)
  ----------------------------- */
  const criticalCount = risks.filter((r) => r.severity === "critical").length;
  const moderateCount = risks.filter((r) => r.severity === "moderate").length;

  const uncertaintyPenalty = clamp(100 - confidenceScore, 0, 100);
  const pressureScore =
    criticalCount * 4.8 +
    moderateCount * 2.2 +
    concernCount * 1.2 +
    unsureCount * 2.0 +
    (uncertaintyPenalty / 100) * 6;

  const base = rangeFromScore(pressureScore);

  const negotiationPositioning: NegotiationPositioning = {
    conservative: {
      audLow: clamp(Math.round(base.low * 0.7), 100, 999999),
      audHigh: clamp(Math.round(base.high * 0.7), 250, 999999),
      label: `${bandLabel(pressureScore)} positioning`,
      rationale: bandRationale({
        stance: "conservative",
        criticalCount,
        moderateCount,
        unsureCount,
        completenessScore,
      }),
    },
    balanced: {
      audLow: clamp(base.low, 120, 999999),
      audHigh: clamp(base.high, 380, 999999),
      label: `${bandLabel(pressureScore)} positioning`,
      rationale: bandRationale({
        stance: "balanced",
        criticalCount,
        moderateCount,
        unsureCount,
        completenessScore,
      }),
    },
    aggressive: {
      audLow: clamp(Math.round(base.low * 1.35), 150, 999999),
      audHigh: clamp(Math.round(base.high * 1.35), 520, 999999),
      label: `${bandLabel(pressureScore)} positioning`,
      rationale: bandRationale({
        stance: "aggressive",
        criticalCount,
        moderateCount,
        unsureCount,
        completenessScore,
      }),
    },
  };

  /* -----------------------------
     Inferred signals
  ----------------------------- */
  const adasPresentButDisabled =
    rawChecks["adas-systems"]?.value != null && rawChecks["adas-systems"]?.value !== "ok";

  /* -----------------------------
     Price guidance placeholder (parallel analysis)
  ----------------------------- */
  const priceGuidance: PriceGuidance = {
    askingPriceAud: null,
    adjustedPriceLowAud: null,
    adjustedPriceHighAud: null,
    suggestedReductionLowAud: null,
    suggestedReductionHighAud: null,
    disclaimer: "Price guidance not yet enabled in the parallel analysis.",
    rationale: [],
  };

  return {
    verdict: verdictPack.verdict,
    verdictReason: verdictPack.verdictReason,

    confidenceScore,
    completenessScore,

    risks,

    negotiationLeverage,
    negotiationPositioning,

    whyThisVerdict: verdictPack.whyThisVerdict,
    whyThisVerdictBullets: verdictPack.whyThisVerdictBullets,

    evidenceSummary,

    riskWeightingExplanation: verdictPack.riskWeightingExplanation,
    riskWeightingBullets: verdictPack.riskWeightingBullets,

    uncertaintyFactors: verdictPack.uncertaintyFactors,
    counterfactuals: verdictPack.counterfactuals,
    buyerContextInterpretation: verdictPack.buyerContextInterpretation,

    inferredSignals: {
      adasPresentButDisabled,
      confidence: adasPresentButDisabled ? 50 : 10,
    },

    priceGuidance,
  };
}
