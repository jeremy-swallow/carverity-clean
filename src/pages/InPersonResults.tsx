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
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan — Results
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Inspection outcome
      </h1>

      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-2">
        <p className="text-sm text-slate-300">
          Confidence: {analysis.confidenceScore}%
        </p>
        <p className="text-sm text-slate-300">
          Inspection completeness: {analysis.completenessScore}%
        </p>
      </section>

      <section className="rounded-2xl border border-indigo-400/25 bg-indigo-500/10 px-5 py-4 space-y-2">
        <h2 className="text-sm font-semibold text-indigo-200">
          Overall recommendation
        </h2>
        <p className="text-white font-semibold capitalize">
          {analysis.verdict.replace("-", " ")}
        </p>
        <p className="text-sm text-slate-300">
          {analysis.verdictReason}
        </p>
      </section>

      {analysis.risks.length > 0 && (
        <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 space-y-2">
          <h2 className="text-sm font-semibold text-amber-200">
            Key signals to note
          </h2>
          <ul className="text-sm text-slate-300 space-y-1">
            {analysis.risks.map((r) => (
              <li key={r.id}>
                • {r.label} — {r.explanation}
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        onClick={() =>
          navigate("/scan/in-person/negotiation")
        }
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
      >
        View negotiation guidance
      </button>
    </div>
  );
}
