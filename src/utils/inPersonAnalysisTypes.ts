// src/utils/inPersonAnalysisTypes.ts

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

export type EvidenceSummary = {
  summary?: string;
  bullets?: string[];

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

  whyThisVerdict: string;
  whyThisVerdictBullets: string[];

  evidenceSummary: EvidenceSummary;

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
