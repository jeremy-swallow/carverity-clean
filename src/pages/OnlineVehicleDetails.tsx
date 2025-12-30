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

  // 🔎 Load + hydrate from saved progress
  useEffect(() => {
    const progress = loadProgress();
    console.log("🔎 Loaded scan progress:", progress);

    const extracted = progress?.vehicle ?? {};

    const next = {
      ...vehicle,
      ...extracted,
    };

    console.log("✨ Hydrated vehicle:", next);

    setVehicle(next);
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setVehicle(prev => {
      const updated = { ...prev, [name]: value };

      saveProgress({
        vehicle: updated
      });

      return updated;
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
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-2">
        Tell us a bit about the car
      </h1>

      <p className="text-muted-foreground mb-8">
        ✨ Estimated from the listing — please review before continuing
      </p>

      <div className="space-y-5">

        <input
          name="make"
          value={vehicle.make}
          onChange={handleChange}
          placeholder="Make"
          className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded"
        />

        <input
          name="model"
          value={vehicle.model}
          onChange={handleChange}
          placeholder="Model"
          className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded"
        />

        <input
          name="year"
          value={vehicle.year}
          onChange={handleChange}
          placeholder="Year"
          className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded"
        />

        <input
          name="variant"
          value={vehicle.variant}
          onChange={handleChange}
          placeholder="Variant (optional)"
          className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded"
        />

        <button
          onClick={handleContinue}
          className="mt-4 px-4 py-2 rounded bg-green-600 hover:bg-green-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
