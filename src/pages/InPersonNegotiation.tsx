// src/pages/InPersonNegotiation.tsx

import { useNavigate } from "react-router-dom";
import { Handshake } from "lucide-react";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

export default function InPersonNegotiation() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  if (!progress?.scanId) {
    navigate("/scan/in-person/start", { replace: true });
    return null;
  }

  const analysis = analyseInPersonInspection(progress);

  /* =========================================================
     Derived talking points (local, not analysis-owned)
  ========================================================== */

  const talkingPoints: { category: string; points: string[] }[] = [];

  if (analysis.risks.length > 0) {
    talkingPoints.push({
      category: "Items worth clarifying",
      points: analysis.risks.map(
        (r) => r.label
      ),
    });
  }

  if (analysis.confidenceScore < 80) {
    talkingPoints.push({
      category: "Inspection confidence",
      points: [
        "There were some limitations during the inspection",
        "That uncertainty affects how comfortable I feel proceeding",
      ],
    });
  }

  if (analysis.inferredSignals?.adasLikelyDisabled) {
    talkingPoints.push({
      category: "Driver assistance systems",
      points: [
        "Some driver assistance features appeared inactive",
        "I’d want to understand whether that’s intentional or a fault",
      ],
    });
  }

  talkingPoints.push({
    category: "Buyer position",
    points: [
      "I’m comparing this with other similar vehicles",
      "I’m ready to move forward if we can align on value",
    ],
  });

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center gap-3">
        <Handshake className="h-5 w-5 text-slate-400" />
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          Buyer-safe negotiation guidance
        </h1>
      </div>

      <p className="text-sm text-slate-400 max-w-xl">
        These are talking points — not scripts. Use only what feels appropriate
        in the situation.
      </p>

      <div className="space-y-4">
        {talkingPoints.map((group, index) => (
          <section
            key={index}
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
      </div>

      <div className="flex gap-2 pt-4">
        <button
          onClick={() => navigate("/scan/in-person/results")}
          className="flex-1 rounded-xl border border-white/25 text-slate-200 px-4 py-3"
        >
          Back to results
        </button>

        <button
          onClick={() => navigate("/scan/in-person/report-print")}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
        >
          View printable report
        </button>
      </div>
    </div>
  );
}
