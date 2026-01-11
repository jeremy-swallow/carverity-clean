// src/pages/InPersonResults.tsx

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Eye,
  Handshake,
  FileText,
  HelpCircle,
  DollarSign,
  TrendingDown,
  Info,
} from "lucide-react";

import { loadProgress } from "../utils/scanProgress";
import { isScanUnlocked } from "../utils/scanUnlock";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

export default function InPersonResults() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const progress: any = loadProgress();
  const scanId = params.get("scanId") || progress?.scanId || "";

  useEffect(() => {
    if (!scanId) {
      navigate("/scan/in-person/start", { replace: true });
    }
  }, [scanId, navigate]);

  if (!scanId) return null;

  if (!isScanUnlocked(scanId)) {
    navigate("/scan/in-person/preview", { replace: true });
    return null;
  }

  const analysis = analyseInPersonInspection(progress);

  /* -------------------------------------------------------
     Verdict meta
  ------------------------------------------------------- */
  const verdictMeta = {
    proceed: {
      icon: <CheckCircle2 className="h-7 w-7 text-emerald-400" />,
      title: "Proceed with confidence",
      tone: "bg-emerald-500/10 border-emerald-500/30",
    },
    caution: {
      icon: <AlertTriangle className="h-7 w-7 text-amber-400" />,
      title: "Proceed — but clarify a few things",
      tone: "bg-amber-500/10 border-amber-500/30",
    },
    "walk-away": {
      icon: <XCircle className="h-7 w-7 text-red-400" />,
      title: "High risk — walking away is reasonable",
      tone: "bg-red-500/10 border-red-500/30",
    },
  }[analysis.verdict];

  /* -------------------------------------------------------
     Helpers
  ------------------------------------------------------- */
  function formatMoney(aud?: number) {
    if (!aud || aud <= 0) return "$0";
    return `$${aud.toLocaleString()}`;
  }

  function formatPct(pct?: number) {
    if (pct === undefined) return "";
    return ` (~${Math.round(pct)}%)`;
  }

  const { conservative, balanced, aggressive, basisNote } =
    analysis.negotiationPositioning;

  return (
    <div className="max-w-4xl mx-auto px-6 py-14 space-y-12">
      {/* Verdict */}
      <header className="space-y-3">
        <span className="text-[11px] uppercase tracking-widest text-slate-400">
          In-person inspection result
        </span>

        <div
          className={`rounded-2xl border px-6 py-5 flex items-start gap-4 ${verdictMeta.tone}`}
        >
          {verdictMeta.icon}
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">
              {verdictMeta.title}
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">
              {analysis.verdictReason}
            </p>
          </div>
        </div>
      </header>

      {/* Scores */}
      <section className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl bg-slate-900/60 px-6 py-5">
          <div className="flex items-center gap-2 text-slate-300">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">Confidence score</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">
            {analysis.confidenceScore}%
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 px-6 py-5">
          <div className="flex items-center gap-2 text-slate-300">
            <Eye className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">Inspection coverage</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">
            {analysis.completenessScore}%
          </p>
        </div>
      </section>

      {/* Why this verdict */}
      <section className="rounded-2xl bg-slate-900/60 px-6 py-6 space-y-5">
        <div className="flex items-center gap-2 text-slate-300">
          <Info className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">Why this verdict?</h2>
        </div>

        <div className="space-y-4">
          {analysis.verdictDrivers.map((d, i) => (
            <div
              key={i}
              className="rounded-xl bg-slate-900/50 px-5 py-4"
            >
              <p className="text-sm font-medium text-slate-200">
                {d.label}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {d.whyItMatters}
              </p>
            </div>
          ))}
        </div>

        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
          {analysis.whyThisVerdict.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      {/* Negotiation positioning */}
      <section className="rounded-2xl bg-slate-900/60 px-6 py-6 space-y-5">
        <div className="flex items-center gap-2 text-slate-300">
          <TrendingDown className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">
            Estimated negotiation positioning
          </h2>
        </div>

        <p className="text-sm text-slate-400">{basisNote}</p>

        <div className="grid gap-4">
          <NegotiationRow
            label="Conservative"
            range={conservative}
            tone="bg-slate-900/50"
          />
          <NegotiationRow
            label="Balanced"
            range={balanced}
            tone="bg-slate-900/40 border border-white/10"
          />
          <NegotiationRow
            label="Aggressive"
            range={aggressive}
            tone="bg-slate-900/50"
          />
        </div>
      </section>

      {/* Clarifications */}
      {analysis.risks.length > 0 && (
        <section className="rounded-2xl bg-slate-900/60 px-6 py-6 space-y-5">
          <div className="flex items-center gap-2 text-slate-300">
            <HelpCircle className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold">
              What to clarify with the seller
            </h2>
          </div>

          {analysis.risks.map((r) => {
            const hint = r.negotiationHint?.range;
            return (
              <div
                key={r.id}
                className="rounded-xl bg-slate-900/50 px-5 py-4"
              >
                <p className="text-sm font-medium text-slate-200">
                  {r.label}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {r.explanation}
                </p>

                {hint && (
                  <div className="mt-3 flex gap-2">
                    <DollarSign className="h-4 w-4 text-slate-400 mt-0.5" />
                    <p className="text-sm text-slate-400">
                      Likely negotiation allowance:{" "}
                      <strong className="text-slate-200">
                        {formatMoney(hint.audLow)}–{formatMoney(hint.audHigh)}
                      </strong>
                      {formatPct(hint.pctHigh)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Actions */}
      <section className="space-y-4">
        <button
          onClick={() => navigate("/scan/in-person/negotiation")}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4 flex items-center justify-center gap-2"
        >
          <Handshake className="h-4 w-4" />
          View buyer-safe negotiation guidance
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/scan/in-person/report-print")}
            className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-3 flex items-center justify-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Print / save report
          </button>

          <button
            onClick={() => navigate("/scan/in-person/summary")}
            className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 px-5 py-3"
          >
            Back to summary
          </button>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   Subcomponents
========================================================= */

function NegotiationRow({
  label,
  range,
  tone,
}: {
  label: string;
  range: {
    audLow: number;
    audHigh: number;
    pctLow?: number;
    pctHigh?: number;
  };
  tone: string;
}) {
  function fmt(aud: number) {
    return `$${aud.toLocaleString()}`;
  }

  return (
    <div className={`rounded-xl px-5 py-4 ${tone}`}>
      <p className="text-sm font-medium text-slate-200">{label}</p>
      <p className="text-sm text-slate-300 mt-1">
        {fmt(range.audLow)}–{fmt(range.audHigh)}
        {range.pctLow !== undefined && range.pctHigh !== undefined && (
          <span className="text-slate-400">
            {" "}
            (~{Math.round(range.pctLow)}–{Math.round(range.pctHigh)}%)
          </span>
        )}
      </p>
    </div>
  );
}
