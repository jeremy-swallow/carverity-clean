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

  // Optional (if captured in your flow). We parse defensively either way.
  askingPrice?: number | string;

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

export type RiskSeverity = "info" | "moderate" | "critical";

export type MoneyRange = {
  audLow: number;
  audHigh: number;
  pctLow?: number; // % of asking price (0–100). Only present when asking price is known.
  pctHigh?: number;
};

export type NegotiationPositioning = {
  conservative: MoneyRange;
  balanced: MoneyRange;
  aggressive: MoneyRange;
  basisNote: string;
};

export type VerdictDriver = {
  label: string;
  whyItMatters: string;
  severity: RiskSeverity;
};

export type RiskItem = {
  id: string;
  label: string;
  explanation: string;
  severity: RiskSeverity;

  // New — explicit negotiation hint per issue (AUD + optional % of asking price)
  negotiationHint?: {
    range: MoneyRange;
    rationale: string;
    confidence: number; // 0–100 for this hint (not global)
  };

  // New — helps compounding logic (not shown unless UI uses it)
  tags?: string[];
};

export type NegotiationLeverageGroup = {
  category: string;
  points: string[];
};

export type AnalysisResult = {
  verdict: "proceed" | "caution" | "walk-away";
  verdictReason: string;

  // New — structured explainer (used by “Why this verdict?” card)
  verdictDrivers: VerdictDriver[];
  whyThisVerdict: string[];

  confidenceScore: number;
  completenessScore: number;

  // New — explicit negotiation totals (AUD + optional %)
  negotiationPositioning: NegotiationPositioning;

  risks: RiskItem[];
  negotiationLeverage: NegotiationLeverageGroup[];

  inferredSignals: {
    adasPresentButDisabled: boolean;
    confidence: number;
  };

  // New — surfaced values for downstream UI/report
  meta: {
    askingPriceAud?: number;
    compoundingMultiplier: number;
    riskScore: number;
    criticalCount: number;
    moderateCount: number;
    unsureCount: number;
    concernCount: number;
  };
};

/* =========================================================
   Helpers
========================================================= */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roundTo(n: number, nearest: number) {
  if (!Number.isFinite(n) || nearest <= 0) return 0;
  return Math.round(n / nearest) * nearest;
}

function hasNote(note?: string) {
  return (note ?? "").trim().length >= 5;
}

function severityWeight(sev?: string) {
  if (sev === "major") return 3;
  if (sev === "moderate") return 2;
  return 1;
}

function riskSeverityBase(sev: RiskSeverity) {
  if (sev === "critical") return 10;
  if (sev === "moderate") return 5;
  return 1;
}

function parseAud(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.]/g, "");
    if (!cleaned) return undefined;
    const n = Number(cleaned);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return undefined;
}

function safeLower(s: unknown) {
  return String(s ?? "").toLowerCase();
}

function pctFromAud(aud: number, asking?: number): number | undefined {
  if (!asking || asking <= 0) return undefined;
  const pct = (aud / asking) * 100;
  if (!Number.isFinite(pct)) return undefined;
  return clamp(pct, 0, 100);
}

function makeMoneyRange(audLow: number, audHigh: number, asking?: number): MoneyRange {
  const low = clamp(Math.min(audLow, audHigh), 0, 9_999_999);
  const high = clamp(Math.max(audLow, audHigh), 0, 9_999_999);

  const pctLow = pctFromAud(low, asking);
  const pctHigh = pctFromAud(high, asking);

  const range: MoneyRange = { audLow: low, audHigh: high };
  if (pctLow !== undefined && pctHigh !== undefined) {
    range.pctLow = pctLow;
    range.pctHigh = pctHigh;
  }
  return range;
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
   Negotiation ranges (AU-first heuristics)

   These are negotiation allowances, not quotes.
   We round to the nearest $50 to avoid false precision.
========================================================= */

type CostPreset = {
  audLow: number;
  audHigh: number;
  tags: string[];
  rationale: string;
  hintConfidence: number; // 0–100
};

const COST_PRESETS: Record<string, CostPreset> = {
  // Drive / mechanical signals (higher)
  "noise-hesitation": {
    audLow: 800,
    audHigh: 3500,
    tags: ["drivetrain", "test-drive"],
    rationale:
      "Unusual hesitation/noise can range from minor servicing to drivetrain work. Treat as high-risk until clarified with evidence.",
    hintConfidence: 70,
  },
  steering: {
    audLow: 400,
    audHigh: 2500,
    tags: ["handling", "suspension"],
    rationale:
      "Steering/handling concerns can be alignment, tyres, suspension wear, or accident-related. Price in a meaningful allowance until assessed.",
    hintConfidence: 70,
  },
  "underbody-leaks": {
    audLow: 250,
    audHigh: 1800,
    tags: ["leaks", "mechanical"],
    rationale:
      "Leaks can be minor (seals/hoses) or more serious. Without a mechanic’s confirmation, assume non-trivial risk.",
    hintConfidence: 65,
  },

  // Cabin comfort / usability (moderate)
  aircon: {
    audLow: 200,
    audHigh: 1200,
    tags: ["comfort", "electrical"],
    rationale:
      "A/C faults vary from re-gas to component repair. It’s reasonable to negotiate for likely rectification.",
    hintConfidence: 60,
  },
  "interior-smell": {
    audLow: 150,
    audHigh: 900,
    tags: ["interior", "water", "smoke"],
    rationale:
      "Strong odours can be smoke/water ingress. Cleaning may help, but persistent smells can signal deeper issues.",
    hintConfidence: 55,
  },
  "interior-condition": {
    audLow: 100,
    audHigh: 600,
    tags: ["interior", "cosmetic"],
    rationale:
      "Interior wear affects resale and comfort. Negotiate modestly based on what’s recorded.",
    hintConfidence: 55,
  },

  // ADAS / sensors (moderate)
  "adas-systems": {
    audLow: 150,
    audHigh: 1200,
    tags: ["adas", "sensors"],
    rationale:
      "ADAS warnings/sensor faults can be calibration or component-related. Use as leverage unless seller can prove it’s resolved.",
    hintConfidence: 55,
  },

  // Visual / exterior (varies)
  "body-panels": {
    audLow: 200,
    audHigh: 1500,
    tags: ["cosmetic", "accident"],
    rationale:
      "Panel gaps/misalignment can be cosmetic or accident-related. If it looks suspicious, treat as meaningful leverage.",
    hintConfidence: 60,
  },
  paint: {
    audLow: 150,
    audHigh: 1200,
    tags: ["cosmetic", "paint"],
    rationale:
      "Paint mismatch, overspray, or deterioration supports price movement—especially if it suggests repair history.",
    hintConfidence: 55,
  },
  "glass-lights": {
    audLow: 150,
    audHigh: 900,
    tags: ["safety", "visibility"],
    rationale:
      "Cracks/chips and light damage can be safety and roadworthy issues depending on severity. Negotiate accordingly.",
    hintConfidence: 55,
  },
  tyres: {
    audLow: 300,
    audHigh: 1200,
    tags: ["tyres", "safety"],
    rationale:
      "Tyres are a known consumable. If tread/age looks poor or uneven, a set soon is plausible—good leverage.",
    hintConfidence: 75,
  },

  // Missing evidence / uncertainty
  "missing-photos": {
    audLow: 150,
    audHigh: 600,
    tags: ["coverage", "uncertainty"],
    rationale:
      "Missing baseline photos reduce your ability to verify condition. Negotiate modestly or require evidence before committing.",
    hintConfidence: 50,
  },
  "many-unknowns": {
    audLow: 200,
    audHigh: 900,
    tags: ["coverage", "uncertainty"],
    rationale:
      "Multiple unknowns increase the chance of hidden costs. It’s reasonable to push for proof or a stronger price buffer.",
    hintConfidence: 50,
  },
};

/* =========================================================
   Main analysis
========================================================= */

export function analyseInPersonInspection(progress: ScanProgress): AnalysisResult {
  const checks = progress.checks ?? {};
  const photos = progress.photos ?? [];
  const followUps = progress.followUpPhotos ?? [];
  const imperfections = progress.imperfections ?? [];

  // Attempt to infer asking price from common locations (defensive).
  const askingPriceAud =
    parseAud((progress as any)?.askingPrice) ??
    parseAud((progress as any)?.pricing?.askingPrice) ??
    parseAud((progress as any)?.vehicle?.askingPrice) ??
    parseAud((progress as any)?.vehicleInfo?.askingPrice) ??
    parseAud((progress as any)?.vehicle?.price) ??
    parseAud((progress as any)?.price);

  /* -----------------------------
     PHOTO COVERAGE
  ----------------------------- */
  const photoSteps = new Set(photos.map((p) => p.stepId));
  const photosCaptured = REQUIRED_PHOTO_STEP_IDS.filter((id) => photoSteps.has(id)).length;

  const photoCoverage =
    REQUIRED_PHOTO_STEP_IDS.length > 0 ? photosCaptured / REQUIRED_PHOTO_STEP_IDS.length : 0;

  /* -----------------------------
     CHECK COVERAGE
  ----------------------------- */
  const answeredKeyChecks = KEY_CHECK_IDS.filter((id) => checks[id]?.value).length;

  const checkCoverage = KEY_CHECK_IDS.length > 0 ? answeredKeyChecks / KEY_CHECK_IDS.length : 0;

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
  const weakNotes = values.filter((v) => v?.value === "concern" && !hasNote(v.note)).length;

  let confidence =
    30 + completenessScore * 0.7 - unsureCount * 4 - weakNotes * 3;

  confidence = clamp(Math.round(confidence), 0, 100);

  /* -----------------------------
     RISKS (with monetary hints)
  ----------------------------- */
  const risks: RiskItem[] = [];

  const addRisk = (risk: RiskItem) => {
    // Deduplicate by id
    if (risks.some((r) => r.id === risk.id)) return;
    risks.push(risk);
  };

  const applyPresetHint = (riskId: string, baseSeverity: RiskSeverity) => {
    const preset = COST_PRESETS[riskId];
    if (!preset) return undefined;

    // Scale by severity slightly (info stays small, critical leans higher)
    const sevScale = baseSeverity === "critical" ? 1.15 : baseSeverity === "moderate" ? 1.0 : 0.75;

    const low = roundTo(preset.audLow * sevScale, 50);
    const high = roundTo(preset.audHigh * sevScale, 50);

    return {
      range: makeMoneyRange(low, high, askingPriceAud),
      rationale: preset.rationale,
      confidence: preset.hintConfidence,
    };
  };

  // Missing coverage risks (these are real, and they drive compounding)
  if (photosCaptured < REQUIRED_PHOTO_STEP_IDS.length) {
    addRisk({
      id: "missing-photos",
      label: "Some exterior photos are missing",
      explanation:
        "Not all baseline exterior angles were captured. This reduces verification confidence and can hide damage or mismatched repairs.",
      severity: "moderate",
      negotiationHint: applyPresetHint("missing-photos", "moderate"),
      tags: ["coverage", "uncertainty"],
    });
  }

  if (unsureCount >= 3) {
    addRisk({
      id: "many-unknowns",
      label: "Several checks couldn’t be completed",
      explanation:
        "Multiple items were marked as ‘unsure’. Unknowns increase the chance of hidden costs — push for proof or keep a stronger buffer.",
      severity: "moderate",
      negotiationHint: applyPresetHint("many-unknowns", "moderate"),
      tags: ["coverage", "uncertainty"],
    });
  }

  // Imperfections — convert to meaningful risks with ranges
  imperfections.forEach((i) => {
    const sevW = severityWeight(i.severity);
    const label = (i.label ?? "").trim() || "Recorded imperfection";

    // Build a minimal cost hint based on severity and keywords (cosmetic vs safety-ish).
    const l = safeLower(i.label);
    const note = (i.note ?? "").trim();
    const loc = (i.location ?? "").trim();

    const looksLikeTyre = l.includes("tyre") || l.includes("tire");
    const looksLikeGlass = l.includes("glass") || l.includes("windscreen") || l.includes("windshield");
    const looksLikePaint = l.includes("paint") || l.includes("scratch") || l.includes("scuff") || l.includes("chip");
    const looksLikeDent = l.includes("dent") || l.includes("panel");
    const looksLikeInterior = l.includes("interior") || l.includes("seat") || l.includes("trim");
    const looksLikeLeak = l.includes("leak") || l.includes("oil") || l.includes("coolant");

    // Base ranges by category (rounded later)
    let baseLow = 80;
    let baseHigh = 400;
    let tags: string[] = ["imperfection"];

    if (looksLikeTyre) {
      baseLow = 250;
      baseHigh = 1200;
      tags = ["tyres", "safety", "imperfection"];
    } else if (looksLikeGlass) {
      baseLow = 150;
      baseHigh = 900;
      tags = ["visibility", "safety", "imperfection"];
    } else if (looksLikeLeak) {
      baseLow = 250;
      baseHigh = 1800;
      tags = ["leaks", "mechanical", "imperfection"];
    } else if (looksLikePaint) {
      baseLow = 120;
      baseHigh = 900;
      tags = ["paint", "cosmetic", "imperfection"];
    } else if (looksLikeDent) {
      baseLow = 150;
      baseHigh = 1500;
      tags = ["panel", "cosmetic", "imperfection"];
    } else if (looksLikeInterior) {
      baseLow = 80;
      baseHigh = 600;
      tags = ["interior", "cosmetic", "imperfection"];
    }

    // Severity scaling
    const sevScale = i.severity === "major" ? 1.8 : i.severity === "moderate" ? 1.25 : 1.0;

    const low = roundTo(baseLow * sevScale, 50);
    const high = roundTo(baseHigh * sevScale, 50);

    const derivedSeverity: RiskSeverity =
      i.severity === "major" ? "critical" : i.severity === "moderate" ? "moderate" : "info";

    const explParts: string[] = [];
    if (loc) explParts.push(`Location: ${loc}.`);
    if (note) explParts.push(note);
    if (explParts.length === 0) {
      explParts.push(
        "Recorded during the walkthrough. Even cosmetic items can justify price movement when grouped with other findings."
      );
    }

    addRisk({
      id: `imp-${i.id}`,
      label: derivedSeverity === "critical" ? "High-impact defect recorded" : label,
      explanation: explParts.join(" "),
      severity: derivedSeverity,
      negotiationHint: {
        range: makeMoneyRange(low, high, askingPriceAud),
        rationale:
          "Negotiation allowance based on the recorded severity and typical rectification/cosmetic impact (not a quote).",
        confidence: clamp(55 + sevW * 10, 40, 85),
      },
      tags,
    });
  });

  /* -----------------------------
     SPECIFIC HIGH-SIGNAL CHECK CONCERNS
  ----------------------------- */
  const pushConcern = (
    id: string,
    label: string,
    explanation: string,
    severity: RiskSeverity
  ) => {
    const ans = checks[id];
    if (ans?.value !== "concern") return;

    const hint = applyPresetHint(id, severity);
    const noteBoost = hasNote(ans.note) ? 8 : 0;

    addRisk({
      id: `check-${id}`,
      label,
      explanation: hasNote(ans.note)
        ? `${explanation} Note recorded: ${(ans.note ?? "").trim()}`
        : explanation,
      severity,
      negotiationHint: hint
        ? {
            ...hint,
            confidence: clamp(hint.confidence + noteBoost, 30, 90),
          }
        : undefined,
      tags: COST_PRESETS[id]?.tags ?? ["check"],
    });
  };

  pushConcern(
    "noise-hesitation",
    "Engine or drivetrain behaviour stood out",
    "Hesitation or unusual noises can indicate drivetrain issues. Clarify cold-start behaviour, warning lights, and any recent repairs with invoices.",
    "critical"
  );

  pushConcern(
    "steering",
    "Steering or handling concern",
    "Steering issues can indicate alignment, suspension wear, tyres, or prior accident damage. Confirm alignment history and inspect tyres for uneven wear.",
    "critical"
  );

  pushConcern(
    "underbody-leaks",
    "Possible underbody leak or fluid concern",
    "Any sign of fluid seepage deserves clarification. Ask what fluid it is, whether it’s been repaired, and for mechanic evidence if available.",
    "critical"
  );

  pushConcern(
    "tyres",
    "Tyres may need attention",
    "Tyres are a common cost. If tread looks low, uneven, or tyres appear aged, price in replacement soon.",
    "moderate"
  );

  pushConcern(
    "adas-systems",
    "Driver-assist systems may not be working correctly",
    "If fitted, systems like blind-spot monitoring, lane-keep, and adaptive cruise should behave predictably with no warnings. Ask for calibration/repair proof if issues are present.",
    "moderate"
  );

  pushConcern(
    "aircon",
    "Air conditioning may not be performing correctly",
    "A/C should cool quickly and stay consistent. Ask whether it’s been re-gassed recently and whether any components have been replaced.",
    "moderate"
  );

  pushConcern(
    "glass-lights",
    "Glass or lights may have an issue",
    "Cracks/chips and light damage can be safety/roadworthy concerns depending on severity. Confirm repair/replacement history.",
    "moderate"
  );

  pushConcern(
    "body-panels",
    "Body panel fit or alignment concern",
    "Uneven panel gaps or alignment can hint at previous repairs. Ask what’s been repaired and request evidence.",
    "moderate"
  );

  pushConcern(
    "paint",
    "Paint condition concern",
    "Paint mismatch/overspray can indicate repairs. Ask for repair history and confirm with close inspection in good lighting.",
    "moderate"
  );

  pushConcern(
    "interior-smell",
    "Interior smell concern",
    "Strong smells can be smoke, mould, or water ingress. Ask about previous flooding, wet carpets, and deep cleaning history.",
    "moderate"
  );

  pushConcern(
    "interior-condition",
    "Interior condition concern",
    "Interior wear affects resale and comfort. If wear is heavier than expected, negotiate accordingly.",
    "info"
  );

  /* -----------------------------
     Compounding logic (stacking patterns)
  ----------------------------- */
  const criticalCount = risks.filter((r) => r.severity === "critical").length;
  const moderateCount = risks.filter((r) => r.severity === "moderate").length;

  const hasTag = (tag: string) => risks.some((r) => (r.tags ?? []).includes(tag));
  const hasDrivetrainSignal = hasTag("drivetrain") || hasTag("mechanical") || risks.some((r) => (r.tags ?? []).includes("test-drive"));
  const hasHandlingSignal = hasTag("handling") || hasTag("suspension");
  const hasLeakSignal = hasTag("leaks");
  const hasCoverageRisk = hasTag("coverage") || hasTag("uncertainty");

  // Multipliers (kept conservative to avoid “AI drama”)
  let compoundingMultiplier = 1;

  // Drive-train + leak together increases risk materially
  if (hasDrivetrainSignal && hasLeakSignal) compoundingMultiplier *= 1.18;

  // Handling + tyres increases likelihood of suspension/alignment spend
  const hasTyreSignal = hasTag("tyres");
  if (hasHandlingSignal && hasTyreSignal) compoundingMultiplier *= 1.12;

  // Coverage/unknowns amplify existing concerns (not standalone panic)
  const unknownAmplifier = 1 + clamp(unsureCount * 0.04, 0, 0.22);
  if (hasCoverageRisk && (criticalCount + moderateCount) > 0) compoundingMultiplier *= unknownAmplifier;

  // Low completeness penalises confidence and slightly amplifies risk
  if (completenessScore < 70 && (criticalCount + moderateCount) > 0) {
    const covAmp = 1 + clamp((70 - completenessScore) * 0.004, 0, 0.18);
    compoundingMultiplier *= covAmp;
  }

  compoundingMultiplier = clamp(Number(compoundingMultiplier.toFixed(3)), 1, 1.6);

  /* -----------------------------
     Risk score (numeric) — used for verdict + explanation
  ----------------------------- */
  const baseRiskScore =
    risks.reduce((sum, r) => sum + riskSeverityBase(r.severity), 0) +
    concernCount * 1.5 +
    imperfections.reduce((s, i) => s + severityWeight(i.severity), 0);

  // Confidence reduces aggressive scoring (buyer-safe)
  const confidenceDampener = 0.85 + (confidence / 100) * 0.25; // 0.85–1.10
  const riskScore = clamp(baseRiskScore * compoundingMultiplier * confidenceDampener, 0, 999);

  /* -----------------------------
     VERDICT (with tripwires)
  ----------------------------- */
  const tripwireWalkAway =
    // Strong mechanical + another critical
    (checks["noise-hesitation"]?.value === "concern" && criticalCount >= 2) ||
    // Two+ critical regardless
    criticalCount >= 3 ||
    // High combined score
    riskScore >= 40;

  const tripwireCaution =
    criticalCount >= 1 ||
    moderateCount >= 3 ||
    (riskScore >= 18 && riskScore < 40);

  let verdict: AnalysisResult["verdict"] = "proceed";
  if (tripwireWalkAway) verdict = "walk-away";
  else if (tripwireCaution) verdict = "caution";

  /* -----------------------------
     Verdict drivers + “Why this verdict?”
  ----------------------------- */
  const drivers: VerdictDriver[] = [];

  const addDriver = (d: VerdictDriver) => {
    if (drivers.some((x) => x.label === d.label)) return;
    drivers.push(d);
  };

  if (criticalCount > 0) {
    addDriver({
      label: `${criticalCount} high-impact concern${criticalCount === 1 ? "" : "s"} recorded`,
      whyItMatters:
        "Critical signals are more likely to involve safety, drivetrain, or expensive rectification—these dominate the decision.",
      severity: "critical",
    });
  }

  if (moderateCount > 0) {
    addDriver({
      label: `${moderateCount} meaningful concern${moderateCount === 1 ? "" : "s"} recorded`,
      whyItMatters:
        "Moderate signals often justify price movement or evidence requests, especially when stacked together.",
      severity: "moderate",
    });
  }

  if (compoundingMultiplier > 1.05) {
    addDriver({
      label: "Findings compound rather than stand alone",
      whyItMatters:
        "Certain combinations (e.g., drivetrain + leaks, or steering + tyres) raise the likelihood that costs stack up quickly.",
      severity: "moderate",
    });
  }

  if (unsureCount >= 3 || hasCoverageRisk) {
    addDriver({
      label: "Uncertainty increases the buffer you should demand",
      whyItMatters:
        "Unknowns don’t prove a fault, but they increase the chance of hidden spend. That should shift negotiation and confidence.",
      severity: "moderate",
    });
  }

  if (completenessScore < 70) {
    addDriver({
      label: "Coverage is incomplete",
      whyItMatters:
        "Less coverage means fewer verified observations. The safest move is to ask for evidence or keep a stronger negotiation margin.",
      severity: "info",
    });
  }

  // Keep the list tight for UI
  const verdictDrivers = drivers.slice(0, 4);

  const whyThisVerdict: string[] = [];

  if (verdict === "proceed") {
    whyThisVerdict.push("No high-impact red flags were recorded in the checks you completed.");
    whyThisVerdict.push("Your coverage and confidence are strong enough to treat this as a low-drama purchase, assuming service history checks out.");
    whyThisVerdict.push("Even with a ‘Proceed’, confirm ownership, service records, and that no warning lights appear on start-up.");
  } else if (verdict === "caution") {
    whyThisVerdict.push("At least one finding could affect cost, safety, or resale—so it’s worth clarifying before committing.");
    whyThisVerdict.push("Some signals stack together, which raises the chance that costs compound rather than staying isolated.");
    whyThisVerdict.push("If the seller can provide clean evidence (repairs/invoices/inspection), this verdict can shift toward ‘Proceed’.");
  } else {
    whyThisVerdict.push("Multiple high-impact signals were recorded, increasing the chance of expensive or time-consuming rectification.");
    whyThisVerdict.push("The pattern of findings suggests costs may stack (compounding), not remain isolated.");
    whyThisVerdict.push("Walking away is reasonable unless the seller can prove clear fixes with credible evidence—and the price reflects remaining risk.");
  }

  let verdictReason =
    verdict === "proceed"
      ? "No major red flags were detected from what was recorded — the remaining work is mostly confirmation and due diligence."
      : verdict === "caution"
      ? "A few meaningful concerns and/or uncertainty are worth clarifying before committing — negotiate with a clear buffer."
      : "Multiple high-impact concerns were identified, and the pattern suggests costs could stack. Walking away is a reasonable option.";

  /* -----------------------------
     NEGOTIATION POSITIONING (Totals)
  ----------------------------- */
  const riskHints = risks
    .map((r) => r.negotiationHint?.range)
    .filter((x): x is MoneyRange => Boolean(x));

  // If we have no hints, create a minimal “due diligence” buffer for paid results value.
  const fallbackRanges: MoneyRange[] = [
    makeMoneyRange(150, 500, askingPriceAud),
  ];

  const rangesToSum = riskHints.length ? riskHints : fallbackRanges;

  const sumLow = rangesToSum.reduce((s, r) => s + r.audLow, 0);
  const sumHigh = rangesToSum.reduce((s, r) => s + r.audHigh, 0);

  // Conservative/Balanced/Aggressive scaling (buyer-safe, not silly)
  const conservative = makeMoneyRange(roundTo(sumLow * 0.65, 50), roundTo(sumHigh * 0.75, 50), askingPriceAud);
  const balanced = makeMoneyRange(roundTo(sumLow * 0.85, 50), roundTo(sumHigh * 1.0, 50), askingPriceAud);
  const aggressive = makeMoneyRange(roundTo(sumLow * 1.0, 50), roundTo(sumHigh * 1.25, 50), askingPriceAud);

  const basisNote = askingPriceAud
    ? "AUD ranges are negotiation allowances derived from recorded signals; % reflects the same allowance as a share of the asking price."
    : "AUD ranges are negotiation allowances derived from recorded signals. Add asking price to enable % equivalents.";

  const negotiationPositioning: NegotiationPositioning = {
    conservative,
    balanced,
    aggressive,
    basisNote,
  };

  /* -----------------------------
     NEGOTIATION LEVERAGE (Buyer-safe phrasing)
  ----------------------------- */
  const leveragePoints = risks
    .filter((r) => r.severity !== "info")
    .slice(0, 8)
    .map((r) => {
      const range = r.negotiationHint?.range;
      const audPart = range ? `$${range.audLow.toLocaleString()}–$${range.audHigh.toLocaleString()}` : "";
      const pctPart =
        range?.pctLow !== undefined && range?.pctHigh !== undefined
          ? ` (≈${Math.round(range.pctLow)}–${Math.round(range.pctHigh)}%)`
          : "";

      const money = audPart ? `Negotiate allowance: ${audPart}${pctPart}.` : "";
      const prefix = money ? `${money} ` : "";

      return `• ${r.label}: ${prefix}${r.explanation}`;
    });

  const negotiationLeverage: NegotiationLeverageGroup[] = [
    {
      category: "Evidence-based leverage",
      points: leveragePoints.length
        ? leveragePoints
        : [
            "• Use your strong coverage to confirm service history, ownership, and recent repairs, then negotiate modestly if anything is missing or unclear.",
          ],
    },
  ];

  /* -----------------------------
     ADAS INFERENCE (NO UI dependency)
  ----------------------------- */
  const adas = checks["adas-systems"];
  const adasPresentButDisabled = adas?.value === "concern" || adas?.value === "unsure";

  /* -----------------------------
     Ensure “paid results” is never empty
  ----------------------------- */
  if (risks.length === 0) {
    addRisk({
      id: "baseline-clear",
      label: "No major concerns recorded in this walkthrough",
      explanation:
        "Based on the checks and photos you captured, there were no high-impact red flags. The best next step is confirming service history and ensuring no warning lights on cold start.",
      severity: "info",
      negotiationHint: {
        range: makeMoneyRange(0, 0, askingPriceAud),
        rationale: "No specific price buffer is implied by recorded issues; focus is on confirmation and due diligence.",
        confidence: clamp(60 + Math.round(completenessScore * 0.3), 60, 90),
      },
      tags: ["baseline"],
    });
  }

  return {
    verdict,
    verdictReason,
    verdictDrivers,
    whyThisVerdict,

    confidenceScore: confidence,
    completenessScore,

    negotiationPositioning,

    risks,
    negotiationLeverage,

    inferredSignals: {
      adasPresentButDisabled,
      confidence: adasPresentButDisabled ? 70 : 10,
    },

    meta: {
      askingPriceAud,
      compoundingMultiplier,
      riskScore: Math.round(riskScore * 10) / 10,
      criticalCount,
      moderateCount,
      unsureCount,
      concernCount,
    },
  };
}
