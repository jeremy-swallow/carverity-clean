// src/pages/OnlineVehicleDetails.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

interface VehicleState {
  make: string;
  model: string;
  year: string;
  variant: string;
  importStatus: string;
}

export default function OnlineVehicleDetails() {
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<VehicleState>({
    make: "",
    model: "",
    year: "",
    variant: "",
    importStatus: "Sold new in Australia (default)",
  });

  useEffect(() => {
    const progress = (loadProgress() as any) ?? {};
    const extracted = (progress.vehicle ?? {}) as Partial<VehicleState>;

    const filled: VehicleState = {
      make: extracted.make ?? "",
      model: extracted.model ?? "",
      year: extracted.year ?? "",
      variant: extracted.variant ?? "",
      importStatus:
        extracted.importStatus ?? "Sold new in Australia (default)",
    };

    console.log("Hydrating vehicle >>>", filled);
    setVehicle(filled);
  }, []);

  function updateField<K extends keyof VehicleState>(
    field: K,
    value: VehicleState[K]
  ) {
    setVehicle((prev) => {
      const next = { ...prev, [field]: value };
      const progress = (loadProgress() as any) ?? {};

      saveProgress({
        ...progress,
        vehicle: next,
        step: "/online/vehicle",
      });

      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const progress = (loadProgress() as any) ?? {};
    saveProgress({
      ...progress,
      vehicle,
      step: "/online/owners",
    });

    navigate("/online/owners");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-2">
          Tell us a bit about the car
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          ✨ Estimated from the listing — please review before continuing
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Make</label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.make}
              onChange={(e) => updateField("make", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Model</label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.model}
              onChange={(e) => updateField("model", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Year</label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.year}
              onChange={(e) => updateField("year", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Variant <span className="text-slate-500">(optional)</span>
            </label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.variant}
              onChange={(e) => updateField("variant", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Import status (estimated)
            </label>
            <select
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.importStatus}
              onChange={(e) => updateField("importStatus", e.target.value)}
            >
              <option value="Sold new in Australia (default)">
                Sold new in Australia (default)
              </option>
              <option value="Parallel / grey import">
                Parallel / grey import
              </option>
              <option value="Unknown import status">
                Unknown import status
              </option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              Continue
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
