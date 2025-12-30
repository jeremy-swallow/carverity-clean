import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScanProgress } from "../utils/scanProgress";

export default function OnlineVehicleDetails() {
  const navigate = useNavigate();
  const { progress, update } = useScanProgress();

  const [vehicle, setVehicle] = useState({
    make: "",
    model: "",
    year: "",
    variant: "",
    importStatus: "Sold new in Australia (default)",
  });

  // 🔹 Apply extracted values when page loads
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
  }, [progress]);

  function updateField(key: string, value: string) {
    setVehicle(v => ({ ...v, [key]: value }));
    update("vehicle", { ...vehicle, [key]: value });
  }

  function next() {
    update("vehicle", vehicle);
    navigate("/online/photos");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">
        Tell us a bit about the car
      </h1>

      <p className="text-sm text-emerald-400 mb-6">
        ✨ Estimated from the listing — please review before continuing
      </p>

      {/* MAKE */}
      <label className="block text-sm mb-1">Make *</label>
      <input
        className="input"
        value={vehicle.make}
        onChange={e => updateField("make", e.target.value)}
        placeholder="e.g. Toyota, Mazda"
      />

      {/* MODEL */}
      <label className="block text-sm mt-4 mb-1">Model *</label>
      <input
        className="input"
        value={vehicle.model}
        onChange={e => updateField("model", e.target.value)}
        placeholder="e.g. CX-30, CX-5"
      />

      {/* YEAR */}
      <label className="block text-sm mt-4 mb-1">Year *</label>
      <input
        className="input"
        value={vehicle.year}
        onChange={e => updateField("year", e.target.value)}
        placeholder="e.g. 2021"
      />

      {/* VARIANT */}
      <label className="block text-sm mt-4 mb-1">
        Variant (optional)
      </label>
      <input
        className="input"
        value={vehicle.variant}
        onChange={e => updateField("variant", e.target.value)}
        placeholder="e.g. G20 Touring, Hybrid"
      />

      <button
        className="btn-primary mt-6"
        onClick={next}
      >
        Continue
      </button>
    </div>
  );
}
