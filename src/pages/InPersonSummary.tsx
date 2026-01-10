import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

type ObservationValue = "ok" | "concern" | "unsure";

type CheckAnswer = {
  value: ObservationValue;
  note?: string;
};

export default function InPersonSummary() {
  const navigate = useNavigate();
  const { scanId: routeScanId } = useParams<{ scanId?: string }>();

  const progress: any = loadProgress();
  const activeScanId: string | null = progress?.scanId || routeScanId || null;

  const checks: Record<string, CheckAnswer> = progress?.checks ?? {};
  const photos = progress?.photos ?? [];

  const vehicle = {
    year: progress?.vehicleYear ?? "",
    make: progress?.vehicleMake ?? "",
    model: progress?.vehicleModel ?? "",
    variant: progress?.vehicleVariant ?? "",
    kms: progress?.vehicleKms ?? progress?.kilometres ?? "",
  };

  const [savedId, setSavedId] = useState<string | null>(null);

  /* =========================================================
     Inspection zone definition (summary mirror)
  ========================================================== */

  const zones = [
    {
      id: "around-car",
      title: "Around the car",
      checks: [
        { id: "tyre-wear", label: "Tyre wear & tread" },
        { id: "brakes-visible", label: "Brake discs (if visible)" },
        { id: "seatbelts-trim", label: "Seatbelts and airbag trim" },
      ],
    },
    {
      id: "inside-cabin",
      title: "Inside the cabin",
      checks: [
        { id: "interior-smell", label: "Smell or moisture" },
        { id: "interior-condition", label: "General interior condition" },
        { id: "aircon", label: "Air-conditioning performance" },
      ],
    },
    {
      id: "driver-seat",
      title: "Driver’s seat",
      checks: [
        { id: "warning-lights", label: "Warning lights on dashboard" },
      ],
    },
    {
      id: "engine-bay",
      title: "Under the bonnet",
      checks: [
        { id: "engine-visual", label: "Visual engine bay check" },
      ],
    },
    {
      id: "test-drive",
      title: "During the drive",
      checks: [
        { id: "steering-feel", label: "Steering & handling" },
        { id: "noise-vibration", label: "Noise or hesitation" },
        {
          id: "safety-features",
          label: "Safety / driver-assist features (if fitted)",
        },
      ],
    },
  ];

  /* =========================================================
     Derived summary data
  ========================================================== */

  const zoneSummaries = useMemo(() => {
    return zones
      .map((zone) => {
        const items = zone.checks
          .map((c) => {
            const answer = checks[c.id];
            if (!answer) return null;
            return {
              ...c,
              value: answer.value,
              note: answer.note,
            };
          })
          .filter(Boolean);

        return items.length > 0
          ? { id: zone.id, title: zone.title, items }
          : null;
      })
      .filter(Boolean);
  }, [checks]);

  const concernCount = useMemo(() => {
    return Object.values(checks).filter(
      (c) => c.value === "concern"
    ).length;
  }, [checks]);

  const uncertaintyCount = useMemo(() => {
    return Object.values(checks).filter(
      (c) => c.value === "unsure"
    ).length;
  }, [checks]);

  const confidenceMessage = useMemo(() => {
    if (concernCount === 0 && uncertaintyCount === 0) {
      return "Your inspection didn’t surface any notable concerns.";
    }

    if (concernCount > 0) {
      return "Some observations you noted may be worth confirming before proceeding.";
    }

    return "Some areas couldn’t be fully checked, which may be worth clarifying.";
  }, [concernCount, uncertaintyCount]);

  /* =========================================================
     Save
  ========================================================== */

  function saveToLibrary() {
    const id = activeScanId ?? generateScanId();

    saveScan({
      id,
      type: "in-person",
      title: "In-person inspection",
      createdAt: new Date().toISOString(),
      data: {
        vehicle,
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

  /* =========================================================
     Render
  ========================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan — Inspection summary
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Inspection summary
      </h1>

      {/* VEHICLE */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4">
        <p className="font-semibold text-slate-100">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.variant ? ` — ${vehicle.variant}` : ""}
        </p>
        <p className="text-sm text-slate-400">
          Odometer: {vehicle.kms || "—"} km
        </p>
      </section>

      {/* INSPECTION FINDINGS */}
      {zoneSummaries.map((zone: any) => (
        <section
          key={zone.id}
          className="rounded-2xl border border-white/12 bg-slate-900/60 px-5 py-4 space-y-2"
        >
          <h2 className="text-sm font-semibold text-slate-100">
            {zone.title}
          </h2>

          <ul className="space-y-2">
            {zone.items.map((item: any) => (
              <li key={item.id} className="text-sm text-slate-300">
                <div>
                  <span className="font-medium">{item.label}:</span>{" "}
                  {item.value === "ok"
                    ? "Seemed normal"
                    : item.value === "concern"
                    ? "Something stood out"
                    : "Couldn’t check"}
                </div>
                {item.note && (
                  <div className="text-xs text-slate-400 mt-0.5">
                    Inspector note: “{item.note}”
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* CONFIDENCE */}
      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4">
        <h2 className="text-sm font-semibold text-emerald-200">
          Overall confidence
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          {confidenceMessage}
        </p>
      </section>

      {/* SAVE */}
      {!savedId ? (
        <button
          onClick={saveToLibrary}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
        >
          Save inspection to My Scans
        </button>
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
            Start a new scan
          </button>
        </>
      )}
    </div>
  );
}
