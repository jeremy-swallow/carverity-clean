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
 * Maps risk-section text into practical negotiation leverage & guidance.
 * Falls back safely if the AI output did not include structured tags.
 */
export function buildNegotiationGuidanceFromText(
  body: string
): NegotiationGuidanceBlock | null {
  if (!body) return null;

  const lower = body.toLowerCase();

  // Major odometer / compliance / inconsistency risks
  if (
    lower.includes("inconsistency") ||
    lower.includes("odometer") ||
    lower.includes("service entry") ||
    lower.includes("mileage mismatch")
  ) {
    return {
      title: "Negotiation leverage — documentation inconsistency",
      talkingPoints: [
        "Ask the seller to provide the full service log or dealer history",
        "Request written clarification for the inconsistent entry",
        "Confirm whether the odometer reading has ever been corrected or repaired",
      ],
      costImpact: {
        level: "high",
        rangeHint: "$400 – $2,000+ if issues are confirmed",
        notes:
          "Potential resale value impact and possible inspection or rectification costs.",
      },
      buyerAction:
        "Proceed only after clarification — or negotiate a price reduction to account for uncertainty.",
    };
  }

  // Wear-and-tear / maintenance advisories
  if (
    lower.includes("wear") ||
    lower.includes("age related") ||
    lower.includes("tyres") ||
    lower.includes("brakes") ||
    lower.includes("upcoming service")
  ) {
    return {
      title: "Negotiation leverage — upcoming maintenance",
      talkingPoints: [
        "Confirm whether maintenance has been booked or already completed",
        "Ask for invoices or written confirmation if recently serviced",
        "Highlight that the vehicle may require spend shortly after purchase",
      ],
      costImpact: {
        level: "moderate",
        rangeHint: "$300 – $1,200 expected depending on findings",
      },
      buyerAction:
        "Use this to justify a price reduction or agreement to complete the work before sale.",
    };
  }

  // Minor advisories / reassurance notes
  if (
    lower.includes("generally positive") ||
    lower.includes("no major risk") ||
    lower.includes("low concern")
  ) {
    return {
      title: "Ownership outlook",
      talkingPoints: [
        "This listing does not present strong negotiation risk points",
        "You may still compare against similar listings to validate price",
      ],
      costImpact: {
        level: "low",
        rangeHint: "No immediate cost risk identified from this section",
      },
      buyerAction:
        "Use this section as reassurance rather than a price-pressure item.",
    };
  }

  // Default fallback — only show if the text hints at risk
  if (
    lower.includes("risk") ||
    lower.includes("concern") ||
    lower.includes("issue")
  ) {
    return {
      title: "Negotiation leverage — clarify before committing",
      talkingPoints: [
        "Request clarification or supporting evidence from the seller",
        "Ask for inspection or documentation that resolves the concern",
      ],
      buyerAction:
        "Seek more certainty — or negotiate to reflect potential downside.",
    };
  }

  return null;
}
