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
  // 🔄 HYDRATE FROM SAVED PROGRESS (MERGED FROM API)
  //
  useEffect(() => {
    const progress = loadProgress() as any;

    if (!progress || progress.type !== "online") {
      console.warn("⚠️ No scan progress — sending back to start");
      navigate("/online/start", { replace: true });
      return;
    }

    const v = progress?.vehicle ?? {};

    setVehicle({
      make: v.make ?? "",
      model: v.model ?? "",
      year: v.year ?? "",
      variant: v.variant ?? "",
      importStatus:
        v.importStatus ?? "Sold new in Australia (default)",
    });
  }, [navigate]);

  //
  // 💾 SAVE & CONTINUE
  //
  function handleContinue() {
    saveProgress({
      ...loadProgress(),
      step: "/online/conditions",
      vehicle,
    });

    navigate("/online/conditions");
  }

  function updateField(field: keyof VehicleState, value: string) {
    setVehicle(v => ({ ...v, [field]: value }));
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">
        Tell us a bit about the car
      </h1>

      <p className="text-sm text-muted-foreground mb-6">
        ✨ Estimated from the listing — please review before continuing
      </p>

      <div className="space-y-3">
        <input
          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2"
          placeholder="Make"
          value={vehicle.make}
          onChange={e => updateField("make", e.target.value)}
        />

        <input
          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2"
          placeholder="Model"
          value={vehicle.model}
          onChange={e => updateField("model", e.target.value)}
        />

        <input
          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2"
          placeholder="Year"
          value={vehicle.year}
          onChange={e => updateField("year", e.target.value)}
        />

        <input
          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2"
          placeholder="Variant (optional)"
          value={vehicle.variant}
          onChange={e => updateField("variant", e.target.value)}
        />

        <select
          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2"
          value={vehicle.importStatus}
          onChange={e => updateField("importStatus", e.target.value)}
        >
          <option>Sold new in Australia (default)</option>
          <option>Imported — Compliance plated in Australia</option>
          <option>Imported — Personal / Parallel import</option>
          <option>Unknown import status</option>
        </select>
      </div>

      <button
        className="mt-6 bg-emerald-600 text-white rounded px-4 py-2"
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
}
