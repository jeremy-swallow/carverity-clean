/* =========================================================
   OnlineVehicleDetails — Hydrates from saved scan progress
   (vehicle values extracted from API or user-edited)
   ========================================================= */

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

  //
  // 🟢 HYDRATE FROM SAVED PROGRESS (MERGED FROM API)
  //
  useEffect(() => {
    const saved = loadProgress();

    // Nothing saved yet — do nothing
    if (!saved) return;

    const v = saved.vehicle ?? {};

    setVehicle({
      make: v.make ?? "",
      model: v.model ?? "",
      year: v.year ?? "",
      variant: v.variant ?? "",
      importStatus:
        v.importStatus ?? "Sold new in Australia (default)",
    });
  }, []);

  //
  // ✏️ Update field + persist without overwriting other keys
  //
  function updateField<K extends keyof VehicleState>(
    key: K,
    value: VehicleState[K]
  ) {
    const updated = { ...vehicle, [key]: value };
    setVehicle(updated);

    saveProgress({
      vehicle: updated,
      step: "/online/vehicle",
      type: "online",
    });
  }

  //
  // ➡️ Continue to next page
  //
  function handleContinue() {
    saveProgress({
      vehicle,
      step: "/online/next",
      type: "online",
    });

    navigate("/online/next");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold mb-2">
        Tell us a bit about the car
      </h1>

      <p className="text-sm text-muted-foreground mb-6">
        ✨ Estimated from the listing — please review before continuing
      </p>

      <div className="space-y-4">
        <input
          className="w-full bg-slate-800 px-3 py-2 rounded"
          placeholder="Make"
          value={vehicle.make}
          onChange={(e) => updateField("make", e.target.value)}
        />

        <input
          className="w-full bg-slate-800 px-3 py-2 rounded"
          placeholder="Model"
          value={vehicle.model}
          onChange={(e) => updateField("model", e.target.value)}
        />

        <input
          className="w-full bg-slate-800 px-3 py-2 rounded"
          placeholder="Year"
          value={vehicle.year}
          onChange={(e) => updateField("year", e.target.value)}
        />

        <input
          className="w-full bg-slate-800 px-3 py-2 rounded"
          placeholder="Variant (optional)"
          value={vehicle.variant}
          onChange={(e) => updateField("variant", e.target.value)}
        />

        <select
          className="w-full bg-slate-800 px-3 py-2 rounded"
          value={vehicle.importStatus}
          onChange={(e) =>
            updateField("importStatus", e.target.value)
          }
        >
          <option>Sold new in Australia (default)</option>
          <option>Imported — requires additional checks</option>
          <option>Unknown import status</option>
        </select>
      </div>

      <button
        className="mt-6 bg-emerald-600 px-4 py-2 rounded text-white"
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
}
