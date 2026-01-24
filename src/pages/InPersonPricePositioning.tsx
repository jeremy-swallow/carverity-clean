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
} from "lucide-react";

import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadScanById } from "../utils/scanStorage";

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

function buildCleanCarNegotiationTips(args: {
  hasAskingPrice: boolean;
  askingPrice: number | null;
  confidence: number;
  coverage: number;
}) {
  const { hasAskingPrice, askingPrice, confidence, coverage } = args;

  const tips: string[] = [];

  tips.push(
    "Even if the car looks fine, dealerships often price expecting negotiation."
  );

  tips.push(
    "The cleanest way to ask is to be calm, specific, and ready to buy today."
  );

  if (hasAskingPrice && typeof askingPrice === "number") {
    // A small, realistic discount band for “clean car” negotiation
    const smallLow = Math.round(askingPrice * 0.01);
    const smallHigh = Math.round(askingPrice * 0.03);

    tips.push(
      `A normal starting ask (even with no faults) is often around ${formatMoney(
        smallLow
      )}–${formatMoney(smallHigh)} off, depending on the market and how long it’s been listed.`
    );
  }

  if (coverage < 45 || confidence < 45) {
    tips.push(
      "Because some items were not fully checked, you can also ask for value instead of price (fresh service, tyres, warranty extension)."
    );
  } else {
    tips.push(
      "If the seller won’t move on price, ask for value: a fresh service, tyres, detailing, or warranty extension."
    );
  }

  return tips.slice(0, 4);
}

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

  const confidence = clamp(Number(analysis.confidenceScore ?? 0), 0, 100);
  const coverage = clamp(Number(analysis.completenessScore ?? 0), 0, 100);

  const criticalCount = analysis.risks.filter((r) => r.severity === "critical")
    .length;
  const moderateCount = analysis.risks.filter((r) => r.severity === "moderate")
    .length;

  const unsureCount = Array.isArray((analysis as any).uncertaintyFactors)
    ? (analysis as any).uncertaintyFactors.length
    : 0;

  const hasAskingPrice = Boolean(askingPrice && askingPrice > 0);

  const priceGuidance: any = (analysis as any).priceGuidance ?? null;

  const adjustedLow = priceGuidance?.adjustedPriceLowAud ?? null;
  const adjustedHigh = priceGuidance?.adjustedPriceHighAud ?? null;

  const redLow = priceGuidance?.suggestedReductionLowAud ?? null;
  const redHigh = priceGuidance?.suggestedReductionHighAud ?? null;

  const positioning = analysis.negotiationPositioning;

  const postureTone = useMemo(() => {
    return toneForLeverage({
      criticalCount,
      moderateCount,
      unsureCount,
    });
  }, [criticalCount, moderateCount, unsureCount]);

  const postureTitle = useMemo(() => {
    if (!hasAskingPrice) return "Add the advertised price to get a range";
    if (postureTone === "warn") return "You have strong price leverage";
    if (postureTone === "info") return "You have some price leverage";
    return "Even if it looks fine, you can still position the price";
  }, [hasAskingPrice, postureTone]);

  const postureBody = useMemo(() => {
    if (!hasAskingPrice) {
      return "CarVerity can only generate a grounded adjustment range once the advertised asking price is known.";
    }

    if (postureTone === "warn") {
      return "Based on what you recorded, it’s reasonable to ask for a meaningful reduction — or require proof before you pay full price.";
    }

    if (postureTone === "info") {
      return "You recorded a few items worth clarifying. That uncertainty supports a modest reduction or a conditional agreement.";
    }

    return "Car yards often price with negotiation in mind. You can ask for a small reduction based on normal buyer expectations — even if nothing stood out.";
  }, [hasAskingPrice, postureTone]);

  const headlineNumbers = useMemo(() => {
    if (!hasAskingPrice || !Number.isFinite(Number(askingPrice))) return null;
    if (typeof adjustedLow !== "number" || typeof adjustedHigh !== "number")
      return null;

    return {
      adjustedRange: `${formatMoney(adjustedLow)}–${formatMoney(adjustedHigh)}`,
      reductionRange:
        typeof redLow === "number" && typeof redHigh === "number"
          ? `${formatMoney(redLow)}–${formatMoney(redHigh)}`
          : null,
    };
  }, [hasAskingPrice, askingPrice, adjustedLow, adjustedHigh, redLow, redHigh]);

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
        "Use the items you recorded as a reason to either reduce the price or make the deal conditional."
      );
    } else {
      points.push(
        "If the car looks fine, ask for a small reduction based on market norms and the fact you’re ready to buy today."
      );
    }

    points.push(
      "If the seller won’t move, ask for value instead (fresh service, tyres, detailing, warranty extension)."
    );

    return points.slice(0, 4);
  }, [criticalCount, moderateCount, unsureCount]);

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

  const printHint = useMemo(() => {
    if (!hasAskingPrice) {
      return "Tip: enter the asking price on the Summary page to generate a range.";
    }
    return "Tip: you can print/save the report as a PDF if you want to share it with someone.";
  }, [hasAskingPrice]);

  const guidanceRationale: string[] = useMemo(() => {
    const r = Array.isArray(priceGuidance?.rationale)
      ? (priceGuidance.rationale as string[])
      : [];
    return r.map((x) => asText(x)).filter(Boolean).slice(0, 6);
  }, [priceGuidance]);

  /* =========================================================
     NEW: Maths breakdown (step-by-step)
  ========================================================= */

  const askingRange: Range | null = useMemo(() => {
    if (!hasAskingPrice || typeof askingPrice !== "number") return null;
    return { low: askingPrice, high: askingPrice };
  }, [hasAskingPrice, askingPrice]);

  const reductionRange: Range | null = useMemo(() => {
    return normaliseRangeFromGuidance(redLow, redHigh);
  }, [redLow, redHigh]);

  const adjustedRange: Range | null = useMemo(() => {
    return normaliseRangeFromGuidance(adjustedLow, adjustedHigh);
  }, [adjustedLow, adjustedHigh]);

  /**
   * If analysis provides section-level reductions, use them.
   * Otherwise, we fall back to a single “overall” reduction.
   *
   * Expected shape (optional):
   * priceGuidance.breakdown = [
   *   { label: "Critical risks", lowAud: 800, highAud: 2200, reason: "..." },
   *   { label: "Moderate risks", lowAud: 200, highAud: 800, reason: "..." },
   *   { label: "Uncertainty buffer", lowAud: 150, highAud: 500, reason: "..." },
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

        // Ignore empty sections
        if (r.low <= 0 && r.high <= 0) return null;

        return {
          label,
          range: r,
          reason,
        };
      })
      .filter(Boolean) as Array<{ label: string; range: Range; reason: string }>;

    // If no sections provided, fall back to one section using the overall reduction
    if (cleaned.length === 0 && reductionRange) {
      return [
        {
          label: "Evidence-based adjustment",
          range: reductionRange,
          reason:
            "This is a practical reduction window based on what you recorded (concerns, unsure items, and coverage).",
        },
      ];
    }

    return cleaned;
  }, [priceGuidance, reductionRange]);

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

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
      {/* Header */}
      <header className="space-y-4">
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          CarVerity · Price positioning
        </span>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[260px]">
            <h1 className="text-3xl font-semibold text-white leading-tight">
              Price positioning & negotiation
            </h1>
            <p className="text-slate-400 mt-2 leading-relaxed max-w-2xl">
              A buyer-safe way to ask for a better price — even if the car looks
              fine — with clear maths and practical wording.
            </p>
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
              : "Standard negotiation"}
          </div>
        </div>
      </header>

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

        {headlineNumbers && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Buyer-safe target range
              </div>
              <div className="mt-2 text-2xl font-semibold text-white tabular-nums">
                {headlineNumbers.adjustedRange}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Based on the evidence you recorded
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Suggested reduction window
              </div>
              <div className="mt-2 text-2xl font-semibold text-white tabular-nums">
                {headlineNumbers.reductionRange ?? "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                A practical starting point
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
              Go back to Summary and enter the advertised asking price. Then
              return here for a calculated range.
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

      {/* NEW: Maths breakdown */}
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
              This is a simple “start price → subtract a reduction” calculation.
              You don’t need to do the maths yourself — CarVerity shows the
              numbers step-by-step.
            </p>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Starting point
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
                        <div className="text-xs text-slate-500">Subtract</div>
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
                    Buyer-safe target range
                  </div>
                  <div className="mt-1 text-base font-semibold text-white tabular-nums">
                    {adjustedRange ? formatRange(adjustedRange) : "—"}
                  </div>
                </div>
              </div>

              {/* NEW: optional mechanical inspection suggestion (calm + small) */}
              <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Optional next step
                </div>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  If you’re close to buying, an independent pre-purchase
                  inspection can reduce risk — especially if anything was marked
                  as “unsure”.
                </p>
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

      {/* NEW: Clean car negotiation */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-slate-300">
          <Sparkles className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">
            If nothing was wrong (still negotiate)
          </h2>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-4">
          <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
            A “clean” inspection doesn’t mean you pay full sticker price.
            Dealers often build negotiation room into the asking price.
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
                "“I like the car. I’m ready to buy today.\nIf you can do a better price, I can make this easy right now.”"
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
            [
              "conservative",
              "balanced",
              "aggressive",
            ] as Array<"conservative" | "balanced" | "aggressive">
          ).map((k) => {
            const band = positioning[k];
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
