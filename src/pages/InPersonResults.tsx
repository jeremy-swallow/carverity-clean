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
          Header
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
          Signals
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
            Based on inspection clarity and consistency
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
            How much of the vehicle was reasonably assessed
          </p>
        </div>
      </section>

      {/* --------------------------------------------------
          Risks
      -------------------------------------------------- */}
      {analysis.risks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            Key things worth understanding
          </h2>

          {analysis.risks
            .slice()
            .sort(
              (a, b) =>
                (b.severity === "critical" ? 3 : b.severity === "moderate" ? 2 : 1) -
                (a.severity === "critical" ? 3 : a.severity === "moderate" ? 2 : 1)
            )
            .map((r) => (
              <div
                key={r.id}
                className="rounded-xl bg-slate-900/50 px-6 py-4 border border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs uppercase tracking-wide ${
                      r.severity === "critical"
                        ? "text-red-400"
                        : r.severity === "moderate"
                        ? "text-amber-400"
                        : "text-slate-400"
                    }`}
                  >
                    {r.severity}
                  </span>
                </div>

                <p className="text-sm text-slate-200 font-medium mt-1">
                  {r.label}
                </p>
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
