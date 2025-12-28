/* src/pages/OnlineVehicleDetails.tsx */

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type ImportStatus =
  | "au-new"
  | "au-delivered-import-brand"
  | "grey-import"
  | "unknown";

interface VehicleFormState {
  make: string;
  model: string;
  year: string;
  variant: string;
  importStatus: ImportStatus;
}

type VehicleLibraryEntry = {
  make: string;
  model: string;
  yearHint?: string;
};

/**
 * Simple local library for suggestions.
 * This is intentionally small for now – can be swapped for a real data source later.
 */
const VEHICLE_LIBRARY: VehicleLibraryEntry[] = [
  { make: "Mazda", model: "CX-3" },
  { make: "Mazda", model: "CX-30" },
  { make: "Mazda", model: "3" },
  { make: "Mazda", model: "6" },
  { make: "Toyota", model: "Corolla" },
  { make: "Toyota", model: "Camry" },
  { make: "Toyota", model: "RAV4" },
  { make: "Hyundai", model: "i30" },
  { make: "Hyundai", model: "Tucson" },
  { make: "Kia", model: "Sportage" },
  { make: "Kia", model: "Cerato" },
];

export default function OnlineVehicleDetails() {
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<VehicleFormState>({
    make: "",
    model: "",
    year: "",
    variant: "",
    importStatus: "unknown",
  });

  const canContinue =
    vehicle.make.trim() !== "" &&
    vehicle.model.trim() !== "" &&
    vehicle.year.trim() !== "";

  // Restore from scanProgress on mount
  useEffect(() => {
    saveProgress({
      type: "online",
      step: "/scan/online/vehicle-details",
      startedAt: new Date().toISOString(),
    });

    const existing: any = loadProgress();
    if (existing?.vehicle) {
      const v = existing.vehicle as any;
      setVehicle({
        make: v.make ?? "",
        model: v.model ?? "",
        year: v.year ?? "",
        variant: v.variant ?? "",
        importStatus: (v.importStatus as ImportStatus) ?? "unknown",
      });
    }
  }, []);

  function update<K extends keyof VehicleFormState>(
    key: K,
    value: VehicleFormState[K]
  ) {
    setVehicle((prev) => ({ ...prev, [key]: value }));
  }

  function handleSuggestionClick(entry: VehicleLibraryEntry) {
    setVehicle((prev) => ({
      ...prev,
      make: entry.make,
      model: entry.model,
      year: prev.year || entry.yearHint || "",
    }));
  }

  const suggestions = useMemo(() => {
    const makeSearch = vehicle.make.trim().toLowerCase();
    const modelSearch = vehicle.model.trim().toLowerCase();

    if (!makeSearch && !modelSearch) return [];

    return VEHICLE_LIBRARY.filter((entry) => {
      const m = entry.make.toLowerCase();
      const mdl = entry.model.toLowerCase();

      const matchMake = makeSearch && m.startsWith(makeSearch);
      const matchModel = modelSearch && mdl.startsWith(modelSearch);

      return matchMake || matchModel;
    }).slice(0, 6);
  }, [vehicle.make, vehicle.model]);

  function handleContinue() {
    if (!canContinue) return;

    const existing: any = loadProgress() ?? {};

    saveProgress({
      ...existing,
      vehicle: {
        ...(existing.vehicle ?? {}),
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        year: vehicle.year.trim(),
        variant: vehicle.variant.trim(),
        importStatus: vehicle.importStatus,
      },
    });

    // Use the internal /scan route that we know exists
    navigate("/scan/online/kilometres");
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
      {/* Step context */}
      <div className="flex flex-col gap-1">
        <span className="text-xs tracking-wider uppercase text-slate-400">
          Online scan · Step 2 of 5
        </span>

        <h1 className="text-2xl font-extrabold text-white">
          Tell us a bit about the car
        </h1>

        <p className="text-slate-300 text-sm">
          These details help improve your AI guidance. If you’re not sure about
          a field, just enter your best guess.
        </p>
      </div>

      {/* Form */}
      <div className="grid gap-4">
        {/* Make */}
        <Field
          label="Make"
          placeholder="e.g. Mazda, Toyota"
          value={vehicle.make}
          onChange={(v) => update("make", v)}
          required
        />

        {/* Model with suggestions */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-slate-200 font-medium">
            Model<span className="text-red-400"> *</span>
          </label>
          <input
            value={vehicle.model}
            placeholder="e.g. CX-30, Corolla"
            onChange={(e) => update("model", e.target.value)}
            className="px-4 py-3 rounded-xl text-sm bg-slate-900/80 border border-white/10 text-slate-100"
          />
          <p className="text-xs text-slate-400">
            Start typing and pick your car from the suggestions below, or enter
            it manually.
          </p>

          {suggestions.length > 0 && (
            <div className="mt-2 border border-white/10 rounded-xl bg-slate-900/90 max-h-48 overflow-auto text-sm">
              {suggestions.map((entry, idx) => (
                <button
                  key={`${entry.make}-${entry.model}-${idx}`}
                  type="button"
                  onClick={() => handleSuggestionClick(entry)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-800/80 flex flex-col"
                >
                  <span className="text-slate-100">
                    {entry.make} {entry.model}
                  </span>
                  {entry.yearHint && (
                    <span className="text-xs text-slate-400">
                      Common around {entry.yearHint}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Year */}
        <Field
          label="Year"
          placeholder="e.g. 2020"
          value={vehicle.year}
          onChange={(v) => update("year", v)}
          required
        />

        {/* Variant */}
        <Field
          label="Variant (optional)"
          placeholder="e.g. G20 Touring / Sport / GT"
          value={vehicle.variant}
          onChange={(v) => update("variant", v)}
        />

        {/* Import status */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-slate-200 font-medium">
            Import status (optional)
          </label>

          <select
            value={vehicle.importStatus}
            onChange={(e) =>
              update("importStatus", e.target.value as ImportStatus)
            }
            className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-slate-100 text-sm"
          >
            <option value="unknown">Not sure</option>
            <option value="au-new">Sold new in Australia</option>
            <option value="au-delivered-import-brand">
              Australian delivered but imported brand
            </option>
            <option value="grey-import">Grey import / private import</option>
          </select>

          <p className="text-xs text-slate-400">
            Grey imports can have higher parts and repair costs. We’ll factor
            this into your guidance.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="px-5 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 bg-blue-400 text-slate-900"
        >
          Continue
        </button>

        {!canContinue && (
          <p className="mt-2 text-xs text-slate-400">
            Please enter at least the make, model and year to continue.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-slate-200 font-medium">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-3 rounded-xl text-sm bg-slate-900/80 border border-white/10 text-slate-100"
      />
    </div>
  );
}
