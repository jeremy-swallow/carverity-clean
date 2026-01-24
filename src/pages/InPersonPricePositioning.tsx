// src/pages/InPersonPricePositioning.tsx

import { useEffect, useMemo } from "react";
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
  Handshake,
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

type DeductionRow = {
  label: string;
  low: number;
  high: number;
  note?: string;
};

function safeNum(v: unknown): number | null {
  if (typeof v !== "number") return null;
  if (!Number.isFinite(v)) return null;
  return v;
}

export default function InPersonPricePositioning() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();

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

  const adjustedLow = safeNum(priceGuidance?.adjustedPriceLowAud);
  const adjustedHigh = safeNum(priceGuidance?.adjustedPriceHighAud);

  const redLow = safeNum(priceGuidance?.suggestedReductionLowAud);
  const redHigh = safeNum(priceGuidance?.suggestedReductionHighAud);

  const positioning = analysis.negotiationPositioning;

  const postureTone: "good" | "info" | "warn" = useMemo(() => {
    if (criticalCount >= 2) return "warn";
    if (criticalCount >= 1 || moderateCount >= 2 || unsureCount >= 3)
      return "warn";
    if (moderateCount >= 1 || unsureCount >= 1) return "info";
    return "good";
  }, [criticalCount, moderateCount, unsureCount]);

  const postureTitle = useMemo(() => {
    if (!hasAskingPrice) return "Add the advertised price to get a range";
    if (postureTone === "warn") return "You have strong price leverage";
    if (postureTone === "info") return "You have some price leverage";
    return "Even if it looks fine, you can still negotiate";
  }, [hasAskingPrice, postureTone]);

  const postureBody = useMemo(() => {
    if (!hasAskingPrice) {
      return "CarVerity can only generate a grounded adjustment range once the advertised asking price is known.";
    }

    if (postureTone === "warn") {
      return "Based on what you recorded, it’s reasonable to push for a meaningful reduction — or require proof before you pay full price.";
    }

    if (postureTone === "info") {
      return "You recorded a few items worth clarifying. That uncertainty supports a modest reduction or a conditional agreement.";
    }

    return "Most yards price expecting negotiation. If the car looks clean, your leverage comes from being ready to buy and having alternatives.";
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

  const guidanceRationale: string[] = useMemo(() => {
    const r = Array.isArray(priceGuidance?.rationale)
      ? (priceGuidance.rationale as string[])
      : [];
    return r.map((x) => asText(x)).filter(Boolean).slice(0, 6);
  }, [priceGuidance]);

  const offerMathRows: DeductionRow[] = useMemo(() => {
    const rows: DeductionRow[] = [];

    if (typeof redLow === "number" && typeof redHigh === "number") {
      rows.push({
        label: "Recorded items (concerns + unsure)",
        low: redLow,
        high: redHigh,
        note:
          postureTone === "good"
            ? "If nothing stood out, this is usually small (or zero)."
            : "This reflects what you recorded during the inspection.",
      });
      return rows;
    }

    // Fallback if priceGuidance isn't present (still show guidance)
    if (postureTone === "warn") {
      rows.push({
        label: "Recorded items (high leverage)",
        low: 800,
        high: 2500,
        note: "Fallback estimate (asking price missing or guidance unavailable).",
      });
    } else if (postureTone === "info") {
      rows.push({
        label: "Recorded items (some leverage)",
        low: 300,
        high: 1200,
        note: "Fallback estimate (asking price missing or guidance unavailable).",
      });
    } else {
      rows.push({
        label: "Normal negotiation margin",
        low: 200,
        high: 800,
        note: "Even clean cars are often priced with wiggle room.",
      });
    }

    return rows;
  }, [redLow, redHigh, postureTone]);

  const offerSummary = useMemo(() => {
    if (!hasAskingPrice || typeof askingPrice !== "number") return null;

    const totalLow = offerMathRows.reduce((acc, r) => acc + r.low, 0);
    const totalHigh = offerMathRows.reduce((acc, r) => acc + r.high, 0);

    const adjustedOfferHigh = Math.max(0, askingPrice - totalLow); // best case for buyer
    const adjustedOfferLow = Math.max(0, askingPrice - totalHigh); // more aggressive

    return {
      asking: askingPrice,
      totalReductionLow: totalLow,
      totalReductionHigh: totalHigh,
      offerLow: adjustedOfferLow,
      offerHigh: adjustedOfferHigh,
    };
  }, [hasAskingPrice, askingPrice, offerMathRows]);

  const runningSubtotals = useMemo(() => {
    if (!offerSummary) return [];

    let currentHigh = offerSummary.asking;
    let currentLow = offerSummary.asking;

    const steps = offerMathRows.map((r) => {
      // Low reduction = small move (higher offer)
      // High reduction = bigger move (lower offer)
      currentHigh = Math.max(0, currentHigh - r.low);
      currentLow = Math.max(0, currentLow - r.high);

      return {
        label: r.label,
        low: r.low,
        high: r.high,
        subtotalLow: currentLow,
        subtotalHigh: currentHigh,
        note: r.note,
      };
    });

    return steps;
  }, [offerSummary, offerMathRows]);

  const negotiationGuidance = useMemo(() => {
    // This is intentionally NOT a script.
    // It's guidance + examples of calm phrasing.
    if (!hasAskingPrice) {
      return {
        title: "How to negotiate (even without a number yet)",
        body: "Once you add the asking price, CarVerity will calculate a suggested offer range. Until then, keep it simple: be ready to buy, stay calm, and anchor with a reasonable offer.",
        bullets: [
          "Ask: “Is there any flexibility on the price?”",
          "If yes: “What’s the best you can do today?”",
          "If no: ask for value instead (service, tyres, rego, detailing).",
        ],
      };
    }

    if (postureTone === "good") {
      return {
        title: "If the car looks clean: negotiate using readiness + alternatives",
        body: "Your leverage isn’t faults — it’s being ready to buy and having other options. Dealerships often price expecting negotiation.",
        bullets: [
          "Anchor calmly: “I like it. If we can land at this number, I’ll do it today.”",
          "Use comparisons: “I’m looking at a couple of similar cars this week.”",
          "If they won’t move: ask for value instead (service, rego, tyres, detailing).",
        ],
      };
    }

    if (postureTone === "info") {
      return {
        title: "Negotiate using uncertainty (without sounding accusatory)",
        body: "You recorded items worth clarifying. That uncertainty supports a modest reduction or a conditional agreement.",
        bullets: [
          "Frame it as unknowns: “A couple of things I’m unsure about — I’d need room in the price.”",
          "Ask for proof: service history, invoices, written confirmation.",
          "If they won’t move: ask for value (service / tyres / warranty).",
        ],
      };
    }

    return {
      title: "You have leverage: push for proof or a meaningful reduction",
      body: "You recorded high-impact signals. It’s reasonable to ask for a stronger adjustment, or require proof before paying full price.",
      bullets: [
        "Lead with the biggest items first (keep it factual).",
        "Ask for proof (invoice, written confirmation, mechanic check).",
        "If they resist: “No worries — I’ll keep looking.”",
      ],
    };
  }, [hasAskingPrice, postureTone]);

  const printHint = useMemo(() => {
    if (!hasAskingPrice) {
      return "Tip: enter the asking price on the Summary page to generate a range.";
    }
    return "Tip: you can print/save the report as a PDF if you want to share it with someone.";
  }, [hasAskingPrice]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
      {/* Header */}
      <header className="space-y-4">
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          CarVerity · Price positioning & negotiation
        </span>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[260px]">
            <h1 className="text-3xl font-semibold text-white leading-tight">
              Price positioning &amp; negotiation
            </h1>
            <p className="text-slate-400 mt-2 leading-relaxed max-w-2xl">
              A buyer-safe way to ask for a better price — with clear math, and
              calm guidance you can actually use in the moment.
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
              return here for a calculated offer range.
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

      {/* Offer builder (math + running subtotals) */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-slate-300">
          <Calculator className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">Guided offer builder</h2>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-5">
          {!offerSummary ? (
            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <p className="text-sm text-slate-300 leading-relaxed">
                Add the asking price on Summary to generate the full calculation
                here.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Asking price
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white tabular-nums">
                    {formatMoney(offerSummary.asking)}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Total suggested adjustment
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white tabular-nums">
                    {formatMoney(offerSummary.totalReductionHigh)}–
                    {formatMoney(offerSummary.totalReductionLow)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Higher adjustment = firmer negotiation
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Suggested offer range
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white tabular-nums">
                    {formatMoney(offerSummary.offerLow)}–
                    {formatMoney(offerSummary.offerHigh)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    This is your “start here” range
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Step-by-step calculation
                </div>

                <div className="mt-4 space-y-3">
                  {runningSubtotals.map((s, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/10 bg-slate-900/30 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-[220px]">
                          <p className="text-sm font-semibold text-white">
                            {s.label}
                          </p>
                          {s.note ? (
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              {s.note}
                            </p>
                          ) : null}
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            Adjustment (low → high)
                          </p>
                          <p className="text-sm font-semibold text-white tabular-nums">
                            −{formatMoney(s.low)} to −{formatMoney(s.high)}
                          </p>

                          <p className="text-xs text-slate-500 mt-2">
                            New subtotal range
                          </p>
                          <p className="text-sm font-semibold text-slate-200 tabular-nums">
                            {formatMoney(s.subtotalLow)}–{formatMoney(s.subtotalHigh)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  This is guidance only. It does not estimate repair costs or
                  represent a market valuation.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Negotiation guidance (works even if clean) */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-slate-300">
          <Handshake className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">How to ask (buyer-safe)</h2>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-4">
          <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <p className="text-sm font-semibold text-white">
              {negotiationGuidance.title}
            </p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              {negotiationGuidance.body}
            </p>
          </div>

          <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-300">
            {negotiationGuidance.bullets.map((t: string, i: number) => (
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

      {/* Evidence snapshot */}
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

      {/* Firmness bands */}
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
          These bands help you choose your posture. The “offer builder” above
          shows the actual math in plain English.
        </p>
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
