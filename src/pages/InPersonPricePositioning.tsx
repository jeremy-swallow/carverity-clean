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

  const adjustedLow = priceGuidance?.adjustedPriceLowAud ?? null;
  const adjustedHigh = priceGuidance?.adjustedPriceHighAud ?? null;

  const redLow = priceGuidance?.suggestedReductionLowAud ?? null;
  const redHigh = priceGuidance?.suggestedReductionHighAud ?? null;

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
    return r.map((x) => asText(x)).filter(Boolean).slice(0, 5);
  }, [priceGuidance]);

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
              Price positioning
            </h1>
            <p className="text-slate-400 mt-2 leading-relaxed max-w-2xl">
              A grounded way to ask for a better price — based on what you
              recorded, without hype or pressure.
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
          onClick={() => navigate("/scan/in-person/print")}
          className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 flex items-center justify-center gap-2 text-sm"
        >
          <Printer className="h-4 w-4" />
          Print / save report
        </button>
      </section>
    </div>
  );
}
