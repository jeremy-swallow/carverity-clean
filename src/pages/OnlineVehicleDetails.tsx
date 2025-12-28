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
};

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

  const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  const canContinue = !!(vehicle.make && vehicle.model && vehicle.year);

  useEffect(() => {
    saveProgress({
      type: "online",
      step: "/scan/online/vehicle-details",
      startedAt: new Date().toISOString(),
    });

    const existing: any = loadProgress();
    if (existing?.vehicle) {
      const v = existing.vehicle as Partial<VehicleFormState>;
      setVehicle({
        make: v.make ?? "",
        model: v.model ?? "",
        year: v.year ?? "",
        variant: v.variant ?? "",
        importStatus: v.importStatus ?? "unknown",
      });
    }
  }, []);

  function update<K extends keyof VehicleFormState>(
    key: K,
    value: VehicleFormState[K]
  ) {
    setVehicle((prev) => ({ ...prev, [key]: value }));
  }

  // ---------- Suggestions ----------

  const makeSuggestions = useMemo(() => {
    const q = vehicle.make.toLowerCase().trim();
    if (!q) return [];
    return [...new Set(VEHICLE_LIBRARY.map((v) => v.make))]
      .filter((m) => m.toLowerCase().startsWith(q))
      .slice(0, 6);
  }, [vehicle.make]);

  const modelSuggestions = useMemo(() => {
    const q = vehicle.model.toLowerCase().trim();
    if (!q) return [];
    return VEHICLE_LIBRARY.filter(
      (v) =>
        v.model.toLowerCase().startsWith(q) &&
        (!vehicle.make || v.make === vehicle.make)
    )
      .map((v) => v.model)
      .slice(0, 6);
  }, [vehicle.model, vehicle.make]);

  function handleContinue() {
    const existing: any = loadProgress() ?? {};
    saveProgress({ ...existing, vehicle: { ...vehicle } });
    navigate("/scan/online/kilometres");
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
      {/* Step header */}
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase text-slate-400">
          Online scan · Step 2 of 5
        </span>
        <h1 className="text-2xl font-extrabold">Tell us a bit about the car</h1>
        <p className="text-slate-300 text-sm">
          These details help improve your AI guidance.
        </p>
      </div>

      {/* Form */}
      <div className="grid gap-4">

        {/* MAKE */}
        <div className="flex flex-col gap-1.5 relative">
          <label className="text-sm font-medium">
            Make<span className="text-red-400"> *</span>
          </label>

          <input
            value={vehicle.make}
            placeholder="e.g. Mazda, Toyota"
            onChange={(e) => {
              update("make", e.target.value);
              setShowMakeSuggestions(true);
            }}
            onFocus={() => setShowMakeSuggestions(true)}
            onBlur={() => setTimeout(() => setShowMakeSuggestions(false), 120)}
            className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
          />

          {showMakeSuggestions && makeSuggestions.length > 0 && (
            <div className="absolute top-full mt-1 w-full border border-white/10 rounded-xl bg-slate-900/95 max-h-48 overflow-auto">
              {makeSuggestions.map((m: string) => (
                <button
                  key={m}
                  type="button"
                  onMouseDown={() => {
                    update("make", m);
                    setShowMakeSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-800/80"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MODEL */}
        <div className="flex flex-col gap-1.5 relative">
          <label className="text-sm font-medium">
            Model<span className="text-red-400"> *</span>
          </label>

          <input
            value={vehicle.model}
            placeholder="e.g. CX-30, Corolla"
            onChange={(e) => {
              update("model", e.target.value);
              setShowModelSuggestions(true);
            }}
            onFocus={() => setShowModelSuggestions(true)}
            onBlur={() => setTimeout(() => setShowModelSuggestions(false), 120)}
            className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
          />

          {showModelSuggestions && modelSuggestions.length > 0 && (
            <div className="absolute top-full mt-1 w-full border border-white/10 rounded-xl bg-slate-900/95 max-h-48 overflow-auto">
              {modelSuggestions.map((m: string) => (
                <button
                  key={m}
                  type="button"
                  onMouseDown={() => {
                    update("model", m);
                    setShowModelSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-800/80"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* YEAR */}
        <Field
          label="Year"
          value={vehicle.year}
          placeholder="e.g. 2020"
          required
          onChange={(v) => update("year", v)}
        />

        {/* VARIANT */}
        <Field
          label="Variant (optional)"
          value={vehicle.variant}
          placeholder="e.g. G20 Evolve"
          onChange={(v) => update("variant", v)}
        />

        {/* IMPORT STATUS */}
        <FieldSelect
          label="Import status (optional)"
          value={vehicle.importStatus}
          onChange={(v) => update("importStatus", v as ImportStatus)}
          options={[
            ["unknown", "Not sure"],
            ["au-new", "Sold new in Australia"],
            [
              "au-delivered-import-brand",
              "Australian delivered but imported brand",
            ],
            ["grey-import", "Grey import / private import"],
          ]}
        />
      </div>

      {/* Continue */}
      <div className="mt-4">
        <button
          disabled={!canContinue}
          onClick={handleContinue}
          className="px-5 py-3 rounded-xl bg-blue-400 text-black font-semibold disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

/* ---------- Shared field components ---------- */

interface FieldProps {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  onChange: (v: string) => void;
}

function Field({ label, value, placeholder, required, onChange }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
      />
    </div>
  );
}

type FieldSelectOption = [value: string, label: string];

interface FieldSelectProps {
  label: string;
  value: string;
  options: FieldSelectOption[];
  onChange: (v: string) => void;
}

function FieldSelect({ label, value, onChange, options }: FieldSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
      >
        {options.map(([val, text]) => (
          <option key={val} value={val}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}
