// src/utils/inPersonAnalysis.ts

export type AnswerValue = "ok" | "concern" | "unsure";

export type CheckAnswer = {
  value: AnswerValue;
  note?: string;
};

export type ScanProgress = {
  type?: string;
  scanId?: string;
  step?: string;

  checks?: Record<string, CheckAnswer>;
  photos?: Array<{ id: string; dataUrl: string; stepId: string }>;
  followUpPhotos?: Array<{ id: string; dataUrl: string; note?: string }>;
  imperfections?: Array<{
    id: string;
    label?: string;
    severity?: "minor" | "moderate" | "major";
    location?: string;
    note?: string;
  }>;
};

export type RiskItem = {
  id: string;
  label: string;
  explanation: string;
  severity: "info" | "moderate" | "critical";
};

export type NegotiationLeverageGroup = {
  category: string;
  points: string[];
};

export type NegotiationBand = {
  audLow: number;
  audHigh: number;
  label: string;
  rationale: string;
};

export type NegotiationPositioning = {
  conservative: NegotiationBand;
  balanced: NegotiationBand;
  aggressive: NegotiationBand;
};

export type EvidenceSummary = {
  photosCaptured: number;
  photosExpected: number;
  checksCompleted: number;
  keyChecksExpected: number;
  imperfectionsNoted: number;
  followUpPhotosCaptured: number;
  explicitlyUncertainItems: string[];
};

export type UncertaintyFactor = {
  label: string;
  impact: "low" | "moderate";
  source: "user_marked_unsure";
};

export type BuyerContextInterpretation = {
  buyerType: "risk-averse" | "practical" | "short-term";
  guidance: string;
};

export type AnalysisResult = {
  verdict: "proceed" | "caution" | "walk-away";
  verdictReason: string;

  confidenceScore: number;
  completenessScore: number;

  risks: RiskItem[];

  // Existing + legacy-friendly
  negotiationLeverage: NegotiationLeverageGroup[];

  // Newer, richer outputs used by report / results
  negotiationPositioning: NegotiationPositioning;
  whyThisVerdict: string[];

  // Explicit reasoning (non-magical)
  evidenceSummary: EvidenceSummary;
  riskWeightingExplanation: string[];
  uncertaintyFactors: UncertaintyFactor[];
  counterfactuals: string[];
  buyerContextInterpretation: BuyerContextInterpretation[];

  inferredSignals: {
    adasPresentButDisabled: boolean;
    confidence: number;
  };
};

/* =========================================================
   Helpers
========================================================= */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hasNote(note?: string) {
  return (note ?? "").trim().length >= 5;
}

function severityWeight(sev?: string) {
  if (sev === "major") return 3;
  if (sev === "moderate") return 2;
  return 1;
}

function titleFromId(id: string) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

/* =========================================================
   Coverage definitions
========================================================= */

const REQUIRED_PHOTO_STEP_IDS = [
  "exterior-front",
  "exterior-side-left",
  "exterior-rear",
  "exterior-side-right",
];

const KEY_CHECK_IDS = [
  // Around car
  "body-panels",
  "paint",
  "glass-lights",
  "tyres",
  "underbody-leaks", // NOTE: kept as an ID for backward compatibility ONLY (no “underbody” guidance is generated)
  // Cabin
  "interior-smell",
  "interior-condition",
  "aircon",
  // Drive
  "steering",
  "noise-hesitation",
  // ADAS
  "adas-systems",
];

const CHECK_LABELS: Record<string, string> = {
  "body-panels": "Body panels & alignment",
  paint: "Paint condition",
  "glass-lights": "Glass & lights",
  tyres: "Tyres condition",
  "underbody-leaks": "Visible fluid leaks (if noticed)",
  "interior-smell": "Interior smell",
  "interior-condition": "Interior condition",
  aircon: "Air conditioning",
  steering: "Steering & handling feel",
  "noise-hesitation": "Noise / hesitation under power",
  "adas-systems": "Driver-assist systems (if fitted)",
};

function labelForCheckId(id: string) {
  return CHECK_LABELS[id] || titleFromId(id);
}

/* =========================================================
   Negotiation positioning helpers
========================================================= */

function rangeFromScore(score: number) {
  // Converts an abstract “pressure” score into a sensible AUD allowance band.
  // This is intentionally conservative and buyer-safe (not a valuation).
  const s = clamp(score, 0, 25);

  // Base ranges (AUD)
  const low = Math.round(clamp(120 + s * 90, 120, 2600));
  const high = Math.round(clamp(380 + s * 170, 380, 6200));

  // Keep high >= low
  return { low, high: Math.max(high, low + 150) };
}

function bandLabel(score: number) {
  if (score < 3) return "Very light";
  if (score < 7) return "Light";
  if (score < 12) return "Moderate";
  if (score < 18) return "Strong";
  return "Very strong";
}

function bandRationale(
  stance: "conservative" | "balanced" | "aggressive",
  facts: {
    criticalCount: number;
    moderateCount: number;
    unsureCount: number;
    completenessScore: number;
  }
) {
  const parts: string[] = [];

  if (facts.criticalCount > 0) {
    parts.push(
      facts.criticalCount === 1
        ? "A high-impact concern was recorded."
        : `${facts.criticalCount} high-impact concerns were recorded.`
    );
  } else if (facts.moderateCount > 0) {
    parts.push(
      facts.moderateCount === 1
        ? "A meaningful concern was recorded."
        : `${facts.moderateCount} meaningful concerns were recorded.`
    );
  } else {
    parts.push("No major concerns were recorded.");
  }

  if (facts.unsureCount > 0) {
    parts.push(
      facts.unsureCount === 1
        ? "One item was marked unsure."
        : `${facts.unsureCount} items were marked unsure.`
    );
  }

  if (facts.completenessScore < 55) {
    parts.push("Overall evidence coverage is limited.");
  } else if (facts.completenessScore < 75) {
    parts.push("Evidence coverage is moderate.");
  } else {
    parts.push("Evidence coverage is strong.");
  }

  if (stance === "conservative") {
    parts.push("Use this range if you want minimal friction.");
  } else if (stance === "aggressive") {
    parts.push("Use this range only if you’re prepared to walk away.");
  } else {
    parts.push("This is a reasonable middle-ground position.");
  }

  return parts.join(" ");
}

/* =========================================================
   Main analysis
========================================================= */

export function analyseInPersonInspection(progress: ScanProgress): AnalysisResult {
  const checks = progress.checks ?? {};
  const photos = progress.photos ?? [];
  const followUps = progress.followUpPhotos ?? [];
  const imperfections = progress.imperfections ?? [];

  /* -----------------------------
     PHOTO COVERAGE
  ----------------------------- */
  const photoSteps = new Set(photos.map((p) => p.stepId));
  const photosCaptured = REQUIRED_PHOTO_STEP_IDS.filter((id) =>
    photoSteps.has(id)
  ).length;

  const photoCoverage =
    REQUIRED_PHOTO_STEP_IDS.length > 0
      ? photosCaptured / REQUIRED_PHOTO_STEP_IDS.length
      : 0;

  /* -----------------------------
     CHECK COVERAGE
  ----------------------------- */
  const answeredKeyChecks = KEY_CHECK_IDS.filter((id) => checks[id]?.value)
    .length;

  const checkCoverage =
    KEY_CHECK_IDS.length > 0 ? answeredKeyChecks / KEY_CHECK_IDS.length : 0;

  /* -----------------------------
     COMPLETENESS SCORE
  ----------------------------- */
  const completenessScore = Math.round(
    clamp(
      photoCoverage * 55 + checkCoverage * 40 + (followUps.length ? 5 : 0),
      0,
      100
    )
  );

  /* -----------------------------
     CONFIDENCE SCORE (buyer-safe)
     IMPORTANT: We only reduce confidence based on explicit buyer uncertainty (“unsure”),
     not because a user didn’t do advanced checks.
  ----------------------------- */
  const values = Object.values(checks);
  const concernCount = values.filter((v) => v?.value === "concern").length;
  const unsureCount = values.filter((v) => v?.value === "unsure").length;

  // Notes improve interpretability when a concern exists, but we do NOT treat missing notes as “uncertainty”.
  const concernWithNotes = values.filter(
    (v) => v?.value === "concern" && hasNote(v.note)
  ).length;

  let confidence =
    32 +
    completenessScore * 0.68 -
    unsureCount * 5 +
    concernWithNotes * 1.5;

  confidence = clamp(Math.round(confidence), 0, 100);

  /* -----------------------------
     RISKS
  ----------------------------- */
  const risks: RiskItem[] = [];

  // Missing baseline photos reduces strength of evidence (not a “fault” claim).
  if (photosCaptured < REQUIRED_PHOTO_STEP_IDS.length) {
    risks.push({
      id: "missing-photos",
      label: "Some baseline exterior photos are missing",
      explanation:
        "Not all exterior angles were captured. This reduces how confidently the report can reflect what was observed.",
      severity: "moderate",
    });
  }

  // Explicit buyer uncertainty
  if (unsureCount >= 3) {
    risks.push({
      id: "many-unknowns",
      label: "Several items were marked as unsure",
      explanation:
        "Multiple checks were marked ‘unsure’. This doesn’t imply a problem — it simply limits certainty until clarified.",
      severity: "moderate",
    });
  }

  imperfections.forEach((i) => {
    if (i.severity === "major") {
      risks.push({
        id: `imp-${i.id}`,
        label: i.label ? `Major observation: ${i.label}` : "Major observation recorded",
        explanation:
          i.note ||
          "A major observation was recorded. Clarify details and pricing impact before proceeding.",
        severity: "critical",
      });
    } else if (i.severity === "moderate") {
      risks.push({
        id: `imp-${i.id}`,
        label: i.label ? `Observation: ${i.label}` : "Moderate observation recorded",
        explanation:
          i.note ||
          "A moderate observation was recorded. It may influence negotiation depending on severity and buyer preference.",
        severity: "moderate",
      });
    }
  });

  /* -----------------------------
     SPECIFIC HIGH-SIGNAL CONCERNS
     (Only when buyer explicitly marked “concern”)
  ----------------------------- */
  const pushConcern = (
    id: string,
    label: string,
    explanation: string,
    severity: RiskItem["severity"]
  ) => {
    if (checks[id]?.value === "concern") {
      risks.push({
        id: `check-${id}`,
        label,
        explanation,
        severity,
      });
    }
  };

  pushConcern(
    "noise-hesitation",
    "Engine / drivetrain behaviour stood out",
    "Unusual hesitation or noises during a drive can be meaningful. Ask what recent repairs were done and whether the behaviour is consistent from cold start.",
    "critical"
  );

  pushConcern(
    "steering",
    "Steering or handling concern",
    "If steering feel or handling stood out, clarify alignment history, tyre wear patterns, and any recent suspension work.",
    "critical"
  );

  pushConcern(
    "adas-systems",
    "Driver-assist systems may not be behaving predictably",
    "If fitted, systems like lane-keep, adaptive cruise, and parking sensors should behave consistently with no warnings.",
    "moderate"
  );

  pushConcern(
    "underbody-leaks",
    "Possible fluid leak was noticed",
    "If you noticed any fluid marks or drips, ask what it was and whether it has been inspected or repaired recently.",
    "critical"
  );

  /* -----------------------------
     VERDICT (based on recorded observations)
  ----------------------------- */
  const criticalCount = risks.filter((r) => r.severity === "critical").length;
  const moderateCount = risks.filter((r) => r.severity === "moderate").length;

  const imperfectionScore = imperfections.reduce(
    (s, i) => s + severityWeight(i.severity),
    0
  );

  const score =
    concernCount * 2 +
    criticalCount * 4 +
    moderateCount * 1.5 +
    unsureCount * 1.5 +
    imperfectionScore;

  let verdict: AnalysisResult["verdict"] = "proceed";
  if (criticalCount >= 2 || score >= 16) verdict = "walk-away";
  else if (criticalCount >= 1 || score >= 8) verdict = "caution";

  const verdictReason =
    verdict === "proceed"
      ? "No major red flags were recorded in the inspection you captured."
      : verdict === "caution"
      ? "One or more meaningful concerns (or uncertainties) were recorded — clarifying them would materially improve confidence."
      : "Multiple high-impact concerns were recorded — walking away is a reasonable option unless evidence strongly improves the picture.";

  /* -----------------------------
     NEGOTIATION LEVERAGE (legacy-friendly)
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
     NEGOTIATION POSITIONING (AUD ranges, buyer-safe)
     - Not a valuation
     - Not a repair quote
     - Derived from recorded concerns + explicit uncertainty + evidence strength
  ----------------------------- */
  const uncertaintyPenalty = clamp(100 - confidence, 0, 100);
  const pressureScore =
    criticalCount * 4.8 +
    moderateCount * 2.2 +
    concernCount * 1.2 +
    unsureCount * 2.0 +
    (uncertaintyPenalty / 100) * 6;

  const base = rangeFromScore(pressureScore);

  const conservativeLow = Math.round(base.low * 0.7);
  const conservativeHigh = Math.round(base.high * 0.7);

  const balancedLow = base.low;
  const balancedHigh = base.high;

  const aggressiveLow = Math.round(base.low * 1.35);
  const aggressiveHigh = Math.round(base.high * 1.35);

  const negotiationPositioning: NegotiationPositioning = {
    conservative: {
      audLow: clamp(conservativeLow, 100, 999999),
      audHigh: clamp(conservativeHigh, 250, 999999),
      label: `${bandLabel(pressureScore)} positioning`,
      rationale: bandRationale("conservative", {
        criticalCount,
        moderateCount,
        unsureCount,
        completenessScore,
      }),
    },
    balanced: {
      audLow: clamp(balancedLow, 120, 999999),
      audHigh: clamp(balancedHigh, 380, 999999),
      label: `${bandLabel(pressureScore)} positioning`,
      rationale: bandRationale("balanced", {
        criticalCount,
        moderateCount,
        unsureCount,
        completenessScore,
      }),
    },
    aggressive: {
      audLow: clamp(aggressiveLow, 150, 999999),
      audHigh: clamp(aggressiveHigh, 520, 999999),
      label: `${bandLabel(pressureScore)} positioning`,
      rationale: bandRationale("aggressive", {
        criticalCount,
        moderateCount,
        unsureCount,
        completenessScore,
      }),
    },
  };

  /* -----------------------------
     EXPLICIT REASONING OUTPUTS (Option B)
     - Only recorded observations + explicit “unsure”
     - No inferred missing checks
  ----------------------------- */
  const explicitlyUncertainItems: string[] = Object.entries(checks)
    .filter(([, v]) => v?.value === "unsure")
    .map(([id, v]) => {
      const baseLabel = labelForCheckId(id);
      const note = (v?.note ?? "").trim();
      return note ? `${baseLabel} — ${note}` : baseLabel;
    });

  const evidenceSummary: EvidenceSummary = {
    photosCaptured: photos.length,
    photosExpected: REQUIRED_PHOTO_STEP_IDS.length,
    checksCompleted: Object.values(checks).filter((v) => Boolean(v?.value))
      .length,
    keyChecksExpected: KEY_CHECK_IDS.length,
    imperfectionsNoted: imperfections.length,
    followUpPhotosCaptured: followUps.length,
    explicitlyUncertainItems,
  };

  const uncertaintyFactors: UncertaintyFactor[] = explicitlyUncertainItems.map(
    (label) => ({
      label,
      impact: "moderate",
      source: "user_marked_unsure" as const,
    })
  );

  const riskWeightingExplanation: string[] = [];

  if (criticalCount > 0) {
    riskWeightingExplanation.push(
      criticalCount === 1
        ? "A high-impact concern was recorded and weighted heavily."
        : `${criticalCount} high-impact concerns were recorded and weighted heavily.`
    );
  } else if (moderateCount > 0) {
    riskWeightingExplanation.push(
      moderateCount === 1
        ? "A meaningful concern was recorded and weighted moderately."
        : `${moderateCount} meaningful concerns were recorded and weighted moderately.`
    );
  } else {
    riskWeightingExplanation.push(
      "No major concerns were recorded in the inspection you captured."
    );
  }

  if (unsureCount > 0) {
    riskWeightingExplanation.push(
      unsureCount === 1
        ? "One item was explicitly marked ‘unsure’, which lowers certainty."
        : `${unsureCount} items were explicitly marked ‘unsure’, which lowers certainty.`
    );
  }

  if (completenessScore >= 78) {
    riskWeightingExplanation.push(
      "Evidence coverage is strong, which supports higher confidence in the outcome."
    );
  } else if (completenessScore >= 55) {
    riskWeightingExplanation.push(
      "Evidence coverage is moderate, which supports a reasonable—but not absolute—confidence level."
    );
  } else {
    riskWeightingExplanation.push(
      "Evidence coverage is limited, which reduces how confidently the report can reflect what was observed."
    );
  }

  const whyThisVerdict: string[] = [
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
  ];

  const counterfactuals: string[] = [];

  if (unsureCount > 0) {
    counterfactuals.push(
      "Clarifying the items marked ‘unsure’ would increase confidence without changing what was observed."
    );
  }

  if (criticalCount === 0 && moderateCount === 0) {
    counterfactuals.push(
      "If any meaningful concern had been recorded during the drive or checks, the verdict would shift toward caution."
    );
  } else if (verdict === "caution") {
    counterfactuals.push(
      "Clear evidence that the recorded concerns are resolved (e.g., documented repairs) would likely improve the outcome."
    );
  } else if (verdict === "walk-away") {
    counterfactuals.push(
      "Only strong, independent evidence resolving the recorded high-impact concerns would justify reassessing this verdict."
    );
  }

  counterfactuals.push(
    "A longer test drive (where safe and permitted) can help confirm whether any recorded behaviour is repeatable."
  );

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

  /* -----------------------------
     ADAS INFERENCE (kept)
  ----------------------------- */
  const adas = checks["adas-systems"];
  const adasPresentButDisabled =
    adas?.value === "concern" || adas?.value === "unsure";

  return {
    verdict,
    verdictReason,
    confidenceScore: confidence,
    completenessScore,
    risks,

    negotiationLeverage,
    negotiationPositioning,

    whyThisVerdict,
    evidenceSummary,
    riskWeightingExplanation,
    uncertaintyFactors,
    counterfactuals,
    buyerContextInterpretation,

    inferredSignals: {
      adasPresentButDisabled,
      confidence: adasPresentButDisabled ? 70 : 10,
    },
  };
}
