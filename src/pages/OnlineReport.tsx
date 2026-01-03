// src/pages/OnlineReport.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineReport() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) {
      navigate("/scan/online", { replace: true });
      return;
    }
    setResult(stored);
  }, [navigate]);

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">
          Full scan report
        </h1>
        <p className="text-sm text-slate-400">Loading report…</p>
      </div>
    );
  }

  const sections = result.sections ?? [];
  const hasSections = sections.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Full scan report</h1>

      {/* Optional signals summary block */}
      {result.signals && result.signals.length > 0 && (
        <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 text-sm">
          <h2 className="text-sm font-semibold mb-2">Key signals</h2>
          <ul className="list-disc list-inside space-y-1">
            {result.signals.map((s, idx) => (
              <li key={idx}>{String(s)}</li>
            ))}
          </ul>
        </section>
      )}

      {hasSections ? (
        <div className="space-y-4">
          {sections.map((section, idx) => (
            <section
              key={idx}
              className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 text-sm"
            >
              <h2 className="text-sm font-semibold mb-2">
                {section.title || "Untitled section"}
              </h2>
              <pre className="whitespace-pre-wrap leading-relaxed opacity-90">
                {section.content}
              </pre>
            </section>
          ))}
        </div>
      ) : (
        <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 text-sm">
          <h2 className="text-sm font-semibold mb-2">Full analysis</h2>
          {result.fullAnalysis ? (
            <pre className="whitespace-pre-wrap leading-relaxed opacity-90">
              {result.fullAnalysis}
            </pre>
          ) : (
            <p className="text-slate-400">
              No additional report content is available for this scan yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
