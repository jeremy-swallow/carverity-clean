/* src/pages/OnlineVehicleDetails.tsx */

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";
import { AU_MAKES_MODELS } from "../data/auMakesModels";

type ImportStatus =
  | "au-new"
  | "au-delivered-import-brand"
  | "grey-import"
  | "unknown";

interface VehicleFormState {
  make: string;
  model: string;
  year: string;
  variant: string;
  importStatus: ImportStatus;
}

export default function OnlineVehicleDetails() {
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<VehicleFormState>({
    make: "",
    model: "",
    year: "",
    variant: "",
    importStatus: "unknown",
  });

  const [estimatedFromListing, setEstimatedFromListing] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);

  const [showMakeList, setShowMakeList] = useState(false);
  const [showModelList, setShowModelList] = useState(false);

  const allMakes = useMemo(() => Object.keys(AU_MAKES_MODELS), []);

  const filteredMakes = useMemo(() => {
    const q = vehicle.make.toLowerCase();
    if (!q) return allMakes;
    return allMakes.filter((m) => m.toLowerCase().includes(q));
  }, [vehicle.make, allMakes]);

  const filteredModels = useMemo(() => {
    const models = AU_MAKES_MODELS[vehicle.make] ?? [];
    const q = vehicle.model.toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.toLowerCase().includes(q));
  }, [vehicle.make, vehicle.model]);

  const canContinue =
    vehicle.make.trim() !== "" &&
    vehicle.model.trim() !== "" &&
    vehicle.year.trim() !== "";

  useEffect(() => {
    saveProgress({
      type: "online",
      step: "/scan/online/vehicle-details",
      startedAt: new Date().toISOString(),
    });

    const raw = loadProgress();
    const v = (raw as any)?.vehicle ?? {};

    // Load any existing values first
    setVehicle({
      make: v.make ?? "",
      model: v.model ?? "",
      year: v.year ?? "",
      variant: v.variant ?? "",
      importStatus: v.importStatus ?? "unknown",
    });

    const listingUrl = localStorage.getItem("carverity_listing_url");

    // Only prefill if URL exists AND form is empty
    if (listingUrl && !v.make && !v.model && !v.year) {
      prefillFromListing(listingUrl);
    }
  }, []);

  async function prefillFromListing(url: string) {
    try {
      setIsPrefilling(true);

      const res = await fetch("/api/extract-vehicle-from-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!data?.vehicle) return;

      setVehicle((v) => ({
        ...v,
        make: data.vehicle.make || v.make,
        model: data.vehicle.model || v.model,
        year: data.vehicle.year || v.year,
        variant: data.vehicle.variant || v.variant,
      }));

      setEstimatedFromListing(true);
    } catch (err) {
      console.warn("⚠️ Prefill failed — continuing manually", err);
    } finally {
      setIsPrefilling(false);
    }
  }

  function update<K extends keyof VehicleFormState>(
    key: K,
    value: VehicleFormState[K]
  ) {
    setEstimatedFromListing(false);
    setVehicle((v) => ({ ...v, [key]: value }));
  }

  function handleContinue() {
    if (!canContinue) return;

    const raw = (loadProgress() ?? {}) as any;

    saveProgress({
      ...raw,
      vehicle: {
        ...(raw.vehicle ?? {}),
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        year: vehicle.year.trim(),
        variant: vehicle.variant.trim(),
        importStatus: vehicle.importStatus,
      },
      vehicleEstimated: estimatedFromListing,
    });

    navigate("/scan/online/details");
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs tracking-wider uppercase text-slate-400">
          Online scan · Step 2 of 5
        </span>

        <h1 className="text-2xl font-extrabold text-white">
          Tell us a bit about the car
        </h1>

        {estimatedFromListing && (
          <p className="text-emerald-300 text-sm">
            ✨ Estimated from the listing — please review before continuing
          </p>
        )}

        {isPrefilling && (
          <p className="text-slate-400 text-sm">
            Fetching details from the listing…
          </p>
        )}

        {!estimatedFromListing && !isPrefilling && (
          <p className="text-slate-300 text-sm">
            Start typing — you can pick from suggestions or enter details manually.
          </p>
        )}
      </div>

      {/* MAKE */}
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-sm font-medium">
          Make<span className="text-red-400"> *</span>
        </label>

        <input
          value={vehicle.make}
          placeholder="Start typing (e.g. Toyota, Mercedes-Benz)"
          onChange={(e) => {
            update("make", e.target.value);
            setShowMakeList(true);
          }}
          onFocus={() => setShowMakeList(true)}
          onBlur={() => setTimeout(() => setShowMakeList(false), 120)}
          className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
        />

        {showMakeList && filteredMakes.length > 0 && (
          <div className="absolute top-full mt-1 w-full border border-white/10 rounded-xl bg-slate-900/95 max-h-56 overflow-auto shadow-lg z-50">
            {filteredMakes.map((m) => (
              <button
                key={m}
                type="button"
                onMouseDown={() => {
                  update("make", m);
                  update("model", "");
                  setShowMakeList(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-800/70"
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODEL */}
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-sm font-medium">
          Model<span className="text-red-400"> *</span>
        </label>

        <input
          value={vehicle.model}
          placeholder="e.g. RAV4, CX-5, i30"
          onChange={(e) => {
            update("model", e.target.value);
            setShowModelList(true);
          }}
          onFocus={() => setShowModelList(true)}
          onBlur={() => setTimeout(() => setShowModelList(false), 120)}
          className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
        />

        {showModelList && filteredModels.length > 0 && (
          <div className="absolute top-full mt-1 w-full border border-white/10 rounded-xl bg-slate-900/95 max-h-56 overflow-auto shadow-lg z-50">
            {filteredModels.map((m) => (
              <button
                key={m}
                type="button"
                onMouseDown={() => {
                  update("model", m);
                  setShowModelList(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-800/70"
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* YEAR */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Year<span className="text-red-400"> *</span>
        </label>

        <input
          value={vehicle.year}
          placeholder="e.g. 2020"
          onChange={(e) => update("year", e.target.value)}
          className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
        />
      </div>

      {/* VARIANT */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Variant (optional)</label>

        <input
          value={vehicle.variant}
          placeholder="e.g. GXL, SR Premium, Hybrid"
          onChange={(e) => update("variant", e.target.value)}
          className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
        />
      </div>

      {/* IMPORT STATUS */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Import status (optional)</label>

        <select
          value={vehicle.importStatus}
          onChange={(e) =>
            update("importStatus", e.target.value as ImportStatus)
          }
          className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10"
        >
          <option value="unknown">Sold new in Australia (default)</option>
          <option value="au-delivered-import-brand">
            Parallel import via manufacturer
          </option>
          <option value="grey-import">Grey import</option>
          <option value="au-new">Australian delivered — confirmed</option>
        </select>
      </div>

      <div className="mt-2">
        <button
          disabled={!canContinue}
          onClick={handleContinue}
          className={`px-5 py-3 rounded-xl font-semibold ${
            canContinue
              ? "bg-blue-400 text-black"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
