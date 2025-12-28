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

  useEffect(() => {
    // Mark step reached
    saveProgress({
      type: "online",
      step: "/scan/online/vehicle-details",
      startedAt: new Date().toISOString(),
    });

    // Restore values if returning to this step
    const existing: any = loadProgress();

    if (existing?.vehicle) {
      setVehicle({
        make: existing.vehicle.make ?? "",
        model: existing.vehicle.model ?? "",
        year: existing.vehicle.year ?? "",
        variant: existing.vehicle.variant ?? "",
        importStatus:
          typeof existing.vehicle.importStatus === "string"
            ? (existing.vehicle.importStatus as ImportStatus)
            : "unknown",
      });
    }
  }, []);

  function update<K extends keyof VehicleFormState>(
    key: K,
    value: VehicleFormState[K]
  ) {
    setVehicle((v) => ({ ...v, [key]: value }));
  }

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

    navigate("/online-kilometres");
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
        <Field
          label="Make"
          placeholder="e.g. Toyota"
          value={vehicle.make}
          onChange={(v) => update("make", v)}
          required
        />

        <Field
          label="Model"
          placeholder="e.g. Corolla"
          value={vehicle.model}
          onChange={(v) => update("model", v)}
          required
        />

        <Field
          label="Year"
          placeholder="e.g. 2016"
          value={vehicle.year}
          onChange={(v) => update("year", v)}
          required
        />

        <Field
          label="Variant (optional)"
          placeholder="e.g. ZR / Sport / Premium"
          value={vehicle.variant}
          onChange={(v) => update("variant", v)}
        />

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
