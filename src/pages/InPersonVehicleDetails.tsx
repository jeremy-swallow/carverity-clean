import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadOnlineResults } from "../utils/onlineResults";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

export default function InPersonVehicleDetails() {
  const navigate = useNavigate();

  const existing = loadProgress();
  const online = loadOnlineResults();

  const [scanId] = useState(() => {
    if (existing?.scanId) return existing.scanId;
    const id = generateScanId();
    saveProgress({
      type: "in-person",
      scanId: id,
      step: "/scan/in-person/vehicle",
      startedAt: new Date().toISOString(),
    });
    return id;
  });

  const [year, setYear] = useState<string>(
    String(existing?.vehicleYear ?? online?.vehicle?.year ?? "")
  );
  const [make, setMake] = useState<string>(
    String(existing?.vehicleMake ?? online?.vehicle?.make ?? "")
  );
  const [model, setModel] = useState<string>(
    String(existing?.vehicleModel ?? online?.vehicle?.model ?? "")
  );
  const [variant, setVariant] = useState<string>(
    String(existing?.vehicleVariant ?? "")
  );
  const [kms, setKms] = useState<string>(
    String(existing?.vehicleKms ?? "")
  );

  useEffect(() => {
    saveProgress({
      scanId,
      step: "/scan/in-person/vehicle",
      vehicleYear: year,
      vehicleMake: make,
      vehicleModel: model,
      vehicleVariant: variant || undefined,
      vehicleKms: kms,
    });
  }, [scanId, year, make, model, variant, kms]);

  function next() {
    if (!year || !make || !model || !kms) return;

    saveProgress({
      scanId,
      step: "/scan/in-person/photos",
    });

    navigate("/scan/in-person/photos");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Vehicle details
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Confirm the vehicle details
      </h1>

      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-3">
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Year"
          className="w-full rounded-lg bg-slate-800 border border-white/20 px-3 py-2 text-sm"
        />

        <input
          value={make}
          onChange={(e) => setMake(e.target.value)}
          placeholder="Make"
          className="w-full rounded-lg bg-slate-800 border border-white/20 px-3 py-2 text-sm"
        />

        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Model"
          className="w-full rounded-lg bg-slate-800 border border-white/20 px-3 py-2 text-sm"
        />

        <input
          value={variant}
          onChange={(e) => setVariant(e.target.value)}
          placeholder="Variant / trim (optional)"
          className="w-full rounded-lg bg-slate-800 border border-white/20 px-3 py-2 text-sm"
        />

        <input
          value={kms}
          onChange={(e) => setKms(e.target.value)}
          placeholder="Odometer (km)"
          className="w-full rounded-lg bg-slate-800 border border-white/20 px-3 py-2 text-sm"
        />
      </section>

      <button
        onClick={next}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
      >
        Continue — begin photo inspection
      </button>
    </div>
  );
}
