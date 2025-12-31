import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type VehicleState = {
  make: string;
  model: string;
  year: string;
  variant: string;
  importStatus: string;
};

export default function OnlineVehicleDetails() {
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<VehicleState>({
    make: "",
    model: "",
    year: "",
    variant: "",
    importStatus: "Sold new in Australia (default)",
  });

  // Load existing scan progress + hydrate values
  useEffect(() => {
    const progress = loadProgress();
    const extracted: any = progress?.vehicle ?? {};

    console.log("Loaded scan progress:", progress);
    console.log("Hydrated vehicle:", extracted);

    if (!extracted) return;

    setVehicle(v => ({
      ...v,
      make: extracted.make ?? v.make,
      model: extracted.model ?? v.model,
      year: extracted.year ?? v.year,
      variant: extracted.variant ?? v.variant,
      // tolerant assignment (no TS error even if missing)
      importStatus: extracted?.importStatus ?? v.importStatus,
    }));
  }, []);

  function updateField(key: keyof VehicleState, value: string) {
    setVehicle(v => {
      const next = { ...v, [key]: value };
      saveProgress({ vehicle: next });
      return next;
    });
  }

  function handleContinue() {
    saveProgress({
      vehicle,
      step: "/online/photos",
    });

    navigate("/online/photos");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-xl font-semibold mb-2">
        Tell us a bit about the car
      </h1>

      <p className="text-muted-foreground mb-6">
        ✨ Estimated from the listing — please review before continuing
      </p>

      <div className="space-y-4">

        <input
          className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2"
          placeholder="Make"
          value={vehicle.make}
          onChange={e => updateField("make", e.target.value)}
        />

        <input
          className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2"
          placeholder="Model"
          value={vehicle.model}
          onChange={e => updateField("model", e.target.value)}
        />

        <input
          className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2"
          placeholder="Year"
          value={vehicle.year}
          onChange={e => updateField("year", e.target.value)}
        />

        <input
          className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2"
          placeholder="Variant (optional)"
          value={vehicle.variant}
          onChange={e => updateField("variant", e.target.value)}
        />

        <select
          className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2"
          value={vehicle.importStatus}
          onChange={e => updateField("importStatus", e.target.value)}
        >
          <option>Sold new in Australia (default)</option>
          <option>Australian delivered (used import)</option>
          <option>Grey / parallel import</option>
          <option>Unknown import status</option>
        </select>
      </div>

      <button
        onClick={handleContinue}
        className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-black font-medium px-4 py-2 rounded"
      >
        Continue
      </button>
    </div>
  );
}
