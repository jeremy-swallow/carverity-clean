import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadOnlineResults, saveOnlineResults } from "../utils/onlineResults";

export default function OnlineVehicleDetails() {
  const navigate = useNavigate();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [variant, setVariant] = useState("");
  const [importStatus, setImportStatus] = useState("Sold new in Australia (default)");

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) {
      navigate("/start-scan", { replace: true });
      return;
    }

    // 🔹 Autofill from scan result if values exist
    setMake(stored.vehicle?.make ?? "");
    setModel(stored.vehicle?.model ?? "");
    setYear(stored.vehicle?.year ?? "");
    setVariant(stored.vehicle?.variant ?? "");
    setImportStatus(stored.vehicle?.importStatus ?? "Sold new in Australia (default)");
  }, []);

  function handleContinue() {
    const stored = loadOnlineResults();
    if (!stored) return;

    const updated = {
      ...stored,
      vehicle: {
        ...stored.vehicle,
        make,
        model,
        year,
        variant,
        importStatus,
      },
      step: "/online/photos"
    };

    saveOnlineResults(updated);

    navigate("/online/photos", { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-2">
        Tell us a bit about the car
      </h1>
      <p className="text-sm mb-6">
        ✨ Estimated from the listing — please review before continuing
      </p>

      <div className="space-y-4">

        <input className="w-full bg-slate-800 p-3 rounded"
          placeholder="Make"
          value={make}
          onChange={e => setMake(e.target.value)}
        />

        <input className="w-full bg-slate-800 p-3 rounded"
          placeholder="Model"
          value={model}
          onChange={e => setModel(e.target.value)}
        />

        <input className="w-full bg-slate-800 p-3 rounded"
          placeholder="Year"
          value={year}
          onChange={e => setYear(e.target.value)}
        />

        <input className="w-full bg-slate-800 p-3 rounded"
          placeholder="Variant (optional)"
          value={variant}
          onChange={e => setVariant(e.target.value)}
        />

        <select className="w-full bg-slate-800 p-3 rounded"
          value={importStatus}
          onChange={e => setImportStatus(e.target.value)}
        >
          <option>Sold new in Australia (default)</option>
          <option>Grey import</option>
          <option>Private import</option>
          <option>Unknown</option>
        </select>

      </div>

      <button
        onClick={handleContinue}
        className="mt-6 bg-emerald-500 px-5 py-2 rounded font-medium"
      >
        Continue
      </button>
    </div>
  );
}
