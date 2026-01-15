// src/pages/InPersonNegotiation.tsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadProgress,
} from "../utils/scanProgress";
import {
  analyseInPersonInspection,
  type AnalysisResult,
} from "../utils/inPersonAnalysis";
import { ArrowLeft, DollarSign, Shield, TrendingDown } from "lucide-react";

function formatAud(n: number) {
  return n.toLocaleString("en-AU");
}

export default function InPersonNegotiation() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const analysis: AnalysisResult = useMemo(() => {
    return analyseInPersonInspection((progress ?? {}) as any);
  }, [progress]);

  const asking = analysis.priceGuidance.askingPriceAud;
  const low = analysis.priceGuidance.adjustedPriceLowAud;
  const high = analysis.priceGuidance.adjustedPriceHighAud;

  const redLow = analysis.priceGuidance.suggestedReductionLowAud;
  const redHigh = analysis.priceGuidance.suggestedReductionHighAud;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          onClick={() => navigate("/scan/in-person/results/" + (progress?.scanId ?? ""))}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          View report
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          Negotiation positioning
        </h1>
        <p className="text-sm text-slate-400">
          Buyer-safe guidance based only on what you recorded — no scripts, no hype.
        </p>
      </div>

      {/* Price card */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-200">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold">Price guidance</h2>
        </div>

        {asking && low !== null && high !== null ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-950/60 border border-white/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Asking price
                </p>
                <p className="text-lg font-semibold text-white">
                  ${formatAud(asking)}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/25 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-emerald-200">
                  Buyer-safe target range
                </p>
                <p className="text-lg font-semibold text-white">
                  ${formatAud(low)} – ${formatAud(high)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950/60 border border-white/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Suggested reduction
                </p>
                <p className="text-lg font-semibold text-white">
                  ${formatAud(redHigh ?? 0)} – ${formatAud(redLow ?? 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  (depends on how firm you want to be)
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-200">
                <TrendingDown className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold">Why this range?</p>
              </div>
              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {analysis.priceGuidance.rationale.map((r, i) => (
                  <li key={i} className="leading-relaxed">
                    • {r}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-3">
                {analysis.priceGuidance.disclaimer}
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-200 font-semibold">
              Asking price not provided
            </p>
            <p className="text-sm text-slate-300 mt-1">
              Enter the advertised price to get a buyer-safe adjusted range.
            </p>
            <button
              onClick={() => navigate("/scan/in-person/asking-price")}
              className="mt-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold px-4 py-2 text-sm"
            >
              Add asking price
            </button>
          </div>
        )}
      </section>

      {/* Leverage points */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-200">
          <Shield className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">Your strongest leverage</h2>
        </div>

        <div className="space-y-4">
          {analysis.negotiationLeverage.map(
            (group: { category: string; points: string[] }, index: number) => (
              <div
                key={`${group.category}-${index}`}
                className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-4 space-y-2"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {group.category}
                </p>

                <ul className="text-sm text-slate-300 space-y-2">
                  {group.points.map((p: string, i: number) => (
                    <li key={`${index}-${i}`} className="leading-relaxed">
                      {p.startsWith("•") ? p : `• ${p}`}
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
      </section>

      <button
        onClick={() => navigate("/scan/in-person/results/" + (progress?.scanId ?? ""))}
        className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-3 font-semibold"
      >
        Back to report
      </button>
    </div>
  );
}
