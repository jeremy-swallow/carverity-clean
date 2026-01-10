import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Eye,
  Handshake,
} from "lucide-react";
import { loadProgress } from "../utils/scanProgress";
import { isScanUnlocked } from "../utils/scanUnlock";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

export default function InPersonResults() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  if (!progress?.scanId) {
    navigate("/scan/in-person/start", { replace: true });
    return null;
  }

  if (!isScanUnlocked(progress.scanId)) {
    navigate("/scan/in-person/preview", { replace: true });
    return null;
  }

  const analysis = analyseInPersonInspection(progress, { unlocked: true });

  const verdictIcon =
    analysis.verdict === "proceed" ? (
      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
    ) : analysis.verdict === "caution" ? (
      <AlertTriangle className="h-6 w-6 text-amber-400" />
    ) : (
      <XCircle className="h-6 w-6 text-red-400" />
    );

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan
      </span>

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          {verdictIcon}
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            {analysis.verdict === "proceed" &&
              "You can proceed with confidence"}
            {analysis.verdict === "caution" &&
              "Proceed carefully, with a few points to clarify"}
            {analysis.verdict === "walk-away" &&
              "This inspection raises enough concern to walk away"}
          </h1>
        </div>
        <p className="text-sm text-slate-300 max-w-xl">
          {analysis.verdictReason}
        </p>
      </section>

      <section className="rounded-2xl bg-slate-900/60 px-6 py-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-300">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium">Inspection signals</span>
        </div>

        <div className="flex gap-10">
          <div>
            <p className="text-[11px] uppercase text-slate-400">Confidence</p>
            <p className="text-lg font-semibold text-white">
              {analysis.confidenceScore}%
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-slate-400">
              Inspection coverage
            </p>
            <p className="text-lg font-semibold text-white">
              {analysis.completenessScore}%
            </p>
          </div>
        </div>
      </section>

      {analysis.risks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Things worth understanding
            </h2>
          </div>

          {analysis.risks.map((r) => (
            <div
              key={r.id}
              className="rounded-xl bg-slate-900/50 px-5 py-4"
            >
              <p className="text-sm text-slate-200 font-medium">
                {r.label}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {r.explanation}
              </p>
            </div>
          ))}
        </section>
      )}

      <button
        onClick={() => navigate("/scan/in-person/negotiation")}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-3 flex items-center justify-center gap-2"
      >
        <Handshake className="h-4 w-4" />
        View negotiation guidance
      </button>
    </div>
  );
}
