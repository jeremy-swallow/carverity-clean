/* src/pages/OnlineVehicleDetails.tsx */

import { useEffect, useState } from "react";
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

const MAKES = [
  "Mazda",
  "Toyota",
  "Hyundai",
  "Kia",
  "Nissan",
  "Honda",
  "Ford",
  "Subaru",
  "Volkswagen",
];

const MODELS = [
  "CX-3",
  "CX-30",
  "Mazda 3",
  "Mazda 6",
  "Corolla",
  "Yaris",
  "i30",
  "Civic",
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

  const filteredMakes = MAKES.filter((m) =>
    m.toLowerCase().includes(vehicle.make.toLowerCase())
  );

  const filteredModels = MODELS.filter((m) =>
    m.toLowerCase().includes(vehicle.model.toLowerCase())
  );

  const canContinue =
    vehicle.make.trim() !== "" &&
    vehicle.model.trim() !== "" &&
    vehicle.year.trim() !== "";

  // Restore saved vehicle details safely
  useEffect(() => {
    saveProgress({
      type: "online",
      step: "/scan/online/vehicle-details",
      startedAt: new Date().toISOString(),
    });

    const raw = loadProgress();
    const existingVehicle = (raw as any)?.vehicle ?? {};

    setVehicle({
      make: existingVehicle.make ?? "",
      model: existingVehicle.model ?? "",
      year: existingVehicle.year ?? "",
      variant: existingVehicle.variant ?? "",
      importStatus:
        (existingVehicle.importStatus as ImportStatus) ?? "unknown",
    });
  }, []);

  function update<K extends keyof VehicleFormState>(
    key: K,
    value: VehicleFormState[K]
  ) {
    setVehicle((v) => ({ ...v, [key]: value }));
  }

  function handleContinue() {
    if (!canContinue) return;

    const raw = (loadProgress() ?? {}) as any;

    saveProgress({
      ...raw,
      vehicle: {
        ...(raw.vehicle ?? {}),
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        year: vehicle.year.trim(),
        variant: vehicle.variant.trim(),
        importStatus: vehicle.importStatus,
      },
    });

    navigate("/scan/online/kilometres");
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
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

      {/* MAKE */}
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-sm font-medium">
          Make<span className="text-red-400"> *</span>
        </label>

        <input
          value={vehicle.make}
          placeholder="e.g. Mazda, Toyota"
          onChange={(e) => {
            const v = e.target.value;
            update("make", v);
            setShowMakeSuggestions(v.trim().length > 0);
          }}
          onFocus={() => {
            if (vehicle.make.trim().length > 0) {
              setShowMakeSuggestions(true);
            }
          }}
          onBlur={() => setTimeout(() => setShowMakeSuggestions(false), 120)}
          className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
        />

        {showMakeSuggestions && filteredMakes.length > 0 && (
          <div className="absolute top-full mt-1 w-full border border-white/10 rounded-xl bg-slate-900/95 max-h-48 overflow-auto shadow-lg z-50">
            {filteredMakes.map((m) => (
              <button
                key={m}
                type="button"
                onMouseDown={() => {
                  update("make", m);
                  setShowMakeSuggestions(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-800/70"
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
            const v = e.target.value;
            update("model", v);
            setShowModelSuggestions(v.trim().length > 0);
          }}
          onFocus={() => {
            if (vehicle.model.trim().length > 0) {
              setShowModelSuggestions(true);
            }
          }}
          onBlur={() => setTimeout(() => setShowModelSuggestions(false), 120)}
          className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
        />

        {showModelSuggestions && filteredModels.length > 0 && (
          <div className="absolute top-full mt-1 w-full border border-white/10 rounded-xl bg-slate-900/95 max-h-48 overflow-auto shadow-lg z-50">
            {filteredModels.map((m) => (
              <button
                key={m}
                type="button"
                onMouseDown={() => {
                  update("model", m);
                  setShowModelSuggestions(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-800/70"
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* YEAR */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Year<span className="text-red-400"> *</span>
        </label>

        <input
          value={vehicle.year}
          placeholder="e.g. 2020"
          onChange={(e) => update("year", e.target.value)}
          className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
        />
      </div>

      {/* VARIANT */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Variant (optional)</label>

        <input
          value={vehicle.variant}
          placeholder="e.g. G20 Evolve (FWD)"
          onChange={(e) => update("variant", e.target.value)}
          className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
        />
      </div>

      {/* IMPORT STATUS */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Import status (optional)</label>

        <select
          value={vehicle.importStatus}
          onChange={(e) =>
            update("importStatus", e.target.value as ImportStatus)
          }
          className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
        >
          <option value="unknown">Sold new in Australia (default)</option>
          <option value="au-delivered-import-brand">
            Parallel import via manufacturer
          </option>
          <option value="grey-import">Grey import</option>
          <option value="au-new">Australian delivered — confirmed</option>
        </select>

        <p className="text-xs text-slate-400">
          Grey imports can have higher parts and repair costs.
        </p>
      </div>

      {/* ACTIONS */}
      <div className="mt-2">
        <button
          disabled={!canContinue}
          onClick={handleContinue}
          className={`px-5 py-3 rounded-xl font-semibold ${
            canContinue
              ? "bg-blue-400 text-black"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
