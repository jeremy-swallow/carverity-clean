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

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan
      </span>

      <section className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-semibold text-white">
          Inspection summary
        </h1>
        <p className="text-sm text-slate-300 max-w-xl">
          This is a recap of what you captured. Next, CarVerity will interpret
          the inspection and surface anything worth understanding.
        </p>
      </section>

      <section className="rounded-2xl bg-slate-900/60 px-6 py-5 space-y-2">
        <p className="font-semibold text-slate-100">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.variant ? ` — ${vehicle.variant}` : ""}
        </p>
        <p className="text-sm text-slate-400">
          Odometer: {vehicle.kms || "—"} km
        </p>
        <p className="text-xs text-slate-400">
          Details reflect what was visible at the time of inspection.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">
          Things you noted
        </h2>

        <div className="rounded-2xl bg-slate-900/50 px-6 py-5 space-y-2">
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
        </div>

        <p className="text-xs text-slate-400">
          These aren’t diagnoses — just things that stood out at the time.
        </p>
      </section>

      <section className="space-y-4">
        <button
          onClick={continueToResults}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-3"
        >
          View inspection results
        </button>

        {!savedId ? (
          <>
            <button
              onClick={saveToLibrary}
              className="w-full rounded-xl border border-white/25 text-slate-200 px-5 py-2"
            >
              Save inspection for later
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              Saved locally to this device.
            </p>
          </>
        ) : (
          <>
            <button
              onClick={viewMyScans}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3"
            >
              View in My Scans
            </button>
            <button
              onClick={startNewScan}
              className="w-full rounded-xl border border-white/25 text-slate-200 px-5 py-2"
            >
              Start a new inspection
            </button>
          </>
        )}
      </section>

      <p className="text-[11px] text-slate-400 text-center">
        CarVerity helps interpret visible condition — it does not diagnose
        mechanical faults.
      </p>
    </div>
  );
}
