// src/pages/InPersonPricePositioning.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Scale,
  Printer,
  Calculator,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Receipt,
  TrendingDown,
} from "lucide-react";

import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadScanById } from "../utils/scanStorage";

/* =========================================================
   Small helpers
========================================================= */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMoney(n: unknown): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

function asText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  return "";
}

function tonePill(tone: "good" | "info" | "warn") {
  if (tone === "good") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  }
  if (tone === "warn") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-200";
  }
  return "border-white/15 bg-white/5 text-slate-200";
}

function labelForBandKey(key: "conservative" | "balanced" | "aggressive") {
  if (key === "conservative") return "Conservative";
  if (key === "aggressive") return "Aggressive";
  return "Balanced";
}

function shortBandMeaning(key: "conservative" | "balanced" | "aggressive") {
  if (key === "conservative") {
    return "Low friction. Good if you want a smooth deal.";
  }
  if (key === "aggressive") {
    return "Firm. Only use if you’re prepared to walk away.";
  }
  return "Reasonable middle ground for most buyers.";
}

type Range = { low: number; high: number };

function rangeSubtract(base: Range, reduction: Range): Range {
  return {
    low: base.low - reduction.high,
    high: base.high - reduction.low,
  };
}

function normaliseRangeFromGuidance(
  low: unknown,
  high: unknown
): Range | null {
  if (typeof low !== "number" || typeof high !== "number") return null;
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null;

  const a = Math.min(low, high);
  const b = Math.max(low, high);

  return { low: a, high: b };
}

function sumRanges(ranges: Range[]): Range {
  let low = 0;
  let high = 0;

  for (const r of ranges) {
    low += r.low;
    high += r.high;
  }

  return { low, high };
}

function formatRange(r: Range | null) {
  if (!r) return "—";
  return `${formatMoney(r.low)}–${formatMoney(r.high)}`;
}

function toneForLeverage(args: {
  criticalCount: number;
  moderateCount: number;
  unsureCount: number;
}) {
  const { criticalCount, moderateCount, unsureCount } = args;

  if (criticalCount >= 2) return "warn" as const;
  if (criticalCount >= 1 || moderateCount >= 2 || unsureCount >= 3)
    return "warn" as const;
  if (moderateCount >= 1 || unsureCount >= 1) return "info" as const;
  return "good" as const;
}

/**
 * “Clean car” adjustment band:
 * - keeps the page useful even if no faults were recorded.
 * - many asking prices allow room; this provides a grounded, non-crazy starting range.
 */
function cleanCarReductionBand(askingPrice: number): Range {
  // 1%–3% is “normal buyer expectation” without being silly.
  const low = Math.max(150, Math.round(askingPrice * 0.01));
  const high = Math.max(low + 150, Math.round(askingPrice * 0.03));
  return { low, high };
}

function buildCleanCarNegotiationTips(args: {
  hasAskingPrice: boolean;
  askingPrice: number | null;
  confidence: number;
  coverage: number;
}) {
  const { hasAskingPrice, askingPrice, confidence, coverage } = args;

  const tips: string[] = [];

  tips.push(
    "Even when a car looks clean, asking prices often allow room for discussion."
  );

  tips.push(
    "The cleanest approach is calm and specific — ask once, then decide what you want to do."
  );

  if (hasAskingPrice && typeof askingPrice === "number") {
    const band = cleanCarReductionBand(askingPrice);
    tips.push(
      `A normal starting adjustment (even with no faults) is often around ${formatMoney(
        band.low
      )}–${formatMoney(
        band.high
      )}, depending on demand and how long it’s been listed.`
    );
  }

  if (coverage < 45 || confidence < 45) {
    tips.push(
      "If a few items weren’t fully checked, you can also ask for value instead of price (fresh service, tyres, warranty extension)."
    );
  } else {
    tips.push(
      "If they won’t move on price, ask for value: a fresh service, tyres, detailing, or warranty extension."
    );
  }

  return tips.slice(0, 4);
}

/* =========================================================
   Page
========================================================= */
export default function InPersonPricePositioning() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();

  const [showMath, setShowMath] = useState(true);

  useEffect(() => {
    if (!scanId) navigate("/scan/in-person/start", { replace: true });
  }, [scanId, navigate]);

  if (!scanId) return null;

  const saved = useMemo(() => loadScanById(scanId), [scanId]);
  const progressFallback: any = loadProgress();
  const progress: any = saved?.progressSnapshot ?? progressFallback ?? {};

  const analysis = useMemo(() => {
    if (saved?.analysis) return saved.analysis;
    return analyseInPersonInspection(progress);
  }, [saved, progress]);

  const askingPrice =
    typeof progress?.askingPrice === "number" ? progress.askingPrice : null;

  const confidence = clamp(
    Number((analysis as any)?.confidenceScore ?? 0),
    0,
    100
  );
  const coverage = clamp(
    Number((analysis as any)?.completenessScore ?? 0),
    0,
    100
  );

  const risks = Array.isArray((analysis as any)?.risks)
    ? (analysis as any).risks
    : [];
  const criticalCount = risks.filter((r: any) => r?.severity === "critical")
    .length;
  const moderateCount = risks.filter((r: any) => r?.severity === "moderate")
    .length;

  const unsureCount = Array.isArray((analysis as any)?.uncertaintyFactors)
    ? (analysis as any).uncertaintyFactors.length
    : 0;

  const hasAskingPrice = Boolean(askingPrice && askingPrice > 0);

  const priceGuidance: any = (analysis as any)?.priceGuidance ?? null;

  const adjustedLow = priceGuidance?.adjustedPriceLowAud ?? null;
  const adjustedHigh = priceGuidance?.adjustedPriceHighAud ?? null;

  const redLow = priceGuidance?.suggestedReductionLowAud ?? null;
  const redHigh = priceGuidance?.suggestedReductionHighAud ?? null;

  const positioning: any = (analysis as any)?.negotiationPositioning ?? null;

  // Optional market context (range-based, not a valuation)
  const marketLow = priceGuidance?.marketRangeLowAud ?? null;
  const marketHigh = priceGuidance?.marketRangeHighAud ?? null;
  const marketBasis = asText(priceGuidance?.marketBasis);
  const marketNotes = asText(priceGuidance?.marketNotes);

  const postureTone = useMemo(() => {
    return toneForLeverage({
      criticalCount,
      moderateCount,
      unsureCount,
    });
  }, [criticalCount, moderateCount, unsureCount]);

  const postureTitle = useMemo(() => {
    if (!hasAskingPrice) return "Add the advertised price to get a range";
    if (postureTone === "warn") return "You’ve got stronger price leverage";
    if (postureTone === "info") return "You’ve got some price leverage";
    return "Even if it looked clean, you can still position the price";
  }, [hasAskingPrice, postureTone]);

  const postureBody = useMemo(() => {
    if (!hasAskingPrice) {
      return "CarVerity can generate a grounded positioning range once the advertised asking price is known.";
    }

    if (postureTone === "warn") {
      return "Based on what you recorded, it’s reasonable to seek a meaningful adjustment — or ask for proof before paying full sticker.";
    }

    if (postureTone === "info") {
      return "You recorded a few items worth clarifying. That uncertainty supports a modest adjustment or a conditional agreement.";
    }

    return "Asking prices often allow room for discussion. You can aim for a small, reasonable adjustment — even if nothing stood out.";
  }, [hasAskingPrice, postureTone]);

  const guidanceRationale: string[] = useMemo(() => {
    const r = Array.isArray(priceGuidance?.rationale)
      ? (priceGuidance.rationale as string[])
      : [];
    return r.map((x) => asText(x)).filter(Boolean).slice(0, 6);
  }, [priceGuidance]);

  /* =========================================================
     Maths breakdown (step-by-step)
  ========================================================= */

  const askingRange: Range | null = useMemo(() => {
    if (!hasAskingPrice || typeof askingPrice !== "number") return null;
    return { low: askingPrice, high: askingPrice };
  }, [hasAskingPrice, askingPrice]);

  const reductionRangeFromAnalysis: Range | null = useMemo(() => {
    return normaliseRangeFromGuidance(redLow, redHigh);
  }, [redLow, redHigh]);

  const adjustedRangeFromAnalysis: Range | null = useMemo(() => {
    return normaliseRangeFromGuidance(adjustedLow, adjustedHigh);
  }, [adjustedLow, adjustedHigh]);

  const marketRangeFromGuidance: Range | null = useMemo(() => {
    return normaliseRangeFromGuidance(marketLow, marketHigh);
  }, [marketLow, marketHigh]);

  /* =========================================================
     NEW — Asking vs market clarity (ABOVE / WITHIN / BELOW)
  ========================================================= */
  const marketPosition = useMemo(() => {
    if (!marketRangeFromGuidance) return null;
    if (!hasAskingPrice || typeof askingPrice !== "number") return null;

    if (askingPrice > marketRangeFromGuidance.high) {
      return {
        label: "ABOVE market range" as const,
        direction: "above" as const,
        diff: Math.round(askingPrice - marketRangeFromGuidance.high),
      };
    }

    if (askingPrice < marketRangeFromGuidance.low) {
      return {
        label: "BELOW market range" as const,
        direction: "below" as const,
        diff: Math.round(marketRangeFromGuidance.low - askingPrice),
      };
    }

    return {
      label: "WITHIN market range" as const,
      direction: "within" as const,
      diff: 0,
    };
  }, [marketRangeFromGuidance, hasAskingPrice, askingPrice]);

  /**
   * If there are no recorded faults, we still want a meaningful “math result”.
   * So we compute a standard dealer discussion band (1%–3%) as a fallback.
   */
  const cleanCarReduction: Range | null = useMemo(() => {
    if (!hasAskingPrice || typeof askingPrice !== "number") return null;
    return cleanCarReductionBand(askingPrice);
  }, [hasAskingPrice, askingPrice]);

  const effectiveReductionRange: Range | null = useMemo(() => {
    // Prefer evidence-based reduction from analysis.
    if (reductionRangeFromAnalysis) return reductionRangeFromAnalysis;

    // Otherwise fall back to a “clean car” standard band.
    if (cleanCarReduction) return cleanCarReduction;

    return null;
  }, [reductionRangeFromAnalysis, cleanCarReduction]);

  const effectiveAdjustedRange: Range | null = useMemo(() => {
    // Prefer analysis-provided adjusted range.
    if (adjustedRangeFromAnalysis) return adjustedRangeFromAnalysis;

    // If we have asking price + reduction range, compute adjusted = asking - reduction.
    if (askingRange && effectiveReductionRange) {
      return rangeSubtract(askingRange, effectiveReductionRange);
    }

    return null;
  }, [adjustedRangeFromAnalysis, askingRange, effectiveReductionRange]);

  /**
   * Optional breakdown from analysis:
   * priceGuidance.breakdown = [
   *   { label: "...", lowAud: 800, highAud: 2200, reason: "..." },
   * ]
   */
  const breakdownSections = useMemo(() => {
    const raw = Array.isArray(priceGuidance?.breakdown)
      ? (priceGuidance.breakdown as any[])
      : [];

    const cleaned = raw
      .map((s) => {
        const label = asText(s?.label) || asText(s?.title) || "Adjustment";
        const lowAud = Number(s?.lowAud ?? s?.low ?? 0);
        const highAud = Number(s?.highAud ?? s?.high ?? 0);
        const reason = asText(s?.reason) || asText(s?.rationale) || "";

        if (!Number.isFinite(lowAud) || !Number.isFinite(highAud)) return null;

        const r = normaliseRangeFromGuidance(lowAud, highAud);
        if (!r) return null;

        if (r.low <= 0 && r.high <= 0) return null;

        return {
          label,
          range: r,
          reason,
        };
      })
      .filter(Boolean) as Array<{ label: string; range: Range; reason: string }>;

    // If we don't have breakdown sections, create one section using effective reduction
    if (cleaned.length === 0 && effectiveReductionRange) {
      const label =
        reductionRangeFromAnalysis != null
          ? "Evidence-based adjustment"
          : "Standard discussion range";

      const reason =
        reductionRangeFromAnalysis != null
          ? "This adjustment window is based on what you recorded (concerns, unsure items, and coverage)."
          : "Even clean cars are often priced with room. This is a realistic starting range for a smooth outcome.";

      return [
        {
          label,
          range: effectiveReductionRange,
          reason,
        },
      ];
    }

    return cleaned;
  }, [priceGuidance, effectiveReductionRange, reductionRangeFromAnalysis]);

  const breakdownTotal = useMemo(() => {
    const ranges = breakdownSections.map((s) => s.range);
    if (ranges.length === 0) return null;
    return sumRanges(ranges);
  }, [breakdownSections]);

  const runningMathRows = useMemo(() => {
    if (!askingRange) return [];

    const rows: Array<{
      label: string;
      start: Range;
      reduction?: Range;
      end: Range;
      reason?: string;
    }> = [];

    let current: Range = { ...askingRange };

    for (const section of breakdownSections) {
      const next = rangeSubtract(current, section.range);

      rows.push({
        label: section.label,
        start: current,
        reduction: section.range,
        end: next,
        reason: section.reason,
      });

      current = next;
    }

    return rows;
  }, [askingRange, breakdownSections]);

  const cleanCarTips = useMemo(() => {
    return buildCleanCarNegotiationTips({
      hasAskingPrice,
      askingPrice,
      confidence,
      coverage,
    });
  }, [hasAskingPrice, askingPrice, confidence, coverage]);

  const leverageBullets = useMemo(() => {
    const bullets: string[] = [];

    if (criticalCount > 0) {
      bullets.push(
        criticalCount === 1
          ? "1 high-impact item was recorded."
          : `${criticalCount} high-impact items were recorded.`
      );
    }

    if (moderateCount > 0) {
      bullets.push(
        moderateCount === 1
          ? "1 meaningful item was recorded."
          : `${moderateCount} meaningful items were recorded.`
      );
    }

    if (unsureCount > 0) {
      bullets.push(
        unsureCount === 1
          ? "1 item was marked as unsure (unknown)."
          : `${unsureCount} items were marked as unsure (unknown).`
      );
    }

    bullets.push(`Confidence: ${confidence}%`);
    bullets.push(`Coverage: ${coverage}%`);

    return bullets;
  }, [criticalCount, moderateCount, unsureCount, confidence, coverage]);

  const buyerSafeTalkingPoints = useMemo(() => {
    const points: string[] = [];

    points.push(
      "Keep it calm and factual. You’re not accusing the seller — you’re reducing uncertainty."
    );

    if (criticalCount > 0) {
      points.push(
        "Start with the biggest recorded items first. Ask for proof (invoice, inspection note, written confirmation)."
      );
    } else if (moderateCount > 0 || unsureCount > 0) {
      points.push(
        "Use the items you recorded as a reason to either adjust the price or make the deal conditional."
      );
    } else {
      points.push(
        "If the car looked clean, ask once for a small adjustment based on market norms and the fact you’re ready to proceed."
      );
    }

    points.push(
      "If they won’t move, ask for value instead (fresh service, tyres, detailing, warranty extension)."
    );

    return points.slice(0, 4);
  }, [criticalCount, moderateCount, unsureCount]);

  const printHint = useMemo(() => {
    if (!hasAskingPrice) {
      return "Tip: enter the asking price on the Summary page to generate a range.";
    }
    return "Tip: you can print/save the report as a PDF if you want to share it with someone.";
  }, [hasAskingPrice]);

  /**
   * Firmness bands:
   * - If we have an adjusted range, derive conservative/balanced/aggressive around it.
   * - Otherwise fall back to analysis.negotiationPositioning (existing logic).
   */
  const firmnessBands = useMemo(() => {
    const fallback = positioning;

    if (
      !effectiveAdjustedRange ||
      !hasAskingPrice ||
      typeof askingPrice !== "number"
    ) {
      return fallback;
    }

    // Build three bands around the effective adjusted range:
    // Conservative: near top of range
    // Balanced: middle of range
    // Aggressive: near bottom of range
    const low = effectiveAdjustedRange.low;
    const high = effectiveAdjustedRange.high;

    const spread = Math.max(0, high - low);

    const conservative: Range = {
      low: Math.round(high - spread * 0.35),
      high: Math.round(high),
    };

    const balanced: Range = {
      low: Math.round(low + spread * 0.25),
      high: Math.round(high - spread * 0.15),
    };

    const aggressive: Range = {
      low: Math.round(low),
      high: Math.round(low + spread * 0.45),
    };

    const safe = (r: Range) => ({
      audLow: Math.min(r.low, r.high),
      audHigh: Math.max(r.low, r.high),
    });

    return {
      conservative: {
        ...safe(conservative),
        rationale:
          "Closer to asking price. Works well if the car is in demand or you want a smooth, fast outcome.",
      },
      balanced: {
        ...safe(balanced),
        rationale:
          "A reasonable middle position. Best default for most situations.",
      },
      aggressive: {
        ...safe(aggressive),
        rationale:
          "A firmer position. Use only if you’re comfortable walking away if they won’t meet you.",
      },
    };
  }, [positioning, effectiveAdjustedRange, hasAskingPrice, askingPrice]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
      {/* Header */}
      <header className="space-y-4">
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          CarVerity · Price reflection
        </span>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[260px]">
            <h1 className="text-3xl font-semibold text-white leading-tight">
              Price reflection & positioning
            </h1>
            <p className="text-slate-400 mt-2 leading-relaxed max-w-2xl">
              A calm way to think through the asking price using what you
              observed — with clear maths and practical guidance.
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Guidance only. This reflects inspection notes and common market
                behaviour — not a valuation, repair estimate, or a substitute for
                a mechanical inspection.
              </p>
            </div>
          </div>

          <div
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
              tonePill(postureTone),
            ].join(" ")}
          >
            <BadgeDollarSign className="h-4 w-4 text-slate-200" />
            {postureTone === "warn"
              ? "Stronger leverage"
              : postureTone === "info"
              ? "Some leverage"
              : "Standard range"}
          </div>
        </div>
      </header>

      {/* Market context (optional) */}
      {(marketRangeFromGuidance ||
        (hasAskingPrice && typeof askingPrice === "number")) && (
        <section className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-3">
          <div className="flex items-center gap-3 text-slate-300">
            <Info className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold">
              Market context (not a valuation)
            </h2>
          </div>

          {marketRangeFromGuidance ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Typical advertised range
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white tabular-nums">
                    {formatRange(marketRangeFromGuidance)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Based on similar listings in Australia
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Asking price
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white tabular-nums">
                    {hasAskingPrice && askingRange
                      ? formatMoney(askingRange.low)
                      : "—"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Use this as context, not a rule
                  </div>

                  {/* NEW: Above/within/below clarity */}
                  {marketPosition && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold text-white">
                          {marketPosition.label}
                        </span>
                        {marketPosition.diff > 0 && (
                          <>
                            {" "}
                            · ≈{" "}
                            <span className="font-semibold text-white">
                              {formatMoney(marketPosition.diff)}
                            </span>{" "}
                            {marketPosition.direction}
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {(marketBasis || marketNotes) && (
                <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
                  {marketBasis && (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-slate-300 font-semibold">Basis:</span>{" "}
                      {marketBasis}
                    </p>
                  )}
                  {marketNotes && (
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      {marketNotes}
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-500 leading-relaxed">
                Condition, service history, location, and demand can move prices
                up or down. If you’re unsure, a qualified mechanic inspection can
                help confirm risk before committing.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
              Market context is optional and may appear here when available.
              CarVerity won’t guess a “value” — it only shows ranges when it has
              enough information.
            </p>
          )}
        </section>
      )}

      {/* Posture */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-4">
        <div className="flex items-start gap-3">
          {postureTone === "warn" ? (
            <AlertTriangle className="h-5 w-5 text-amber-300 mt-0.5" />
          ) : postureTone === "good" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-300 mt-0.5" />
          ) : (
            <Info className="h-5 w-5 text-slate-300 mt-0.5" />
          )}

          <div className="min-w-0">
            <p className="text-base font-semibold text-white">{postureTitle}</p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              {postureBody}
            </p>
          </div>
        </div>

        {/* Headline numbers */}
        {hasAskingPrice && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Suggested positioning range
              </div>
              <div className="mt-2 text-2xl font-semibold text-white tabular-nums">
                {effectiveAdjustedRange ? formatRange(effectiveAdjustedRange) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Based on your inspection + common asking-price behaviour
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Suggested adjustment window
              </div>
              <div className="mt-2 text-2xl font-semibold text-white tabular-nums">
                {effectiveReductionRange ? formatRange(effectiveReductionRange) : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                A practical range to consider (no pressure to use it)
              </div>
            </div>
          </div>
        )}

        {!hasAskingPrice && (
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-200 font-semibold">
              Asking price missing
            </p>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Enter the advertised asking price on Summary. Then return here for
              a calculated range.
            </p>

            <div className="mt-3">
              <button
                onClick={() => navigate("/scan/in-person/summary")}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 text-sm"
              >
                Back to summary
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Maths breakdown */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-slate-300">
            <Calculator className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold">How the maths works</h2>
          </div>

          <button
            type="button"
            onClick={() => setShowMath((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-3 py-2 text-sm text-slate-200"
          >
            {showMath ? (
              <>
                Hide breakdown <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show breakdown <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {showMath && (
          <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-5">
            <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
              This is a simple calculation:{" "}
              <span className="text-slate-200 font-semibold">Asking price</span>{" "}
              minus a{" "}
              <span className="text-slate-200 font-semibold">
                reduction window
              </span>
              .
              <br />
              CarVerity shows the numbers step-by-step so you don’t have to do
              the maths yourself.
            </p>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-4">
              <div className="flex items-center gap-2 text-slate-300">
                <Receipt className="h-4 w-4 text-slate-400" />
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Starting point
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-400">Asking price</div>
                <div className="text-lg font-semibold text-white tabular-nums">
                  {askingRange ? formatMoney(askingRange.low) : "—"}
                </div>
              </div>
            </div>

            {runningMathRows.length > 0 ? (
              <div className="space-y-3">
                {runningMathRows.map((row, idx) => (
                  <div
                    key={`${row.label}-${idx}`}
                    className="rounded-2xl border border-white/10 bg-slate-950/30 px-5 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-[220px]">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Step {idx + 1}
                        </div>
                        <div className="mt-1 text-base font-semibold text-white">
                          {row.label}
                        </div>

                        {row.reason ? (
                          <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-xl">
                            {row.reason}
                          </p>
                        ) : null}
                      </div>

                      <div className="min-w-[220px] text-right">
                        <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
                          <TrendingDown className="h-3.5 w-3.5" />
                          Subtract
                        </div>

                        <div className="mt-1 text-base font-semibold text-slate-100 tabular-nums">
                          {row.reduction
                            ? `${formatMoney(row.reduction.low)}–${formatMoney(
                                row.reduction.high
                              )}`
                            : "—"}
                        </div>

                        <div className="mt-3 text-xs text-slate-500">
                          New running range
                        </div>
                        <div className="mt-1 text-base font-semibold text-white tabular-nums">
                          {formatRange(row.end)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Add the asking price on Summary to generate the maths breakdown.
              </p>
            )}

            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Final result
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
                  <div className="text-xs text-slate-500">Total reduction</div>
                  <div className="mt-1 text-base font-semibold text-white tabular-nums">
                    {breakdownTotal ? formatRange(breakdownTotal) : "—"}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
                  <div className="text-xs text-slate-500">
                    Suggested positioning range
                  </div>
                  <div className="mt-1 text-base font-semibold text-white tabular-nums">
                    {effectiveAdjustedRange ? formatRange(effectiveAdjustedRange) : "—"}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Note: This is guidance only. It does not estimate repair costs
                or replace a mechanical inspection.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Leverage snapshot */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-slate-300">
          <ShieldCheck className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">What this is based on</h2>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6">
          <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-300">
            {leverageBullets.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>

          <p className="text-xs text-slate-500 mt-4">
            CarVerity doesn’t “fill in gaps”. If something wasn’t checked, it’s
            treated as unknown — not good or bad.
          </p>
        </div>
      </section>

      {/* Clean car guidance */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-slate-300">
          <Sparkles className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">If the car looked clean</h2>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-4">
          <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
            A “clean” inspection doesn’t automatically mean you pay full sticker
            price. Asking prices often allow room for discussion — without
            needing to be aggressive.
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-300">
            {cleanCarTips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>

          <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Buyer-safe wording
            </div>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {
                "“I like the car. I’m ready to move forward.\nIf there’s any flexibility on price, I can make this easy today.”"
              }
            </p>
          </div>
        </div>
      </section>

      {/* Positioning bands */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-slate-300">
          <Scale className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">How firm should you be?</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {(
            ["conservative", "balanced", "aggressive"] as Array<
              "conservative" | "balanced" | "aggressive"
            >
          ).map((k) => {
            const band = firmnessBands?.[k];

            if (!band) {
              return (
                <div
                  key={k}
                  className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-3"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {labelForBandKey(k)}
                  </div>
                  <div className="text-sm text-slate-400">
                    Enter the asking price to generate this band.
                  </div>
                </div>
              );
            }

            return (
              <div
                key={k}
                className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-3"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {labelForBandKey(k)}
                </div>

                <div className="text-2xl font-semibold text-white tabular-nums">
                  {formatMoney(band.audLow)}–{formatMoney(band.audHigh)}
                </div>

                <div className="text-sm text-slate-400 leading-relaxed">
                  {shortBandMeaning(k)}
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Rationale
                  </div>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    {band.rationale}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">
          These numbers are guidance only. They do not estimate repair costs or
          represent a market valuation.
        </p>
      </section>

      {/* Buyer-safe approach */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-slate-300">
          <Info className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">Buyer-safe approach</h2>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-4">
          <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-300">
            {buyerSafeTalkingPoints.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>

          {guidanceRationale.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Why this range exists
              </div>
              <ul className="mt-2 list-disc list-inside space-y-1.5 text-sm text-slate-300">
                {guidanceRationale.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="text-slate-200 font-semibold">Tip:</span>{" "}
              {printHint}
            </p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="space-y-3 pt-2">
        <button
          onClick={() => navigate(`/scan/in-person/results/${scanId}`)}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4 text-base inline-flex items-center justify-center gap-2"
        >
          Back to report
          <ArrowRight className="h-5 w-5" />
        </button>

        <button
          onClick={() => navigate(`/scan/in-person/print/${scanId}`)}
          className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 flex items-center justify-center gap-2 text-sm"
        >
          <Printer className="h-4 w-4" />
          Print / save report
        </button>
      </section>
    </div>
  );
}
