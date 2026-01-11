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

export type AnalysisResult = {
  verdict: "proceed" | "caution" | "walk-away";
  verdictReason: string;
  confidenceScore: number;
  completenessScore: number;
  risks: RiskItem[];
  negotiationLeverage: NegotiationLeverageGroup[];
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

/* =========================================================
   Coverage definitions (NOW USED)
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
  "underbody-leaks",
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

/* =========================================================
   Main analysis
========================================================= */

export function analyseInPersonInspection(
  progress: ScanProgress
): AnalysisResult {
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
     CHECK COVERAGE (THIS USES KEY_CHECK_IDS)
  ----------------------------- */
  const answeredKeyChecks = KEY_CHECK_IDS.filter(
    (id) => checks[id]?.value
  ).length;

  const checkCoverage =
    KEY_CHECK_IDS.length > 0
      ? answeredKeyChecks / KEY_CHECK_IDS.length
      : 0;

  /* -----------------------------
     COMPLETENESS SCORE
  ----------------------------- */
  const completenessScore = Math.round(
    clamp(photoCoverage * 55 + checkCoverage * 40 + (followUps.length ? 5 : 0), 0, 100)
  );

  /* -----------------------------
     CONFIDENCE SCORE
  ----------------------------- */
  const values = Object.values(checks);
  const concernCount = values.filter((v) => v?.value === "concern").length;
  const unsureCount = values.filter((v) => v?.value === "unsure").length;
  const weakNotes = values.filter(
    (v) => v?.value === "concern" && !hasNote(v.note)
  ).length;

  let confidence =
    30 +
    completenessScore * 0.7 -
    unsureCount * 4 -
    weakNotes * 3;

  confidence = clamp(Math.round(confidence), 0, 100);

  /* -----------------------------
     RISKS
  ----------------------------- */
  const risks: RiskItem[] = [];

  if (photosCaptured < REQUIRED_PHOTO_STEP_IDS.length) {
    risks.push({
      id: "missing-photos",
      label: "Some exterior photos are missing",
      explanation:
        "Not all baseline exterior angles were captured. This limits confidence and negotiation leverage.",
      severity: "moderate",
    });
  }

  if (unsureCount >= 3) {
    risks.push({
      id: "many-unknowns",
      label: "Several checks couldn’t be completed",
      explanation:
        "Multiple items were marked as ‘unsure’. These unknowns can hide expensive issues.",
      severity: "moderate",
    });
  }

  imperfections.forEach((i) => {
    if (i.severity === "major") {
      risks.push({
        id: `imp-${i.id}`,
        label: "Major defect recorded",
        explanation:
          i.note ||
          "A major defect was recorded and should be resolved or priced in before proceeding.",
        severity: "critical",
      });
    }
  });

  /* -----------------------------
     SPECIFIC HIGH-SIGNAL CONCERNS
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
    "Engine or drivetrain behaviour stood out",
    "Hesitation or unusual noises can indicate drivetrain issues. Clarify cold-start behaviour and recent repairs.",
    "critical"
  );

  pushConcern(
    "steering",
    "Steering or handling concern",
    "Steering issues can indicate alignment, suspension wear, or prior accident damage.",
    "critical"
  );

  pushConcern(
    "adas-systems",
    "Driver-assist systems may not be working correctly",
    "If fitted, systems like blind-spot monitoring or adaptive cruise should behave predictably.",
    "moderate"
  );

  /* -----------------------------
     VERDICT
  ----------------------------- */
  const criticalCount = risks.filter((r) => r.severity === "critical").length;
  const score =
    concernCount * 2 +
    criticalCount * 4 +
    imperfections.reduce((s, i) => s + severityWeight(i.severity), 0);

  let verdict: AnalysisResult["verdict"] = "proceed";
  if (criticalCount >= 2 || score >= 14) verdict = "walk-away";
  else if (criticalCount >= 1 || score >= 7) verdict = "caution";

  let verdictReason =
    verdict === "proceed"
      ? "No major red flags were detected from what was recorded."
      : verdict === "caution"
      ? "A few meaningful concerns are worth clarifying before committing."
      : "Multiple high-impact concerns were identified.";

  /* -----------------------------
     NEGOTIATION LEVERAGE
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
     ADAS INFERENCE (NO UI)
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
    inferredSignals: {
      adasPresentButDisabled,
      confidence: adasPresentButDisabled ? 70 : 10,
    },
  };
}
