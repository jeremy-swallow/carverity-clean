/*  In-person start screen — user must choose:
    • Start a new stand-alone inspection
    • OR link to a previous online scan
*/

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";
import { loadScans } from "../utils/scanStorage";
import { clearProgress } from "../utils/scanProgress";

export default function InPersonStart() {
  const navigate = useNavigate();

  const [onlineResult, setOnlineResult] = useState<SavedResult | null>(null);
  const [onlineScans, setOnlineScans] = useState<any[]>([]);

  useEffect(() => {
    clearProgress(); // 🔒 always start a fresh journey

    const stored = loadOnlineResults();
    if (stored) setOnlineResult(stored);

    const scans = loadScans().filter((s: any) => s.type === "online");
    setOnlineScans(scans);
  }, []);

  const imperfectionHints = useMemo(() => {
    if (!onlineResult?.fullSummary && !onlineResult?.summary) return [];

    const text = (onlineResult.fullSummary || onlineResult.summary || "").toLowerCase();

    const keywords = [
      "dent","scrape","scratch","chip","stone chip","paint fade","oxidation",
      "kerb rash","curb rash","wheel damage","wear","tear","crack","scuff",
      "hail","rust","corrosion","panel gap","misaligned panel"
    ];

    return Array.from(
      new Set(keywords.filter(k => text.includes(k))).values()
    ).map(w => w.replace(/^\w/, c => c.toUpperCase()));
  }, [onlineResult]);

  function startStandalone() {
    navigate("/scan/in-person/vehicle");   // ⬅️ NEW FIRST STEP
  }

  function selectLinkedScan() {
    navigate("/scan/in-person/link-source");
  }

  function viewOnlineResults() {
    navigate("/online-results");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Stage 2 of the CarVerity journey
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Start your in-person inspection
      </h1>

      {onlineResult && (
        <section className="rounded-2xl border border-indigo-400/25 bg-indigo-600/10 px-5 py-4 space-y-3">
          <h2 className="text-sm md:text-base font-semibold text-slate-100">
            Linked insights from your online scan
          </h2>

          {imperfectionHints.length > 0 ? (
            <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
              {imperfectionHints.map((m, i) => (
                <li key={i}>Consider photographing potential {m.toLowerCase()} areas.</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-300">
              No issues were highlighted — this stage focuses on confirming real-world condition.
            </p>
          )}

          <button
            onClick={viewOnlineResults}
            className="mt-1 text-xs underline text-slate-300"
          >
            View the online report again
          </button>
        </section>
      )}

      <section className="space-y-3">
        <button
          onClick={startStandalone}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
        >
          Start a new stand-alone inspection
        </button>

        {onlineScans.length > 0 && (
          <button
            onClick={selectLinkedScan}
            className="w-full rounded-xl border border-white/25 bg-slate-900/70 text-slate-100 font-semibold px-4 py-3"
          >
            Link this inspection to one of my online scans
          </button>
        )}
      </section>

      <p className="text-[11px] text-slate-400 text-center">
        Your progress is saved locally on this device only.
      </p>
    </div>
  );
}
