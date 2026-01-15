// src/pages/InPersonSummary.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, clearProgress, saveProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

export default function InPersonSummary() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const activeScanId: string =
    progress?.scanId ?? generateScanId();

  const imperfections = progress?.imperfections ?? [];

  const vehicle = {
    year: progress?.vehicleYear ?? "",
    make: progress?.vehicleMake ?? "",
    model: progress?.vehicleModel ?? "",
    variant: progress?.vehicleVariant ?? "",
    kms: progress?.vehicleKms ?? progress?.kilometres ?? "",
  };

  const [savedId, setSavedId] = useState<string | null>(null);

  function proceedToAnalysis() {
    saveProgress({
      ...(progress ?? {}),
      scanId: activeScanId,
      step: "/scan/in-person/analyzing",
    });

    navigate(`/scan/in-person/analyzing/${activeScanId}`);
  }

  function saveToLibrary() {
    saveScan({
      id: activeScanId,
      type: "in-person",
      title: "In-person inspection",
      createdAt: new Date().toISOString(),
      completed: false,
      vehicle,
      history: [
        {
          at: new Date().toISOString(),
          event: "Inspection summary saved",
        },
      ],
    } as any);

    setSavedId(activeScanId);
  }

  function viewMyScans() {
    clearProgress();
    navigate("/my-scans");
  }

  function startNewScan() {
    clearProgress();
    navigate("/start-scan");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan — Summary
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Inspection summary
      </h1>

      <p className="text-sm text-slate-400">
        Review what you captured before we analyse the inspection and generate
        your full report.
      </p>

      {/* VEHICLE */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-1">
        <p className="font-semibold text-slate-100">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.variant ? ` — ${vehicle.variant}` : ""}
        </p>
        <p className="text-sm text-slate-400">
          Odometer: {vehicle.kms || "—"} km
        </p>
      </section>

      {/* OBSERVATIONS */}
      <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 space-y-2">
        <h2 className="text-sm font-semibold text-amber-200">
          Inspection observations
        </h2>

        {imperfections.length === 0 ? (
          <p className="text-sm text-slate-300">
            No notable observations were recorded.
          </p>
        ) : (
          <ul className="text-sm text-slate-300 space-y-1">
            {imperfections.map((i: any) => (
              <li key={i.id}>
                • {i.area}: {i.type}
                {i.note ? ` — ${i.note}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* PRIMARY ACTION */}
      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 space-y-3">
        <h2 className="text-sm font-semibold text-emerald-200">
          Generate full report
        </h2>

        <p className="text-sm text-slate-300">
          We’ll analyse your inspection and prepare your buyer-safe report. This
          step finalises the inspection.
        </p>

        <button
          onClick={proceedToAnalysis}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
        >
          Analyse inspection
        </button>
      </section>

      {/* SAVE (SECONDARY) */}
      {!savedId ? (
        <div className="space-y-2">
          <button
            onClick={saveToLibrary}
            className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-2"
          >
            Save inspection for later
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={viewMyScans}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-3"
          >
            View in My Scans
          </button>
          <button
            onClick={startNewScan}
            className="w-full mt-2 rounded-xl border border-white/25 text-slate-200 px-4 py-2"
          >
            Start a new inspection
          </button>
        </>
      )}
    </div>
  );
}
