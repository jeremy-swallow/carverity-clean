// src/pages/inPersonResults/verdictLogic.ts

/* =======================================================
   Types
======================================================= */

export type VerdictKey = "proceed" | "caution" | "walk-away";

export type VerdictMeta = {
  key: VerdictKey;
  title: string;
  short: string;
  posture: string;
  tone: "emerald" | "amber" | "red";
};

export type VerdictScores = {
  confidence: number;
  coverage: number;
};

export type VerdictSignals = Array<{
  label: string;
  tone: "critical" | "moderate" | "unknown";
}>;

export type VerdictOutcome = {
  verdict: VerdictMeta;
  scores: VerdictScores;
  signals: VerdictSignals;
  why: string;
};

/* =======================================================
   Helpers
======================================================= */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function asCleanText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return "";
}

/* =======================================================
   Verdict meta definitions
======================================================= */

const VERDICT_META: Record<VerdictKey, VerdictMeta> = {
  proceed: {
    key: "proceed",
    title: "Looks OK to continue",
    short: "Looks OK to continue",
    posture:
      "Based on what you recorded, there are no major red flags. Still do the normal checks before you buy.",
    tone: "emerald",
  },
  caution: {
    key: "caution",
    title: "Continue only after a few checks",
    short: "Check a few things first",
    posture:
      "You recorded at least one concern or unsure item. Get clear answers before you commit.",
    tone: "amber",
  },
  "walk-away": {
    key: "walk-away",
    title: "Pause — walking away is reasonable",
    short: "Pause / walk away",
    posture:
      "What you recorded suggests higher risk. If the seller can’t explain or prove key items, it’s OK to walk away.",
    tone: "red",
  },
};

/* =======================================================
   Core extraction
======================================================= */

/**
 * Extracts verdict-related presentation data from analysis output.
 * Defensive by design — missing fields degrade gracefully.
 */
export function buildVerdictOutcome(analysis: any): VerdictOutcome {
  const verdictKey: VerdictKey =
    analysis?.verdict === "proceed" ||
    analysis?.verdict === "caution" ||
    analysis?.verdict === "walk-away"
      ? analysis.verdict
      : "caution";

  const confidence = clamp(
    Number(analysis?.confidenceScore ?? 0),
    0,
    100
  );

  const coverage = clamp(
    Number(analysis?.completenessScore ?? 0),
    0,
    100
  );

  const risks: any[] = Array.isArray(analysis?.risks)
    ? analysis.risks
    : [];

  const uncertaintyFactors: unknown[] = Array.isArray(
    analysis?.uncertaintyFactors
  )
    ? analysis.uncertaintyFactors
    : [];

  /* -------------------------------------------------------
     Build signals (what stood out)
  ------------------------------------------------------- */
  const signals: VerdictSignals = [];

  for (const r of risks.filter((r) => r?.severity === "critical").slice(0, 2)) {
    if (r?.label) {
      signals.push({ label: r.label, tone: "critical" });
    }
  }

  for (const r of risks.filter((r) => r?.severity === "moderate").slice(0, 2)) {
    if (r?.label) {
      signals.push({ label: r.label, tone: "moderate" });
    }
  }

  if (signals.length < 3 && uncertaintyFactors.length > 0) {
    signals.push({
      label: "Some items were marked as unsure",
      tone: "unknown",
    });
  }

  /* -------------------------------------------------------
     Verdict explanation
  ------------------------------------------------------- */
  const why =
    asCleanText(analysis?.whyThisVerdict) ||
    asCleanText(analysis?.verdictReason) ||
    "";

  return {
    verdict: VERDICT_META[verdictKey],
    scores: {
      confidence,
      coverage,
    },
    signals: signals.slice(0, 4),
    why,
  };
}

/* =======================================================
   Supporting helpers
======================================================= */

/**
 * Returns a short explanatory blurb for the score section.
 */
export function scoreBlurb(scores: VerdictScores): string {
  if (scores.coverage < 40) {
    return "You didn’t record much, so this result is cautious. It can still help — but check more before you decide.";
  }
  if (scores.confidence < 45) {
    return "Some things need checking. Use the questions below to get clearer answers.";
  }
  return "This is based only on what you recorded. It doesn’t assume anything you didn’t check.";
}

/**
 * Counts risks by severity for quick UI display.
 */
export function countRisksBySeverity(risks: any[]): {
  critical: number;
  moderate: number;
  info: number;
} {
  const out = { critical: 0, moderate: 0, info: 0 };

  for (const r of Array.isArray(risks) ? risks : []) {
    if (r?.severity === "critical") out.critical++;
    else if (r?.severity === "moderate") out.moderate++;
    else out.info++;
  }

  return out;
}
