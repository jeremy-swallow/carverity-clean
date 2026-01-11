import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Eye,
  Handshake,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { loadProgress } from "../utils/scanProgress";
import { isScanUnlocked } from "../utils/scanUnlock";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

export default function InPersonResults() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [showWhy, setShowWhy] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto px-6 py-14 space-y-12">
      {/* --------------------------------------------------
          Verdict
      -------------------------------------------------- */}
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

      {/* --------------------------------------------------
          Scores
      -------------------------------------------------- */}
      <section className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl bg-slate-900/60 px-6 py-5">
          <div className="flex items-center gap-2 text-slate-300">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">Confidence score</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">
            {analysis.confidenceScore}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            How reliable this inspection feels overall
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
          <p className="text-xs text-slate-400 mt-1">
            How much of the vehicle was meaningfully checked
          </p>
        </div>
      </section>

      {/* --------------------------------------------------
          WHY THIS SCORE (Expandable)
      -------------------------------------------------- */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
        <button
          onClick={() => setShowWhy((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Why these scores were given
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Transparency into how this inspection was assessed
            </p>
          </div>
          {showWhy ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {showWhy && (
          <div className="px-6 pb-5 space-y-4 text-sm text-slate-300">
            <div>
              <p className="font-medium text-slate-200">Confidence score</p>
              <p className="mt-1">
                This reflects how consistent and decisive the inspection
                responses were. Clear “normal” vs “stood out” answers increase
                confidence, while skipped or uncertain checks reduce it.
              </p>
            </div>

            <div>
              <p className="font-medium text-slate-200">Inspection coverage</p>
              <p className="mt-1">
                Coverage is based on how many key inspection areas were assessed
                during your visit — including exterior condition, cabin checks,
                test-drive observations, and safety features where applicable.
              </p>
            </div>

            <div>
              <p className="font-medium text-slate-200">
                What this does (and doesn’t) mean
              </p>
              <p className="mt-1">
                These scores don’t guarantee mechanical condition. They indicate
                how much useful signal you gathered in-person to support a
                buying decision or negotiation discussion.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* --------------------------------------------------
          Risks
      -------------------------------------------------- */}
      {analysis.risks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            Key things worth understanding
          </h2>

          {analysis.risks.map((r) => (
            <div
              key={r.id}
              className="rounded-xl bg-slate-900/50 px-6 py-4 border border-slate-800"
            >
              <p className="text-sm text-slate-200 font-medium">{r.label}</p>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                {r.explanation}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* --------------------------------------------------
          Actions
      -------------------------------------------------- */}
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
