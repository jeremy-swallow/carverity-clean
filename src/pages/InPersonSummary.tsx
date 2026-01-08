import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

export default function InPersonSummary() {
  const navigate = useNavigate();
  const { scanId: routeScanId } = useParams<{ scanId?: string }>();

  const progress: any = loadProgress();

  const activeScanId: string | null =
    progress?.scanId || routeScanId || null;

  const imperfections = progress?.imperfections ?? [];
  const followUps = progress?.followUpPhotos ?? [];
  const checks = progress?.checks ?? {};
  const photos = progress?.photos ?? [];
  const fromOnlineScan = Boolean(progress?.fromOnlineScan);

  const vehicle = {
    year: progress?.vehicleYear ?? "",
    make: progress?.vehicleMake ?? "",
    model: progress?.vehicleModel ?? "",
    variant: progress?.vehicleVariant ?? "",
    kms: progress?.vehicleKms ?? "",
  };

  const [savedId, setSavedId] = useState<string | null>(null);

  const journeyMissing =
    !progress || (!imperfections.length && !Object.keys(checks).length);

  if (journeyMissing && !savedId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          Inspection summary unavailable
        </h1>

        <p className="text-sm text-slate-300">
          The in-person inspection data for this session could not be found.
        </p>

        <button
          onClick={() => navigate("/scan/in-person/photos")}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
        >
          Restart in-person inspection
        </button>

        <button
          onClick={() => navigate("/start-scan")}
          className="w-full mt-2 rounded-xl border border-white/25 text-slate-200 px-4 py-2"
        >
          Return to start
        </button>
      </div>
    );
  }

  function saveToLibrary() {
    const id = activeScanId ?? generateScanId();

    saveScan({
      id,
      type: "in-person",
      title: fromOnlineScan
        ? "In-person follow-up inspection"
        : "In-person inspection — stand-alone",
      createdAt: new Date().toISOString(),
      data: {
        vehicle,
        imperfections,
        followUps,
        checks,
        photos,
      },
    } as any);

    clearProgress();
    setSavedId(id);
  }

  function viewMyScans() {
    navigate("/my-scans");
  }

  function startNewScan() {
    clearProgress();
    navigate("/start-scan");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Inspection summary
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Inspection summary
      </h1>

      {/* VEHICLE IDENTITY */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-1">
        <p className="text-base font-semibold text-slate-100">
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
            No notable observations were recorded during this visit.
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

      {/* FOLLOW UPS */}
      {followUps.length > 0 && (
        <section className="rounded-2xl border border-indigo-400/30 bg-indigo-600/10 px-5 py-4 space-y-2">
          <h2 className="text-sm font-semibold text-indigo-200">
            Areas reviewed in person
          </h2>

          <ul className="text-sm text-slate-300 space-y-1">
            {followUps.map((f: any) => (
              <li key={f.id}>• {f.label}</li>
            ))}
          </ul>
        </section>
      )}

      {/* CHECKS */}
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

      {/* SAVE ACTIONS */}
      {!savedId ? (
        <>
          <button
            onClick={saveToLibrary}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
          >
            Save inspection to My Scans
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            Once saved, you can revisit or compare this inspection at any time.
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
