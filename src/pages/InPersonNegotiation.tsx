// src/pages/InPersonNegotiation.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection, type AnalysisResult } from "../utils/inPersonAnalysis";

export default function InPersonNegotiation() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const analysis: AnalysisResult = useMemo(() => {
    return analyseInPersonInspection((progress ?? {}) as any);
  }, [progress]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Buyer-safe negotiation guidance
      </h1>

      <p className="text-sm text-slate-400">
        These are talking points — not scripts. Use only what feels appropriate.
      </p>

      <div className="space-y-4">
        {analysis.negotiationLeverage.map((group: { category: string; points: string[] }, index: number) => (
          <section
            key={`${group.category}-${index}`}
            className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-3"
          >
            <h2 className="text-sm font-semibold text-slate-200">
              {group.category}
            </h2>

            <ul className="text-sm text-slate-300 space-y-2">
              {group.points.map((p: string, i: number) => (
                <li key={`${index}-${i}`} className="leading-relaxed">
                  {p.startsWith("•") ? p : `• ${p}`}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <button
        onClick={() => navigate("/scan/in-person/results")}
        className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-3 font-semibold"
      >
        Back to results
      </button>
    </div>
  );
}
