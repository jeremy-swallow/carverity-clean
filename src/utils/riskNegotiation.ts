export type NegotiationImpactLevel = "low" | "moderate" | "high";

export interface NegotiationGuidanceBlock {
  title: string;
  talkingPoints: string[];
  costImpact?: {
    level: NegotiationImpactLevel;
    rangeHint: string;
    notes?: string;
  };
  buyerAction: string;
}

/**
 * Detects whether language implies a service entry was
 * CLAIMED AS COMPLETED vs simply scheduled.
 */
function looksLikeCompletedServiceClaim(text: string): boolean {
  const t = text.toLowerCase();

  return (
    t.includes("serviced on") ||
    t.includes("service completed") ||
    t.includes("recently serviced") ||
    t.includes("full service history verified") ||
    t.includes("maintenance completed") ||
    t.includes("last service was") ||
    t.includes("has been serviced")
  );
}

/**
 * Detects typical “scheduled service / logbook interval” phrasing.
 * These should NOT be treated as risks.
 */
function looksLikeScheduledServiceEntry(text: string): boolean {
  const t = text.toLowerCase();

  return (
    t.includes("next service due") ||
    t.includes("scheduled service") ||
    t.includes("service interval") ||
    t.includes("logbook schedule") ||
    t.includes("maintenance schedule") ||
    t.includes("service at") || // e.g. “Service at 120,000km or Aug 2025”
    t.includes("due at") ||
    t.includes("upcoming service")
  );
}

/**
 * Negotiation guidance engine — now calibrated so that
 * service-history “future dates” are treated correctly.
 */
export function buildNegotiationGuidanceFromText(
  body: string
): NegotiationGuidanceBlock | null {
  if (!body) return null;

  const lower = body.toLowerCase();

  /**
   * 🚫 Prevent false-positive risk classification
   * If the text looks like a scheduled / future service entry,
   * we return a neutral / reassurance block instead of a risk.
   */
  if (looksLikeScheduledServiceEntry(lower)) {
    return {
      title: "Service schedule information",
      talkingPoints: [
        "These entries appear to describe upcoming or scheduled services rather than past maintenance",
        "Confirm whether the logbook also includes records of previous completed services",
      ],
      costImpact: {
        level: "low",
        rangeHint: "No immediate concern — this is normal logbook behaviour",
      },
      buyerAction:
        "Use scheduled entries as context only — focus discussion on the most recent completed service.",
    };
  }

  /**
   * 🟡 Only treat service history as a risk if BOTH:
   * 1) The wording implies a completed/verified service, AND
   * 2) The kilometre or date context appears contradictory
   */
  if (
    looksLikeCompletedServiceClaim(lower) &&
    (lower.includes("inconsistent") ||
      lower.includes("does not match") ||
      lower.includes("cannot be verified") ||
      lower.includes("discrepancy") ||
      lower.includes("questionable"))
  ) {
    return {
      title: "Negotiation leverage — clarify service documentation",
      talkingPoints: [
        "Ask the seller to provide photos of the full service logbook pages",
        "Request invoices or dealer receipts for the most recent completed service",
        "Confirm whether any entries were pre-stamped or future-dated by a dealer",
      ],
      costImpact: {
        level: "moderate",
        rangeHint: "$300 – $1,200 if missing work needs to be completed",
      },
      buyerAction:
        "Proceed only once records are confirmed — or negotiate to reflect uncertainty in the history.",
    };
  }

  /**
   * Default neutral fallback — avoids over-flagging
   */
  return null;
}
