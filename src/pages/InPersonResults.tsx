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
  TrendingDown,
  Info,
} from "lucide-react";

import { loadProgress, saveProgress } from "../utils/scanProgress";
import { isScanUnlocked } from "../utils/scanUnlock";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

export default function InPersonResults() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const scanIdFromUrl = params.get("scanId") || "";
  const stripeSessionId = params.get("session_id");

  const progress: any = loadProgress();
  const scanId = scanIdFromUrl || progress?.scanId || "";

  /* -------------------------------------------------------
     Stripe safety: reroute through analyzing if Stripe
     lands directly on results
  ------------------------------------------------------- */
  useEffect(() => {
    if (scanId && stripeSessionId) {
      navigate(`/scan/in-person/analyzing?scanId=${scanId}`, {
        replace: true,
      });
    }
  }, [scanId, stripeSessionId, navigate]);

  /* -------------------------------------------------------
     Hydrate scanId into progress
  ------------------------------------------------------- */
  useEffect(() => {
    if (!scanId) {
      navigate("/scan/in-person/start", { replace: true });
      return;
    }

    if (!progress?.scanId || progress.scanId !== scanId) {
      saveProgress({
        ...(progress ?? {}),
        scanId,
      });
    }
  }, [scanId, progress, navigate]);

  /* -------------------------------------------------------
     Guard: must be unlocked
  ------------------------------------------------------- */
  useEffect(() => {
    if (!scanId) return;

    if (!isScanUnlocked(scanId)) {
      navigate(`/scan/in-person/preview?scanId=${scanId}`, {
        replace: true,
      });
    }
  }, [scanId, navigate]);

  if (!scanId) return null;

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

  function fmt(aud: number) {
    return `$${aud.toLocaleString()}`;
  }

  const { conservative, balanced, aggressive } =
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
            <span className="text-sm font-medium">Confidence</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">
            {analysis.confidenceScore}%
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 px-6 py-5">
          <div className="flex items-center gap-2 text-slate-300">
            <Eye className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">Coverage</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">
            {analysis.completenessScore}%
          </p>
        </div>
      </section>

      {/* Why verdict */}
      <section className="rounded-2xl bg-slate-900/60 px-6 py-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Info className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">Why this verdict?</h2>
        </div>

        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
          {analysis.whyThisVerdict.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      {/* Negotiation */}
      <section className="rounded-2xl bg-slate-900/60 px-6 py-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-300">
          <TrendingDown className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">
            Negotiation positioning
          </h2>
        </div>

        <ul className="text-sm text-slate-300 space-y-1">
          <li>
            <strong>Conservative:</strong>{" "}
            {fmt(conservative.audLow)}–{fmt(conservative.audHigh)}
          </li>
          <li>
            <strong>Balanced:</strong>{" "}
            {fmt(balanced.audLow)}–{fmt(balanced.audHigh)}
          </li>
          <li>
            <strong>Aggressive:</strong>{" "}
            {fmt(aggressive.audLow)}–{fmt(aggressive.audHigh)}
          </li>
        </ul>
      </section>

      {/* Actions */}
      <section className="space-y-4">
        <button
          onClick={() => navigate("/scan/in-person/negotiation")}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4 flex items-center justify-center gap-2"
        >
          <Handshake className="h-4 w-4" />
          View negotiation guidance
        </button>

        <button
          onClick={() => navigate("/scan/in-person/report-print")}
          className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 flex items-center justify-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Print / save report
        </button>
      </section>
    </div>
  );
}
