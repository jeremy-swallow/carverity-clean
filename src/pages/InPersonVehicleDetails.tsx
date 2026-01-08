// src/pages/InPersonVehicleDetails.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

/* =========================================================
   Optional suggestion data (non-blocking)
========================================================= */

const COMMON_MAKES = [
  "Toyota",
  "Mazda",
  "Hyundai",
  "Ford",
  "Holden",
  "Kia",
  "Nissan",
  "BMW",
  "Mercedes-Benz",
  "Volkswagen",
  "Subaru",
  "Mitsubishi",
  "Audi",
  "Honda",
  "Isuzu",
  "Land Rover",
  "Lexus",
];

const CURRENT_YEAR = new Date().getFullYear();

/* =========================================================
   Helpers
========================================================= */

function clampYear(value: number) {
  if (value < 1950) return 1950;
  if (value > CURRENT_YEAR + 1) return CURRENT_YEAR + 1;
  return value;
}

function clampKm(value: number) {
  if (value < 0) return 0;
  if (value > 999999) return 999999;
  return value;
}

/* =========================================================
   Component
========================================================= */

export default function InPersonVehicleDetails() {
  const navigate = useNavigate();
  const existing = loadProgress();

  const [scanId] = useState<string>(() => {
    if (existing?.scanId) return existing.scanId;
    const id = generateScanId();
    saveProgress({ scanId: id, type: "in-person" });
    return id;
  });

  /* =========================================================
     State
  ========================================================== */

  const [year, setYear] = useState<string>(
    String((existing as any)?.vehicleYear ?? "")
  );
  const [make, setMake] = useState<string>(
    (existing as any)?.vehicleMake ?? ""
  );
  const [model, setModel] = useState<string>(
    (existing as any)?.vehicleModel ?? ""
  );

  const [kilometres, setKilometres] = useState<number>(
    clampKm((existing as any)?.kilometres ?? 85000)
  );

  const parsedYear = useMemo(() => {
    const n = parseInt(year, 10);
    if (Number.isNaN(n)) return null;
    return clampYear(n);
  }, [year]);

  const isComplete =
    Boolean(parsedYear) &&
    make.trim().length > 1 &&
    model.trim().length > 0;

  /* =========================================================
     Persist progress
  ========================================================== */

  useEffect(() => {
    saveProgress({
      type: "in-person",
      scanId,
      step: "/scan/in-person/vehicle-details",
      vehicleYear: parsedYear,
      vehicleMake: make.trim(),
      vehicleModel: model.trim(),
      kilometres,
    });
  }, [scanId, parsedYear, make, model, kilometres]);

  /* =========================================================
     Continue
  ========================================================== */

  function continueToPhotos() {
    if (!isComplete) return;

    saveProgress({
      step: "/scan/in-person/photos",
    });

    navigate("/scan/in-person/photos");
  }

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Vehicle details
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Vehicle details
      </h1>

      {/* YEAR */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-slate-200">
          Year of manufacture
        </label>

        <input
          type="number"
          inputMode="numeric"
          placeholder="e.g. 2017"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-full rounded-xl bg-slate-900 border border-white/20 px-4 py-3 text-slate-200"
        />

        <div className="flex gap-2 flex-wrap">
          {[2023, 2020, 2015, 2010, 2005].map((y) => (
            <button
              key={y}
              onClick={() => setYear(String(y))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/15 text-xs text-slate-300 hover:border-white/30"
            >
              {y}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-slate-400">
          Approximate year is fine — this is for context, not verification.
        </p>
      </section>

      {/* MAKE */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-slate-200">
          Make
        </label>

        <input
          list="makes"
          placeholder="e.g. Toyota"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          className="w-full rounded-xl bg-slate-900 border border-white/20 px-4 py-3 text-slate-200"
        />

        <datalist id="makes">
          {COMMON_MAKES.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </section>

      {/* MODEL */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-slate-200">
          Model
        </label>

        <input
          placeholder="e.g. Corolla Ascent Sport"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-xl bg-slate-900 border border-white/20 px-4 py-3 text-slate-200"
        />
      </section>

      {/* KILOMETRES */}
      <section className="space-y-3">
        <label className="text-sm font-semibold text-slate-200">
          Kilometres (approx.)
        </label>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={600000}
            step={5000}
            value={kilometres}
            onChange={(e) =>
              setKilometres(clampKm(Number(e.target.value)))
            }
            className="flex-1"
          />

          <input
            type="number"
            inputMode="numeric"
            value={kilometres}
            onChange={(e) =>
              setKilometres(clampKm(Number(e.target.value)))
            }
            className="w-28 rounded-lg bg-slate-900 border border-white/20 px-3 py-2 text-slate-200 text-sm"
          />
        </div>

        <p className="text-[11px] text-slate-400">
          High kilometres don’t automatically mean problems — they simply help
          frame wear and value.
        </p>
      </section>

      {/* CTA */}
      <button
        onClick={continueToPhotos}
        disabled={!isComplete}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-4 py-3 shadow"
      >
        Continue to photo inspection
      </button>
    </div>
  );
}
