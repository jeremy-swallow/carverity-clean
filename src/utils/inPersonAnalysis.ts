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

  askingPrice?: number | null;

  checks?: Record<string, CheckAnswer>;
  photos?: Array<{ id: string; dataUrl: string; stepId: string }>;
  followUpPhotos?: Array<{
    id: string;
    dataUrl: string;
    stepId: string;
    note?: string;
  }>;
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

/**
 * IMPORTANT:
 * Your UI (InPersonResults.tsx) expects evidenceSummary to contain
 * a human-readable string or an object with keys like: summary / bullets.
 *
 * So we keep all the metric fields AND add summary/bullets for rendering.
 */
export type EvidenceSummary = {
  // Human-readable (what the UI can render)
  summary?: string;
  bullets?: string[];

  // Metrics (useful for scoring/debug)
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

export type PriceGuidance = {
  askingPriceAud: number | null;

  adjustedPriceLowAud: number | null;
  adjustedPriceHighAud: number | null;

  suggestedReductionLowAud: number | null;
  suggestedReductionHighAud: number | null;

  disclaimer: string;
  rationale: string[];
};

export type AnalysisResult = {
  verdict: "proceed" | "caution" | "walk-away";
  verdictReason: string;

  confidenceScore: number;
  completenessScore: number;

  risks: RiskItem[];

  negotiationLeverage: NegotiationLeverageGroup[];

  negotiationPositioning: NegotiationPositioning;

  /**
   * NOTE:
   * InPersonResults.tsx currently renders `whyThisVerdict` as a paragraph.
   * Previously this was string[] (which rendered blank).
   * We now provide a clean single string AND keep bullets for other uses.
   */
  whyThisVerdict: string;
  whyThisVerdictBullets: string[];

  evidenceSummary: EvidenceSummary;

  /**
   * UI expects a string (print + results page render this).
   * Keep the bullets for optional “expand” UI later.
   */
  riskWeightingExplanation: string;
  riskWeightingBullets: string[];

  uncertaintyFactors: UncertaintyFactor[];
  counterfactuals: string[];
  buyerContextInterpretation: BuyerContextInterpretation[];

  inferredSignals: {
    adasPresentButDisabled: boolean;
    confidence: number;
  };

  priceGuidance: PriceGuidance;
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

function asOneLine(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function normKey(s: string) {
  return asOneLine(String(s ?? ""))
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deduplicate imperfections so the report doesn't repeat itself.
 * We combine locations into a single "Recorded in: ..." style location string.
 */
function dedupeImperfections(
  imperfections: NonNullable<ScanProgress["imperfections"]>
): NonNullable<ScanProgress["imperfections"]> {
  const list = Array.isArray(imperfections) ? imperfections : [];
  if (list.length <= 1) return list;

  type Agg = {
    id: string;
    label?: string;
    severity?: "minor" | "moderate" | "major";
    note?: string;
    locations: string[];
  };

  const map = new Map<string, Agg>();

  for (const imp of list) {
    const label = (imp.label ?? "").trim();
    const note = (imp.note ?? "").trim();
    const sev = imp.severity ?? "minor";

    // Prefer label if present, else fall back to id
    const baseId = (imp.id ?? "").trim();
    const identity = normKey(label || baseId || "imperfection");
    const noteKey = normKey(note);

    // Key includes severity so "minor" and "moderate" don't merge incorrectly
    const key = `${identity}__${sev}__${noteKey}`;

    const loc = (imp.location ?? "").trim();
    const locClean = loc ? asOneLine(loc) : "";

    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        id: baseId || identity || `imp-${Math.random().toString(16).slice(2)}`,
        label: label || undefined,
        severity: sev,
        note: note || undefined,
        locations: locClean ? [locClean] : [],
      });
    } else {
      if (locClean && !existing.locations.includes(locClean)) {
        existing.locations.push(locClean);
      }
    }
  }

  const merged = Array.from(map.values()).map((a) => {
    const location =
      a.locations.length > 1
        ? a.locations.join(" • ")
        : a.locations.length === 1
        ? a.locations[0]
        : undefined;

    return {
      id: a.id,
      label: a.label,
      severity: a.severity,
      note: a.note,
      location,
    };
  });

  // Sort: major -> moderate -> minor, then label
  merged.sort((a, b) => {
    const wA = severityWeight(a.severity);
    const wB = severityWeight(b.severity);
    if (wB !== wA) return wB - wA;
    return normKey(a.label ?? a.id).localeCompare(normKey(b.label ?? b.id));
  });

  return merged;
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

/**
 * KEY CHECK IDS
 * Include BOTH:
 * - New IDs (current guided flows)
 * - Legacy IDs (backwards compatibility for older scans)
 */
const KEY_CHECK_IDS = [
  /* New (current) */
  // Around car
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

  /* Legacy (older builds) */
  "body-panels",
  "paint",
  "glass-lights",
  "tyres",
  "underbody-leaks", // backwards compatibility only
];

/**
 * This is the "analysis default-fill" list.
 * If a scan has missing/empty checks, we treat unrecorded items as "ok"
 * for scoring/verdict purposes (buyer-safe: avoids harsh verdicts due to empty data).
 *
 * NOTE:
 * We do NOT use these defaults for evidence bullets (those should reflect what the user actually recorded).
 */
const DEFAULT_FILL_CHECK_IDS = [...new Set(KEY_CHECK_IDS)];

const CHECK_LABELS: Record<string, string> = {
  /* New (current) */
  "body-panels-paint": "Body panels & paint",
  "headlights-condition": "Headlights condition",
  "windscreen-damage": "Windscreen damage",
  "tyre-wear": "Tyre wear & tread",
  "brakes-visible": "Brake discs (if visible)",

  "seatbelts-trim": "Seatbelts & airbag trim",

  /* Shared (same IDs across versions) */
  "interior-smell": "Smell or moisture",
  "interior-condition": "General interior condition",
  aircon: "Air-conditioning",
  steering: "Steering & handling feel",
  "noise-hesitation": "Noise / hesitation under power",
  "adas-systems": "Driver-assist systems (if fitted)",

  /* Legacy */
  "body-panels": "Body panels & alignment",
  paint: "Paint condition",
  "glass-lights": "Glass & lights",
  tyres: "Tyres condition",
  "underbody-leaks": "Visible fluid leaks (if noticed)",
};

function labelForCheckId(id: string) {
  return CHECK_LABELS[id] || titleFromId(id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Default-fill logic:
 * - Never overwrites existing values
 * - Fills only missing ids with value "ok"
 */
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
   Negotiation positioning helpers
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
   Price guidance helpers (legally safe)
========================================================= */

function formatAud(n: number) {
  return n.toLocaleString("en-AU");
}

function computePriceGuidance(args: {
  askingPriceAud: number | null;
  negotiationPositioning: NegotiationPositioning;
  verdict: AnalysisResult["verdict"];
  risks: RiskItem[];
  confidenceScore: number;
  completenessScore: number;
}): PriceGuidance {
  const {
    askingPriceAud,
    negotiationPositioning,
    verdict,
    risks,
    confidenceScore,
    completenessScore,
  } = args;

  const disclaimer =
    "Guidance only. This is not a valuation, and it does not estimate repair costs. It’s a buyer-safe adjustment range based on what you recorded.";

  if (!askingPriceAud || askingPriceAud <= 0) {
    return {
      askingPriceAud: null,
      adjustedPriceLowAud: null,
      adjustedPriceHighAud: null,
      suggestedReductionLowAud: null,
      suggestedReductionHighAud: null,
      disclaimer,
      rationale: [
        "No asking price was provided, so the report can’t calculate an adjusted range.",
        "If you enter the advertised price, we’ll generate a buyer-safe adjustment window based on recorded concerns and uncertainty.",
      ],
    };
  }

  // We use the BALANCED positioning as the default anchor.
  const redLow = negotiationPositioning.balanced.audLow;
  const redHigh = negotiationPositioning.balanced.audHigh;

  // Hard safety caps to avoid absurd outputs
  const cappedRedLow = clamp(redLow, 0, Math.round(askingPriceAud * 0.25));
  const cappedRedHigh = clamp(
    redHigh,
    cappedRedLow,
    Math.round(askingPriceAud * 0.35)
  );

  // Adjusted price window (asking - reduction)
  const adjustedHigh = Math.max(askingPriceAud - cappedRedLow, 0);
  const adjustedLow = Math.max(askingPriceAud - cappedRedHigh, 0);

  const criticalCount = risks.filter((r) => r.severity === "critical").length;
  const moderateCount = risks.filter((r) => r.severity === "moderate").length;

  const rationale: string[] = [];

  if (verdict === "proceed") {
    rationale.push(
      "No high-impact red flags were recorded in the inspection you captured."
    );
  } else if (verdict === "caution") {
    rationale.push(
      "At least one meaningful concern or uncertainty was recorded, which supports a price adjustment."
    );
  } else {
    rationale.push(
      "Multiple high-impact concerns were recorded — strong downward pressure is reasonable if you still proceed."
    );
  }

  if (criticalCount > 0) {
    rationale.push(
      criticalCount === 1
        ? "A high-impact concern was recorded and weighted heavily."
        : `${criticalCount} high-impact concerns were recorded and weighted heavily.`
    );
  } else if (moderateCount > 0) {
    rationale.push(
      moderateCount === 1
        ? "A meaningful concern was recorded."
        : `${moderateCount} meaningful concerns were recorded.`
    );
  }

  if (confidenceScore < 55) {
    rationale.push(
      "Confidence is limited, so the adjustment range is intentionally conservative."
    );
  } else if (confidenceScore < 75) {
    rationale.push(
      "Confidence is moderate; the range reflects a practical buyer position."
    );
  } else {
    rationale.push(
      "Confidence is strong, which supports using a firmer price position."
    );
  }

  if (completenessScore < 55) {
    rationale.push(
      "Evidence coverage is limited, so you should prioritise clarifying key items before committing."
    );
  }

  rationale.push(
    `This suggests aiming for roughly $${formatAud(adjustedLow)}–$${formatAud(
      adjustedHigh
    )} if the seller can’t provide strong evidence resolving the recorded concerns.`
  );

  return {
    askingPriceAud,
    adjustedPriceLowAud: adjustedLow,
    adjustedPriceHighAud: adjustedHigh,
    suggestedReductionLowAud: cappedRedLow,
    suggestedReductionHighAud: cappedRedHigh,
    disclaimer,
    rationale,
  };
}

/* =========================================================
   Evidence text generation (guidance-led)
========================================================= */

function buildEvidenceBullets(args: {
  checks: Record<string, CheckAnswer>;
  imperfections: NonNullable<ScanProgress["imperfections"]>;
  photos: NonNullable<ScanProgress["photos"]>;
  followUps: NonNullable<ScanProgress["followUpPhotos"]>;
}) {
  const { checks, imperfections, photos, followUps } = args;

  const bullets: string[] = [];

  // Checks (only include ones user touched)
  const answered = Object.entries(checks)
    .filter(([, v]) => Boolean(v?.value))
    .map(([id, v]) => ({ id, v }));

  // Put concerns first, then unsure, then ok
  const rank = (val: AnswerValue) =>
    val === "concern" ? 0 : val === "unsure" ? 1 : 2;

  answered.sort((a, b) => rank(a.v.value) - rank(b.v.value));

  for (const { id, v } of answered) {
    const label = labelForCheckId(id);
    const note = (v.note ?? "").trim();

    if (v.value === "concern") {
      bullets.push(
        note
          ? `${label}: something stood out — ${asOneLine(note)}.`
          : `${label}: something stood out.`
      );
    } else if (v.value === "unsure") {
      bullets.push(
        note
          ? `${label}: couldn't confirm — ${asOneLine(note)}.`
          : `${label}: couldn't confirm.`
      );
    } else {
      // keep "ok" lighter to avoid noise
    }
  }

  // Imperfections (explicit user-recorded) — NOW DEDUPED BEFORE THIS IS CALLED
  const impSorted = [...(imperfections ?? [])].sort((a, b) => {
    const wA = severityWeight(a.severity);
    const wB = severityWeight(b.severity);
    return wB - wA;
  });

  for (const imp of impSorted) {
    const sev = imp.severity ?? "minor";
    const label = (imp.label ?? "Imperfection").trim();
    const loc = (imp.location ?? "").trim();
    const note = (imp.note ?? "").trim();

    const locPart = loc ? ` (${loc})` : "";
    const sevPart =
      sev === "major" ? "Major" : sev === "moderate" ? "Moderate" : "Minor";

    bullets.push(
      note
        ? `${sevPart} note: ${label}${locPart} — ${asOneLine(note)}.`
        : `${sevPart} note: ${label}${locPart}.`
    );
  }

  // Photos / follow-ups
  if (photos.length > 0) bullets.push(`Photos captured: ${photos.length}.`);
  if (followUps.length > 0)
    bullets.push(`Follow-up notes/photos: ${followUps.length}.`);

  // If we ended up with nothing meaningful, include a minimal "ok" snapshot
  if (bullets.length === 0) {
    const okItems = Object.entries(checks)
      .filter(([, v]) => v?.value === "ok")
      .slice(0, 3)
      .map(([id]) => labelForCheckId(id));

    if (okItems.length > 0) {
      bullets.push(`Checks marked normal: ${okItems.join(", ")}.`);
    }
    if (photos.length > 0) bullets.push(`Photos captured: ${photos.length}.`);
  }

  // Cap to avoid huge walls of text
  return bullets.slice(0, 14);
}

function buildEvidenceSummaryText(args: {
  concernCount: number;
  unsureCount: number;
  imperfectionsCount: number;
  photosCount: number;
  followUpsCount: number;
}) {
  const {
    concernCount,
    unsureCount,
    imperfectionsCount,
    photosCount,
    followUpsCount,
  } = args;

  const parts: string[] = [];

  if (concernCount > 0) {
    parts.push(
      concernCount === 1
        ? "You recorded 1 item that stood out."
        : `You recorded ${concernCount} items that stood out.`
    );
  } else {
    parts.push(
      "You didn’t mark any items as ‘stood out’ in the checks you completed."
    );
  }

  if (unsureCount > 0) {
    parts.push(
      unsureCount === 1
        ? "1 item couldn’t be confirmed."
        : `${unsureCount} items couldn’t be confirmed.`
    );
  }

  if (imperfectionsCount > 0) {
    parts.push(
      imperfectionsCount === 1
        ? "You recorded 1 imperfection."
        : `You recorded ${imperfectionsCount} imperfections.`
    );
  }

  if (photosCount > 0)
    parts.push(
      `You captured ${photosCount} photo${photosCount === 1 ? "" : "s"}.`
    );

  if (followUpsCount > 0)
    parts.push(
      `You added ${followUpsCount} follow-up note${
        followUpsCount === 1 ? "" : "s"
      }.`
    );

  return parts.join(" ");
}

/* =========================================================
   Guided reasoning text (premium + calm)
========================================================= */

function explainConfidence(confidenceScore: number) {
  if (confidenceScore >= 80) {
    return "High confidence means you captured strong coverage and recorded enough evidence for the posture to be reliable.";
  }
  if (confidenceScore >= 60) {
    return "Moderate confidence means the posture is reasonable, but there are a few unknowns or gaps worth verifying.";
  }
  if (confidenceScore >= 40) {
    return "Lower confidence means there are gaps or unknowns that reduce certainty. Clarifying key items will improve the outcome.";
  }
  return "Very low confidence means too much is unknown. Treat this as a prompt to verify key items before deciding.";
}

function explainCoverage(completenessScore: number) {
  if (completenessScore >= 80) {
    return "Coverage is strong — you captured most of the key checks and baseline photos.";
  }
  if (completenessScore >= 60) {
    return "Coverage is moderate — enough to guide a decision posture, but not enough to be definitive.";
  }
  if (completenessScore >= 40) {
    return "Coverage is limited — the result is still useful, but it should be treated as provisional until more is recorded.";
  }
  return "Coverage is very limited — capture a few more checks/photos to make the report meaningfully stronger.";
}

function buildRiskWeightingText(args: {
  verdict: AnalysisResult["verdict"];
  criticalCount: number;
  moderateCount: number;
  unsureCount: number;
  completenessScore: number;
  confidenceScore: number;
}) {
  const {
    verdict,
    criticalCount,
    moderateCount,
    unsureCount,
    completenessScore,
    confidenceScore,
  } = args;

  const bullets: string[] = [];

  if (criticalCount > 0) {
    bullets.push(
      criticalCount === 1
        ? "A high-impact concern was recorded and weighted heavily."
        : `${criticalCount} high-impact concerns were recorded and weighted heavily.`
    );
  } else if (moderateCount > 0) {
    bullets.push(
      moderateCount === 1
        ? "A meaningful concern was recorded and weighted moderately."
        : `${moderateCount} meaningful concerns were recorded and weighted moderately.`
    );
  } else {
    bullets.push(
      "No major concerns were recorded in the inspection you captured."
    );
  }

  if (unsureCount > 0) {
    bullets.push(
      unsureCount === 1
        ? "One item was explicitly marked ‘unsure’, which lowers certainty."
        : `${unsureCount} items were explicitly marked ‘unsure’, which lowers certainty.`
    );
  } else {
    bullets.push(
      "No items were marked ‘unsure’, so certainty is based on recorded observations."
    );
  }

  bullets.push(explainCoverage(completenessScore));
  bullets.push(explainConfidence(confidenceScore));

  if (verdict === "walk-away") {
    bullets.push(
      "This posture is intentionally buyer-safe: unresolved high-impact items can create expensive regret."
    );
  } else if (verdict === "caution") {
    bullets.push(
      "This posture is buyer-safe: clarify the recorded items first, then decide with confidence."
    );
  } else {
    bullets.push(
      "This posture is buyer-safe: proceed normally, but still confirm paperwork and service history."
    );
  }

  return {
    bullets,
    text: bullets.join(" "),
  };
}

/* =========================================================
   Main analysis
========================================================= */

export function analyseInPersonInspection(progress: ScanProgress): AnalysisResult {
  /**
   * Raw checks = what user actually recorded.
   * Effective checks = raw + default-filled "ok" (never overwrites), used for verdict/scoring safety.
   */
  const rawChecks = progress.checks ?? {};
  const checks = withDefaultFilledChecks(rawChecks);

  const photos = progress.photos ?? [];
  const followUps = progress.followUpPhotos ?? [];

  // IMPORTANT: dedupe imperfections to prevent repeated report items
  const imperfectionsRaw = progress.imperfections ?? [];
  const imperfections = dedupeImperfections(imperfectionsRaw);

  const askingPriceAud =
    typeof progress.askingPrice === "number" &&
    Number.isFinite(progress.askingPrice)
      ? progress.askingPrice
      : null;

  /* -----------------------------
     PHOTO COVERAGE
  ----------------------------- */
  const photoSteps = new Set(photos.map((p) => p.stepId));
  const photosCapturedBaseline = REQUIRED_PHOTO_STEP_IDS.filter((id) =>
    photoSteps.has(id)
  ).length;

  const photoCoverage =
    REQUIRED_PHOTO_STEP_IDS.length > 0
      ? photosCapturedBaseline / REQUIRED_PHOTO_STEP_IDS.length
      : 0;

  /* -----------------------------
     CHECK COVERAGE
     Use RAW checks (truth: what user actually recorded)
  ----------------------------- */
  const answeredKeyChecks = KEY_CHECK_IDS.filter((id) => rawChecks[id]?.value)
    .length;

  const checkCoverage =
    KEY_CHECK_IDS.length > 0 ? answeredKeyChecks / KEY_CHECK_IDS.length : 0;

  /* -----------------------------
     COMPLETENESS SCORE
     (truthful: reflects actual recorded coverage)
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
     Use RAW checks (truthful)
  ----------------------------- */
  const rawValues = Object.values(rawChecks);
  const concernCountRaw = rawValues.filter((v) => v?.value === "concern").length;
  const unsureCountRaw = rawValues.filter((v) => v?.value === "unsure").length;

  const concernWithNotes = rawValues.filter(
    (v) => v?.value === "concern" && hasNote(v.note)
  ).length;

  let confidence =
    32 +
    completenessScore * 0.68 -
    unsureCountRaw * 5 +
    concernWithNotes * 1.5;

  confidence = clamp(Math.round(confidence), 0, 100);

  /* -----------------------------
     RISKS
     Use EFFECTIVE checks to avoid harsh verdicts due to empty/missing check objects
  ----------------------------- */
  const risks: RiskItem[] = [];

  if (photosCapturedBaseline < REQUIRED_PHOTO_STEP_IDS.length) {
    risks.push({
      id: "missing-photos",
      label: "Some baseline exterior photos are missing",
      explanation:
        "Not all exterior angles were captured. This reduces how confidently the report can reflect what was observed.",
      severity: "moderate",
    });
  }

  // Use RAW unsure count here (truthful: don't invent uncertainty)
  if (unsureCountRaw >= 3) {
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
        label: i.label
          ? `Major observation: ${i.label}`
          : "Major observation recorded",
        explanation:
          i.note ||
          "A major observation was recorded. Clarify details and pricing impact before proceeding.",
        severity: "critical",
      });
    } else if (i.severity === "moderate") {
      risks.push({
        id: `imp-${i.id}`,
        label: i.label
          ? `Observation: ${i.label}`
          : "Moderate observation recorded",
        explanation:
          i.note ||
          "A moderate observation was recorded. It may influence negotiation depending on severity and buyer preference.",
        severity: "moderate",
      });
    }
  });

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

  // NEW: Headlights + windscreen checks
  pushConcern(
    "headlights-condition",
    "Headlights condition stood out",
    "Cloudy/yellow headlights, cracks, or moisture inside can reduce night visibility and may require restoration or replacement.",
    "moderate"
  );

  // Windscreen can be moderate or critical depending on what the note implies.
  // If the user recorded a crack or a driver-view chip, we treat it as critical.
  const windscreenRawNote = (rawChecks["windscreen-damage"]?.note ?? "").trim();
  const windscreenNote = normKey(windscreenRawNote);

  const windscreenIsConcern = checks["windscreen-damage"]?.value === "concern";
  if (windscreenIsConcern) {
    const criticalSignals = [
      "crack",
      "drivers view",
      "driver view",
      "in drivers view",
      "in driver view",
      "line crack",
      "long crack",
    ];

    const isCritical = criticalSignals.some((s) => windscreenNote.includes(s));

    risks.push({
      id: "check-windscreen-damage",
      label: "Windscreen damage recorded",
      explanation:
        isCritical
          ? "A crack or damage in the driver’s view can be a safety issue and may require replacement. Treat this as a high-impact item until confirmed."
          : "Windscreen chips can spread and become more expensive to fix. Clarify size/location and whether repair is possible.",
      severity: isCritical ? "critical" : "moderate",
    });
  }

  /* -----------------------------
     NEW: AIRCON RISK LOGIC
     - Concern + note implies no cooling / blowing hot / failed / compressor -> CRITICAL
     - Otherwise -> MODERATE
     - Unsure -> handled only via uncertainty (no explicit risk)
     - Ok -> no risk
  ----------------------------- */
  const airconRawNote = (rawChecks["aircon"]?.note ?? "").trim();
  const airconNote = normKey(airconRawNote);
  const airconIsConcern = checks["aircon"]?.value === "concern";

  if (airconIsConcern) {
    const criticalSignals = [
      "no cooling",
      "not cooling",
      "no cold",
      "not cold",
      "blowing hot",
      "blows hot",
      "hot air",
      "warm air",
      "failed",
      "not working",
      "doesnt work",
      "does not work",
      "compressor",
      "compressor issue",
      "compressor failed",
      "ac compressor",
      "aircon compressor",
    ];

    const isCritical = criticalSignals.some((s) => airconNote.includes(s));

    risks.push({
      id: "check-aircon",
      label: "Air-conditioning concern recorded",
      explanation: airconRawNote
        ? isCritical
          ? `Air-conditioning appears to have failed to cool effectively — ${asOneLine(
              airconRawNote
            )}.`
          : `Air-conditioning stood out during use — ${asOneLine(airconRawNote)}.`
        : isCritical
        ? "Air-conditioning appears to have failed to cool effectively. Loss of cooling can indicate a failed system or costly repairs."
        : "Air-conditioning stood out during use. Clarify whether it cools properly, any warning lights, and whether it has been serviced recently.",
      severity: isCritical ? "critical" : "moderate",
    });
  }

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

  // Backwards compatibility only
  pushConcern(
    "underbody-leaks",
    "Possible fluid leak was noticed",
    "If you noticed any fluid marks or drips, ask what it was and whether it has been inspected or repaired recently.",
    "critical"
  );

  /* -----------------------------
     VERDICT
     Use RAW counts for truth, but safe scoring will not punish missing check objects
  ----------------------------- */
  const criticalCount = risks.filter((r) => r.severity === "critical").length;
  const moderateCount = risks.filter((r) => r.severity === "moderate").length;

  const imperfectionScore = imperfections.reduce(
    (s, i) => s + severityWeight(i.severity),
    0
  );

  const score =
    concernCountRaw * 2 +
    criticalCount * 4 +
    moderateCount * 1.5 +
    unsureCountRaw * 1.5 +
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
     NEGOTIATION LEVERAGE (legacy)
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
     NEGOTIATION POSITIONING
  ----------------------------- */
  const uncertaintyPenalty = clamp(100 - confidence, 0, 100);
  const pressureScore =
    criticalCount * 4.8 +
    moderateCount * 2.2 +
    concernCountRaw * 1.2 +
    unsureCountRaw * 2.0 +
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
        unsureCount: unsureCountRaw,
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
        unsureCount: unsureCountRaw,
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
        unsureCount: unsureCountRaw,
        completenessScore,
      }),
    },
  };

  /* -----------------------------
     EXPLICIT REASONING OUTPUTS
     Use RAW checks (truthful)
  ----------------------------- */
  const explicitlyUncertainItems: string[] = Object.entries(rawChecks)
    .filter(([, v]) => v?.value === "unsure")
    .map(([id, v]) => {
      const baseLabel = labelForCheckId(id);
      const note = (v?.note ?? "").trim();
      return note ? `${baseLabel} — ${note}` : baseLabel;
    });

  const uncertaintyFactors: UncertaintyFactor[] = explicitlyUncertainItems.map(
    (label) => ({
      label,
      impact: "moderate",
      source: "user_marked_unsure",
    })
  );

  const whyThisVerdictBullets: string[] = [
    verdict === "proceed"
      ? "No recorded findings were assessed as high impact."
      : verdict === "caution"
      ? "Recorded findings included at least one meaningful concern or uncertainty."
      : "Multiple high-impact concerns were recorded, increasing downside risk.",
    unsureCountRaw > 0
      ? "Uncertainty here comes only from items you marked as ‘unsure’."
      : "No items were marked as ‘unsure’, so certainty is based on recorded observations.",
    completenessScore >= 75
      ? "You captured strong coverage, which supports the confidence score."
      : completenessScore >= 55
      ? "Coverage was moderate; confidence reflects that."
      : "Coverage was limited; confidence reflects that.",
  ];

  const whyThisVerdict = whyThisVerdictBullets.join(" ");

  const counterfactuals: string[] = [];

  if (unsureCountRaw > 0) {
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
     Use EFFECTIVE checks so older scans that omitted the key doesn't misbehave
  ----------------------------- */
  const adas = checks["adas-systems"];
  const adasPresentButDisabled =
    adas?.value === "concern" || adas?.value === "unsure";

  /* -----------------------------
     Evidence summary (NOW RENDERS)
     Use RAW checks (truthful)
  ----------------------------- */
  const evidenceBullets = buildEvidenceBullets({
    checks: rawChecks,
    imperfections,
    photos,
    followUps,
  });

  const evidenceSummaryText = buildEvidenceSummaryText({
    concernCount: concernCountRaw,
    unsureCount: unsureCountRaw,
    imperfectionsCount: imperfections.length,
    photosCount: photos.length,
    followUpsCount: followUps.length,
  });

  const evidenceSummary: EvidenceSummary = {
    // UI-friendly
    summary: evidenceSummaryText,
    bullets: evidenceBullets,

    // Metrics
    photosCaptured: photos.length,
    photosExpected: REQUIRED_PHOTO_STEP_IDS.length,
    checksCompleted: Object.values(rawChecks).filter((v) => Boolean(v?.value))
      .length,
    keyChecksExpected: KEY_CHECK_IDS.length,
    imperfectionsNoted: imperfections.length,
    followUpPhotosCaptured: followUps.length,
    explicitlyUncertainItems,
  };

  /* -----------------------------
     Risk weighting explanation (string + bullets)
  ----------------------------- */
  const weighting = buildRiskWeightingText({
    verdict,
    criticalCount,
    moderateCount,
    unsureCount: unsureCountRaw,
    completenessScore,
    confidenceScore: confidence,
  });

  // NEW: price guidance (asking price -> adjusted range)
  const priceGuidance = computePriceGuidance({
    askingPriceAud,
    negotiationPositioning,
    verdict,
    risks,
    confidenceScore: confidence,
    completenessScore,
  });

  return {
    verdict,
    verdictReason,
    confidenceScore: confidence,
    completenessScore,
    risks,

    negotiationLeverage,
    negotiationPositioning,

    whyThisVerdict,
    whyThisVerdictBullets,

    evidenceSummary,

    riskWeightingExplanation: weighting.text,
    riskWeightingBullets: weighting.bullets,

    uncertaintyFactors,
    counterfactuals,
    buyerContextInterpretation,

    inferredSignals: {
      adasPresentButDisabled,
      confidence: adasPresentButDisabled ? 70 : 10,
    },

    priceGuidance,
  };
}
