// src/pages/InPersonSummary.tsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

export default function InPersonSummary() {
  const navigate = useNavigate();
  const progress = loadProgress();

  const imperfections = (progress as any)?.imperfections ?? [];
  const followUps = (progress as any)?.followUpPhotos ?? [];
  const checks = (progress as any)?.checks ?? {};
  const fromOnlineScan = Boolean((progress as any)?.fromOnlineScan);

  const [savedId, setSavedId] = useState<string | null>(null);

  /* =========================================================
     Build readable insight summary
  ========================================================== */

  const findings = useMemo(() => {
    const notes: string[] = [];

    if (imperfections.length > 0) {
      notes.push(
        `You recorded ${imperfections.length} observation${
          imperfections.length === 1 ? "" : "s"
        } during your visit.`
      );
    }

    const unusual = Object.values(checks).filter(
      (v) => v === "Something seemed unusual — worth confirming"
    ).length;

    if (unusual > 0) {
      notes.push(
        `${unusual} real-world check${
          unusual === 1 ? "" : "s"
        } were marked as worth confirming with the seller.`
      );
    }

    if (!notes.length) {
      notes.push(
        "No significant concerns were recorded — this inspection mainly helped you document condition and photos for reference."
      );
    }

    return notes;
  }, [imperfections, checks]);

  /* =========================================================
     Save scan → My Scans
  ========================================================== */

  function saveToLibrary() {
    const id = generateScanId();

    // No explicit SavedScan type here so we can safely include extra metadata
    const scan = {
      id,
      type: "in-person" as const,
      title: fromOnlineScan
        ? "In-person follow-up inspection"
        : "In-person inspection — stand-alone",
      createdAt: new Date().toISOString(),
      summary:
        "Buyer-led in-person inspection capturing observations, follow-up checks and photo priorities.",
      // Extra metadata for future detail screens
      context: fromOnlineScan ? "linked-online" : "standalone",
      data: {
        imperfections,
        followUps,
        checks,
      },
    };

    saveScan(scan as any);
    localStorage.setItem("carverity_inperson_completed", "1");

    // Clear active journey state
    clearProgress();
    setSavedId(id);
  }

  function startNewScan() {
    clearProgress();
    navigate("/start-scan");
  }

  function viewMyScans() {
    navigate("/my-scans");
  }

  /* =========================================================
     Render
  ========================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Inspection summary
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Your in-person inspection summary
      </h1>

      {/* High-level takeaway */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-2">
        <h2 className="text-sm font-semibold text-slate-100">
          What this inspection captured
        </h2>

        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          {findings.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>

        <p className="text-[11px] text-slate-400 mt-1">
          This summary doesn’t label issues as faults — it helps you document
          observations and decide what to confirm with the seller.
        </p>
      </section>

      {/* Imperfections */}
      <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4">
        <h2 className="text-sm font-semibold text-amber-200">
          Observations you recorded
        </h2>

        {imperfections.length === 0 ? (
          <p className="text-sm text-slate-300 mt-1">
            No observations were recorded during this visit.
          </p>
        ) : (
          <ul className="text-sm text-slate-300 space-y-1 mt-2">
            {imperfections.map((i: any) => (
              <li key={i.id}>
                • {i.area}: {i.type}
                {i.note ? ` — ${i.note}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Follow-up areas */}
      {followUps.length > 0 && (
        <section className="rounded-2xl border border-indigo-400/30 bg-indigo-600/10 px-5 py-4 space-y-2">
          <h2 className="text-sm font-semibold text-indigo-200">
            Suggested areas you reviewed
          </h2>

          <ul className="text-sm text-slate-300 space-y-1">
            {followUps.map((f: any) => (
              <li key={f.id}>• {f.label}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Condition check recap */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 space-y-2">
        <h2 className="text-sm font-semibold text-slate-100">
          Condition-awareness checks
        </h2>

        {Object.keys(checks).length === 0 ? (
          <p className="text-sm text-slate-300">
            No condition-awareness responses were recorded.
          </p>
        ) : (
          <ul className="text-sm text-slate-300 space-y-1">
            {Object.entries(checks).map(([id, value]) => (
              <li key={id}>• {value as string}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Actions */}
      {!savedId ? (
        <>
          <button
            onClick={saveToLibrary}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
          >
            Save inspection to My Scans
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            Once saved, you can revisit this inspection any time.
          </p>
        </>
      ) : (
        <>
          <section className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
            Inspection saved successfully.
          </section>

          <button
            onClick={viewMyScans}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-3 shadow"
          >
            View this inspection in My Scans
          </button>

          <button
            onClick={startNewScan}
            className="w-full mt-2 rounded-xl border border-white/25 text-slate-200 px-4 py-2"
          >
            Start a new scan
          </button>
        </>
      )}
    </div>
  );
}
