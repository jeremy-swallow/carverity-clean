// src/pages/InPersonVehicleDetails.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

/* =========================================================
   Constants
========================================================= */

const CURRENT_YEAR = new Date().getFullYear();

const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 1949 + 2 },
  (_, i) => String(CURRENT_YEAR + 1 - i)
);

const KM_RANGES = [
  { label: "Under 10,000 km", min: 0, max: 10000 },
  { label: "10,000 – 25,000 km", min: 10000, max: 25000 },
  { label: "25,000 – 50,000 km", min: 25000, max: 50000 },
  { label: "50,000 – 75,000 km", min: 50000, max: 75000 },
  { label: "75,000 – 100,000 km", min: 75000, max: 100000 },
  { label: "100,000 – 150,000 km", min: 100000, max: 150000 },
  { label: "150,000 – 200,000 km", min: 150000, max: 200000 },
  { label: "200,000 – 300,000 km", min: 200000, max: 300000 },
  { label: "300,000 – 500,000 km", min: 300000, max: 500000 },
  { label: "Over 500,000 km", min: 500000, max: 999999 },
];

/* =========================================================
   Helpers
========================================================= */

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
    clampKm((existing as any)?.kilometres ?? 0)
  );

  const filteredYears = useMemo(() => {
    if (!year) return YEAR_OPTIONS.slice(0, 12);
    return YEAR_OPTIONS.filter((y) => y.startsWith(year)).slice(0, 12);
  }, [year]);

  const kmSuggestions = useMemo(() => {
    if (!kilometres) return KM_RANGES;
    return KM_RANGES.filter(
      (r) => kilometres >= r.min - 20000 && kilometres <= r.max + 20000
    );
  }, [kilometres]);

  const isComplete =
    year.trim().length === 4 &&
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
      vehicleYear: year,
      vehicleMake: make.trim(),
      vehicleModel: model.trim(),
      kilometres,
    });
  }, [scanId, year, make, model, kilometres]);

  /* =========================================================
     Continue
  ========================================================== */

  function continueToPhotos() {
    if (!isComplete) return;
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
          Year
        </label>

        <input
          inputMode="numeric"
          placeholder="Start typing (e.g. 2018)"
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
          className="w-full rounded-xl bg-slate-900 border border-white/20 px-4 py-3 text-slate-200"
        />

        {filteredYears.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-slate-900/80 divide-y divide-white/10">
            {filteredYears.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                {y}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* MAKE */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-slate-200">
          Make
        </label>

        <input
          placeholder="Start typing (e.g. Mazda)"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          className="w-full rounded-xl bg-slate-900 border border-white/20 px-4 py-3 text-slate-200"
        />

        {make.length > 0 && (
          <div className="text-[11px] text-slate-400">
            Suggestions adapt as you type — all makes are supported.
          </div>
        )}
      </section>

      {/* MODEL */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-slate-200">
          Model
        </label>

        <input
          placeholder="Start typing (e.g. CX-5 Touring)"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-xl bg-slate-900 border border-white/20 px-4 py-3 text-slate-200"
        />
      </section>

      {/* KILOMETRES */}
      <section className="space-y-3">
        <label className="text-sm font-semibold text-slate-200">
          Kilometres
        </label>

        <input
          inputMode="numeric"
          placeholder="e.g. 84500"
          value={kilometres || ""}
          onChange={(e) =>
            setKilometres(clampKm(Number(e.target.value.replace(/\D/g, ""))))
          }
          className="w-full rounded-xl bg-slate-900 border border-white/20 px-4 py-3 text-slate-200"
        />

        <div className="rounded-xl border border-white/10 bg-slate-900/80 divide-y divide-white/10">
          {kmSuggestions.map((r) => (
            <button
              key={r.label}
              onClick={() =>
                setKilometres(Math.round((r.min + r.max) / 2))
              }
              className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

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
