import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

export default function OnlineVehicleDetails() {
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState({
    make: "",
    model: "",
    year: "",
    variant: "",
    importStatus: "Sold new in Australia (default)",
  });

  // Load saved progress on mount
  useEffect(() => {
    const progress = loadProgress();
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setVehicle(v => {
      const next = { ...v, [name]: value };

      // Persist to storage
      saveProgress({
        vehicle: {
          ...next,
        },
      });

      return next;
    });
  }

  function handleContinue() {
    saveProgress({
      step: "photos",
      vehicle,
    });

    navigate("/online/photos");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-2">Tell us a bit about the car</h1>
      <p className="text-muted-foreground mb-8">
        ✨ Estimated from the listing — please review before continuing
      </p>

      <div className="space-y-6">
        <input
          name="make"
          value={vehicle.make}
          onChange={handleChange}
          placeholder="Make"
          className="input"
        />

        <input
          name="model"
          value={vehicle.model}
          onChange={handleChange}
          placeholder="Model"
          className="input"
        />

        <input
          name="year"
          value={vehicle.year}
          onChange={handleChange}
          placeholder="Year"
          className="input"
        />

        <input
          name="variant"
          value={vehicle.variant}
          onChange={handleChange}
          placeholder="Variant (optional)"
          className="input"
        />

        <button onClick={handleContinue} className="btn-primary">
          Continue
        </button>
      </div>
    </div>
  );
}
