// src/utils/decisionPricing.ts

export type PricingVerdict = "proceed" | "caution" | "walk-away";
export type PricingBandKey = "conservative" | "target" | "upper";

export type PriceBand = {
  key: PricingBandKey;
  label: string;
  min: number;
  max: number;
  note: string;
  emphasis?: boolean;
};

export type GuidedPricingOutput =
  | {
      mode: "needs_price";
      title: string;
      guidance: string[];
      disclaimer: string;
    }
  | {
      mode: "ok";
      title: string;
      subtitle: string;
      recommendedKey: PricingBandKey;
      bands: PriceBand[];
      whyThisRange: string[];
      howToUse: string[];
      whatMovesItUp: string[];
      guardrails: string[];
      confidenceNote: string;
    };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round100(n: number) {
  return Math.round(n / 100) * 100;
}

function safeMoney(n: number) {
  return Math.max(0, Math.round(n));
}

function bandLabelForKey(key: PricingBandKey) {
  if (key === "conservative") return "Conservative offer";
  if (key === "upper") return "Upper bound";
  return "Reasonable target";
}

/**
 * Guided price positioning for decision-making.
 * Not a market valuation — a buyer-side risk posture.
 */
export function buildGuidedPricePositioning(params: {
  askingPrice: number | null | undefined;
  verdict: PricingVerdict;
  confidenceScore: number;
  criticalCount: number;
  moderateCount: number;
  unsureCount: number;
}): GuidedPricingOutput {
  const rawAsking = params.askingPrice;

  if (typeof rawAsking !== "number" || !Number.isFinite(rawAsking) || rawAsking <= 0) {
    return {
      mode: "needs_price",
      title: "Price positioning & negotiation",
      guidance: [
        "To guide you to a realistic offer range, we need the seller’s asking price.",
        "Once entered, CarVerity will suggest a buyer-safe range based on what you recorded.",
        "This isn’t a market valuation — it’s a risk-aware posture to reduce regret.",
      ],
      disclaimer:
        "Tip: If you’re not ready to enter a price yet, focus on resolving evidence first.",
    };
  }

  // 🔒 From here on, price is guaranteed
  const askingPrice: number = rawAsking;

  const confidence = clamp(Number(params.confidenceScore ?? 0), 0, 100);
  const critical = Math.max(0, params.criticalCount);
  const moderate = Math.max(0, params.moderateCount);
  const unsure = Math.max(0, params.unsureCount);

  /* -------------------------------------------------------
     Base posture by verdict
  ------------------------------------------------------- */
  let baseMinPct = 0.02;
  let baseMaxPct = 0.05;

  if (params.verdict === "caution") {
    baseMinPct = 0.05;
    baseMaxPct = 0.1;
  } else if (params.verdict === "walk-away") {
    baseMinPct = 0.1;
    baseMaxPct = 0.2;
  }

  /* -------------------------------------------------------
     Risk & uncertainty adjustments
  ------------------------------------------------------- */
  const criticalAdj = critical * 0.03;
  const moderateAdj = moderate * 0.015;
  const unsureAdj = unsure * 0.01;

  const confidenceWidthAdj =
    confidence >= 75 ? 0 : confidence >= 55 ? 0.01 : confidence >= 35 ? 0.02 : 0.03;

  const confidenceProtectAdj =
    confidence >= 75 ? 0 : confidence >= 55 ? 0.005 : confidence >= 35 ? 0.01 : 0.015;

  const totalDownAdj = clamp(
    criticalAdj + moderateAdj + unsureAdj + confidenceProtectAdj,
    0,
    0.28
  );

  const minPct = clamp(baseMinPct + totalDownAdj, 0.01, 0.35);
  const maxPct = clamp(baseMaxPct + totalDownAdj + confidenceWidthAdj, minPct + 0.02, 0.4);

  /* -------------------------------------------------------
     Build bands
  ------------------------------------------------------- */
  const targetMidPct = (minPct + maxPct) / 2;
  const spreadPct = clamp((maxPct - minPct) * 0.8, 0.03, 0.1);

  const conservativeMinPct = clamp(targetMidPct + spreadPct * 0.8, 0.03, 0.45);
  const conservativeMaxPct = clamp(
    targetMidPct + spreadPct * 1.4,
    conservativeMinPct + 0.02,
    0.5
  );

  const upperMinPct = clamp(targetMidPct - spreadPct * 1.0, 0, 0.3);
  const upperMaxPct = clamp(upperMinPct + 0.02, upperMinPct + 0.02, 0.35);

  function pctToOfferRange(pctLow: number, pctHigh: number) {
    const hi = askingPrice * (1 - pctLow);
    const lo = askingPrice * (1 - pctHigh);
    return {
      min: safeMoney(round100(lo)),
      max: safeMoney(round100(hi)),
    };
  }

  const conservative = pctToOfferRange(conservativeMinPct, conservativeMaxPct);
  const target = pctToOfferRange(minPct, maxPct);
  const upper = pctToOfferRange(upperMinPct, upperMaxPct);

  let recommendedKey: PricingBandKey = "target";
  if (params.verdict === "walk-away") recommendedKey = "conservative";
  else if (params.verdict === "proceed") {
    recommendedKey =
      confidence >= 65 && unsure <= 1 && critical === 0 ? "upper" : "target";
  }

  const bands: PriceBand[] = [
    {
      key: "conservative",
      label: bandLabelForKey("conservative"),
      ...conservative,
      note: "Maximum protection if key items remain unresolved.",
      emphasis: recommendedKey === "conservative",
    },
    {
      key: "target",
      label: bandLabelForKey("target"),
      ...target,
      note: "Where informed buyers typically land given the recorded risk.",
      emphasis: recommendedKey === "target",
    },
    {
      key: "upper",
      label: bandLabelForKey("upper"),
      ...upper,
      note: "Only reasonable if evidence is clean and nothing new appears.",
      emphasis: recommendedKey === "upper",
    },
  ];

  return {
    mode: "ok",
    title: "Price positioning & negotiation",
    subtitle:
      params.verdict === "walk-away"
        ? "Price alone may not offset the risk — but this shows a risk-aware posture."
        : "A realistic offer posture based on what you recorded.",
    recommendedKey,
    bands,
    confidenceNote:
      confidence >= 75
        ? "High confidence allows a tighter range."
        : confidence >= 55
        ? "Moderate confidence — verify before moving upward."
        : "Low confidence — treat unknowns as risk until proven.",
    whyThisRange: [
      "Concerns reduce how much risk a buyer should accept at the asking price.",
      "Unknowns widen the range because unverified items should not be assumed away.",
      "Clear evidence supports moving upward — vague answers do not.",
    ],
    howToUse: [
      "Resolve evidence first, then discuss price.",
      "Use the recommended band as default.",
      "Move upward only when proof is clear and consistent.",
    ],
    whatMovesItUp: [
      "Invoices or written confirmation for key items.",
      "Unknowns becoming confirmed.",
      "No new issues on a second look or drive.",
    ],
    guardrails: [
      "This is not a market valuation.",
      "Consider an independent inspection if close to buying.",
    ],
  };
}
