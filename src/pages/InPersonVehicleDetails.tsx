// src/pages/InPersonVehicleDetails.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

/* =========================================================
   Minimal local make → model map
   (Expandable later or replace with API)
========================================================= */
const MAKES: Record<string, string[]> = {
  Toyota: ["Corolla", "Camry", "RAV4", "Hilux", "LandCruiser"],
  Mazda: ["Mazda 2", "Mazda 3", "CX-5", "CX-30", "BT-50"],
  Hyundai: ["i30", "Tucson", "Santa Fe", "Kona"],
  Ford: ["Ranger", "Focus", "Everest", "Mustang"],
  BMW: ["1 Series", "3 Series", "5 Series", "X3", "X5"],
  Mercedes: ["A-Class", "C-Class", "E-Class", "GLC"],
  Kia: ["Cerato", "Sportage", "Sorento"],
  Nissan: ["X-Trail", "Navara", "Qashqai"],
};

/* =========================================================
   Helpers
========================================================= */
function buildYears(range = 20): number[] {
  const now = new Date().getFullYear();
  return Array.from({ length: range }, (_, i) => now - i);
}

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

  const years = useMemo(() => buildYears(25), []);

  const [year, setYear] = useState<number | null>(
    (existing as any)?.vehicleYear ?? null
  );
  const [make, setMake] = useState<string>(
    (existing as any)?.vehicleMake ?? ""
  );
  const [model, setModel] = useState<string>(
    (existing as any)?.vehicleModel ?? ""
  );

  const [kilometres, setKilometres] = useState<number>(
    (existing as any)?.kilometres ?? 60000
  );

  const modelsForMake = useMemo(() => {
    return make ? MAKES[make] ?? [] : [];
  }, [make]);

  const isComplete = Boolean(year && make && model);

  /* =========================================================
     Persist progress defensively
  ========================================================== */

  useEffect(() => {
    saveProgress({
      type: "in-person",
      scanId,
      step: "/scan/in-person/vehicle-details",
      vehicleYear: year,
      vehicleMake: make,
      vehicleModel: model,
      kilometres,
    });
  }, [scanId, year, make, model, kilometres]);

  /* =========================================================
     Continue
  ========================================================== */

  function continueToPhotos() {
    if (!isComplete) return;

    saveProgress({
      step: "/scan/in-person/photos",
      vehicleYear: year,
      vehicleMake: make,
      vehicleModel: model,
      kilometres,
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
        Tell me about the vehicle
      </h1>

      {/* YEAR */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-200">Year</h2>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`rounded-lg px-3 py-2 text-sm font-medium border transition ${
                year === y
                  ? "bg-emerald-500 text-black border-emerald-400"
                  : "bg-slate-900/70 text-slate-300 border-white/15 hover:border-white/30"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </section>

      {/* MAKE */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-200">Make</h2>

        <select
          value={make}
          onChange={(e) => {
            setMake(e.target.value);
            setModel("");
          }}
          className="w-full rounded-xl bg-slate-900 border border-white/20 px-4 py-3 text-slate-200"
        >
          <option value="">Select make…</option>
          {Object.keys(MAKES).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </section>

      {/* MODEL */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-200">Model</h2>

        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!make}
          className="w-full rounded-xl bg-slate-900 border border-white/20 px-4 py-3 text-slate-200 disabled:opacity-50"
        >
          <option value="">
            {make ? "Select model…" : "Choose make first"}
          </option>
          {modelsForMake.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </section>

      {/* KILOMETRES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            Kilometres (approx.)
          </h2>
          <span className="text-sm text-slate-300">
            {kilometres.toLocaleString()} km
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={300000}
          step={5000}
          value={kilometres}
          onChange={(e) => setKilometres(Number(e.target.value))}
          className="w-full"
        />

        <p className="text-[11px] text-slate-400">
          This doesn’t need to be exact — it helps contextualise wear and value.
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
