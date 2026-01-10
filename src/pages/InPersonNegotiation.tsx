import { useNavigate } from "react-router-dom";
import {
  Handshake,
  MessageSquare,
} from "lucide-react";
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
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      {/* CONTEXT */}
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan
      </span>

      {/* TITLE */}
      <section className="space-y-3">
        <div className="flex items-start gap-3">
          <Handshake className="h-6 w-6 text-slate-400" />
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Buyer-safe negotiation guidance
          </h1>
        </div>

        <p className="text-sm text-slate-300 max-w-xl">
          These are talking points — not scripts. Use only what feels appropriate
          to you and the situation.
        </p>
      </section>

      {/* GUIDANCE GROUPS */}
      <section className="space-y-6">
        {analysis.negotiationLeverage.map((group) => (
          <div
            key={group.category}
            className="rounded-2xl bg-slate-900/60 px-6 py-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-200">
                {group.category}
              </h2>
            </div>

            <ul className="text-sm text-slate-300 space-y-1">
              {group.points.map((p, i) => (
                <li key={i}>• {p}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* BACK */}
      <button
        onClick={() => navigate("/scan/in-person/results")}
        className="w-full rounded-xl border border-white/25 text-slate-200 px-5 py-3"
      >
        Back to results
      </button>
    </div>
  );
}
