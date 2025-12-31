import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

export default function OnlineVehicleDetails() {
  const navigate = useNavigate();
  const progress = loadProgress();

  const [vehicle, setVehicle] = useState({
    make: "",
    model: "",
    year: "",
    variant: "",
    importStatus: "Sold new in Australia (default)",
  });

  // Prefill fields from extracted scan data
  useEffect(() => {
    const extracted = progress?.vehicle;
    if (!extracted) return;

    setVehicle(v => ({
      ...v,
      make: extracted.make || v.make,
      model: extracted.model || v.model,
      year: extracted.year || v.year,
      variant: extracted.variant || v.variant,
    }));
  }, []);

  function updateField(key: string, value: string) {
    setVehicle(v => {
      const updated = { ...v, [key]: value };

      saveProgress({
        vehicle: updated,
      });

      return updated;
    });
  }

  function handleContinue() {
    saveProgress({
      step: "/online/photos",
      vehicle,
    });

    navigate("/online/photos");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold mb-2">
        Tell us a bit about the car
      </h1>
      <p className="text-muted-foreground mb-6">
        ✨ Estimated from the listing — please review before continuing
      </p>

      <input
        placeholder="Make"
        value={vehicle.make}
        onChange={e => updateField("make", e.target.value)}
        className="w-full mb-3"
      />

      <input
        placeholder="Model"
        value={vehicle.model}
        onChange={e => updateField("model", e.target.value)}
        className="w-full mb-3"
      />

      <input
        placeholder="Year"
        value={vehicle.year}
        onChange={e => updateField("year", e.target.value)}
        className="w-full mb-3"
      />

      <input
        placeholder="Variant (optional)"
        value={vehicle.variant}
        onChange={e => updateField("variant", e.target.value)}
        className="w-full mb-6"
      />

      <button onClick={handleContinue} className="btn btn-primary">
        Continue
      </button>
    </div>
  );
}
