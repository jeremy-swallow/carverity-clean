import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

export default function InPersonSummary() {
  const navigate = useNavigate();
  const { scanId: routeScanId } = useParams<{ scanId?: string }>();

  const progress: any = loadProgress();
  const activeScanId: string | null = progress?.scanId || routeScanId || null;

  const imperfections = progress?.imperfections ?? [];

  const vehicle = {
    year: progress?.vehicleYear ?? "",
    make: progress?.vehicleMake ?? "",
    model: progress?.vehicleModel ?? "",
    variant: progress?.vehicleVariant ?? "",
    kms: progress?.vehicleKms ?? progress?.kilometres ?? "",
  };

  const [savedId, setSavedId] = useState<string | null>(null);

  /* =========================================================
     Actions
  ========================================================== */

  function continueToResults() {
    navigate("/scan/in-person/results");
  }

  function saveToLibrary() {
    const id = activeScanId ?? generateScanId();

    saveScan({
      id,
      type: "in-person",
      title: "In-person inspection",
      createdAt: new Date().toISOString(),
      completed: true,
      vehicle,
      history: [
        {
          at: new Date().toISOString(),
          event: "Inspection completed",
        },
      ],
    } as any);

    setSavedId(id);
  }

  function viewMyScans() {
    clearProgress();
    navigate("/my-scans");
  }

  function startNewScan() {
    clearProgress();
    navigate("/start-scan");
  }

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan — Inspection summary
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Inspection summary
      </h1>

      <p className="text-sm text-slate-400">
        Review what you captured. From here, you can view the inspection results
        or save this inspection for later.
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
        <p className="text-[11px] text-slate-500">
          Details reflect what was visible at the time of inspection.
        </p>
      </section>

      {/* OBSERVATIONS */}
      <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 space-y-2">
        <h2 className="text-sm font-semibold text-amber-200">
          Inspection observations
        </h2>

        <p className="text-[11px] text-slate-400">
          These are things that stood out during the inspection. They are not
          diagnoses or confirmed faults.
        </p>

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

      {/* NEXT STEP */}
      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 space-y-3">
        <h2 className="text-sm font-semibold text-emerald-200">
          Ready to interpret the inspection?
        </h2>

        <p className="text-sm text-slate-300">
          CarVerity will now assess completeness, confidence, and key signals
          based on what you captured.
        </p>

        <button
          onClick={continueToResults}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
        >
          View inspection results
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
          <p className="text-[11px] text-slate-400 text-center">
            Saved locally to this device.
          </p>
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

      <p className="text-[11px] text-slate-400 text-center">
        CarVerity helps you interpret visible condition — it does not diagnose
        mechanical faults.
      </p>
    </div>
  );
}
