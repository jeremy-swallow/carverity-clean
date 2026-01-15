// src/pages/InPersonSummary.tsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, clearProgress, saveProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

function labelForCheck(id: string) {
  const map: Record<string, string> = {
    // Around car
    "body-panels": "Body panels & alignment",
    paint: "Paint condition",
    "glass-lights": "Glass & lights",
    tyres: "Tyres condition",
    "underbody-leaks": "Visible fluid leaks (if noticed)",

    // Cabin
    "interior-smell": "Smell or moisture",
    "interior-condition": "General interior condition",
    aircon: "Air-conditioning",

    // Drive
    steering: "Steering & handling",
    "noise-hesitation": "Noise or hesitation",
    "adas-systems": "Driver-assist safety systems (if fitted)",
  };

  return map[id] || id.replace(/[-_]/g, " ");
}

export default function InPersonSummary() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const activeScanId: string = progress?.scanId ?? generateScanId();

  const imperfections = progress?.imperfections ?? [];
  const checks: Record<string, CheckAnswer> = progress?.checks ?? {};
  const photos = progress?.photos ?? [];
  const followUps = progress?.followUpPhotos ?? [];

  const vehicle = {
    year: progress?.vehicleYear ?? "",
    make: progress?.vehicleMake ?? "",
    model: progress?.vehicleModel ?? "",
    variant: progress?.vehicleVariant ?? "",
    kms: progress?.vehicleKms ?? progress?.kilometres ?? "",
  };

  const [savedId, setSavedId] = useState<string | null>(null);

  const checksAnsweredCount = useMemo(() => {
    return Object.values(checks).filter((v) => Boolean(v?.value)).length;
  }, [checks]);

  const notesCount = useMemo(() => {
    return Object.values(checks).filter((v) => (v?.note ?? "").trim().length > 0)
      .length;
  }, [checks]);

  const concerns = useMemo(() => {
    return Object.entries(checks)
      .filter(([, v]) => v?.value === "concern")
      .map(([id, v]) => ({
        id,
        label: labelForCheck(id),
        note: (v?.note ?? "").trim(),
      }));
  }, [checks]);

  const notesOnly = useMemo(() => {
    return Object.entries(checks)
      .filter(([, v]) => (v?.note ?? "").trim().length > 0 && v?.value !== "concern")
      .map(([id, v]) => ({
        id,
        label: labelForCheck(id),
        note: (v?.note ?? "").trim(),
        value: v?.value,
      }));
  }, [checks]);

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

      {/* EVIDENCE COUNTS (this is what prevents “I did all that for nothing”) */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/60 px-5 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Photos
            </p>
            <p className="text-lg font-semibold text-white tabular-nums">
              {photos.length}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Checks
            </p>
            <p className="text-lg font-semibold text-white tabular-nums">
              {checksAnsweredCount}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Notes
            </p>
            <p className="text-lg font-semibold text-white tabular-nums">
              {notesCount}
            </p>
          </div>
        </div>

        {followUps.length > 0 && (
          <p className="text-xs text-slate-400 mt-3">
            Follow-up photos captured:{" "}
            <span className="text-slate-200 tabular-nums">{followUps.length}</span>
          </p>
        )}
      </section>

      {/* OBSERVATIONS */}
      <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 space-y-3">
        <h2 className="text-sm font-semibold text-amber-200">
          Inspection observations
        </h2>

        {/* Imperfections */}
        {imperfections.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-amber-200/80">
              Visual observations
            </p>
            <ul className="text-sm text-slate-200 space-y-1">
              {imperfections.map((i: any) => (
                <li key={i.id}>
                  • {i.area || i.location || "Observation"}: {i.type || i.label || "Noted"}
                  {i.note ? ` — ${i.note}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {concerns.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-amber-200/80">
              Things that stood out
            </p>
            <ul className="text-sm text-slate-200 space-y-2">
              {concerns.map((c) => (
                <li key={c.id} className="leading-relaxed">
                  • <span className="font-semibold">{c.label}</span>
                  {c.note ? (
                    <span className="text-slate-300"> — {c.note}</span>
                  ) : (
                    <span className="text-slate-400"> — (no note)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes that aren’t “concern” */}
        {notesOnly.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-amber-200/80">
              Notes you recorded
            </p>
            <ul className="text-sm text-slate-200 space-y-2">
              {notesOnly.map((n) => (
                <li key={n.id} className="leading-relaxed">
                  • <span className="font-semibold">{n.label}</span>
                  <span className="text-slate-300"> — {n.note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty state */}
        {imperfections.length === 0 && concerns.length === 0 && notesOnly.length === 0 ? (
          <p className="text-sm text-slate-300">
            No notable observations were recorded.
          </p>
        ) : (
          <p className="text-xs text-slate-400 pt-1">
            These notes will be reflected in your report and negotiation guidance.
          </p>
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
