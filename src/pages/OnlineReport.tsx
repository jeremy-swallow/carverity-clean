// src/pages/OnlineReport.tsx

import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineReport() {
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    setResult(stored);
  }, []);

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold mb-4">Online scan report</h1>
        <p className="text-sm text-slate-400">
          There is no saved online report yet.
        </p>
      </div>
    );
  }

  const { vehicle = {}, sections = [], signals = [] } = result;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Online scan report</h1>

      {/* Basic vehicle header */}
      <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 text-sm">
        <h2 className="text-sm font-semibold mb-3">Vehicle overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
          <div>
            <div className="text-xs text-slate-400">Make</div>
            <div>{vehicle.make || "—"}</div>

            <div className="mt-3 text-xs text-slate-400">Model</div>
            <div>{vehicle.model || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Year</div>
            <div>{vehicle.year || "—"}</div>

            <div className="mt-3 text-xs text-slate-400">Kilometres</div>
            <div>{vehicle.kilometres ?? "—"}</div>
          </div>
        </div>
      </section>

      {/* Sections (if any) */}
      {sections.length > 0 && (
        <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 space-y-4 text-sm">
          <h2 className="text-sm font-semibold">AI breakdown</h2>
          {sections.map((section, idx: number) => (
            <div key={idx} className="space-y-1">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                {section.title}
              </h3>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {section.content}
              </pre>
            </div>
          ))}
        </section>
      )}

      {/* Signals (optional) */}
      {signals && signals.length > 0 && (
        <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 text-sm">
          <h2 className="text-sm font-semibold mb-2">Key signals</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {signals.map((s: any, idx: number) => (
              <li key={idx}>
                {typeof s === "string" ? s : JSON.stringify(s)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
