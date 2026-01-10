import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

export default function InPersonNegotiation() {
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
        In-person scan — Negotiation
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Buyer-safe negotiation guidance
      </h1>

      <p className="text-sm text-slate-400">
        These are talking points — not scripts. Use only what feels
        appropriate.
      </p>

      {analysis.negotiationLeverage.map((group) => (
        <section
          key={group.category}
          className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-2"
        >
          <h2 className="text-sm font-semibold text-slate-200">
            {group.category}
          </h2>
          <ul className="text-sm text-slate-300 space-y-1">
            {group.points.map((p, i) => (
              <li key={i}>• {p}</li>
            ))}
          </ul>
        </section>
      ))}

      <button
        onClick={() => navigate("/scan/in-person/results")}
        className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-3"
      >
        Back to results
      </button>
    </div>
  );
}
