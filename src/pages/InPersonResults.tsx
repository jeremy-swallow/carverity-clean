import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

export default function InPersonResults() {
  const navigate = useNavigate();
  const progress = loadProgress();

  if (!progress) {
    navigate("/scan/in-person/start", { replace: true });
    return null;
  }

  const analysis = analyseInPersonInspection(progress);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      {/* CONTEXT */}
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan
      </span>

      {/* VERDICT — PRIMARY ANSWER */}
      <section className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
          {analysis.verdict === "proceed" && "You can proceed with confidence"}
          {analysis.verdict === "caution" &&
            "Proceed carefully, with a few points to clarify"}
          {analysis.verdict === "walk-away" &&
            "This inspection raises enough concern to walk away"}
        </h1>

        <p className="text-sm text-slate-300 max-w-xl">
          {analysis.verdictReason}
        </p>
      </section>

      {/* SIGNALS */}
      <section className="rounded-2xl bg-slate-900/60 px-6 py-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:gap-10 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Confidence
            </p>
            <p className="text-lg font-semibold text-white">
              {analysis.confidenceScore}%
            </p>
            <p className="text-xs text-slate-400">
              Based on evidence captured
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Inspection coverage
            </p>
            <p className="text-lg font-semibold text-white">
              {analysis.completenessScore}%
            </p>
            <p className="text-xs text-slate-400">
              Visible areas reviewed
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 max-w-xl">
          These signals reflect what was visible and accessible during the
          inspection. They don’t account for hidden or mechanical conditions.
        </p>
      </section>

      {/* OBSERVATIONS */}
      {analysis.risks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">
            Things worth understanding
          </h2>

          <div className="space-y-2">
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
          </div>

          <p className="text-xs text-slate-400 max-w-xl">
            These aren’t faults — just areas you may want to clarify or factor
            into your decision.
          </p>
        </section>
      )}

      {/* NEXT STEP */}
      <section className="space-y-4">
        <button
          onClick={() => navigate("/scan/in-person/negotiation")}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-3"
        >
          View negotiation guidance
        </button>

        <p className="text-[11px] text-slate-400 text-center">
          Buyer-safe talking points, based on this inspection.
        </p>
      </section>
    </div>
  );
}
