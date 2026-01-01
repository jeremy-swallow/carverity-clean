// src/pages/OnlineVehicleDetails.tsx
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

const DEFAULT_IMPORT_STATUS = "Sold new in Australia (default)";
const LEGACY_LISTING_URL_KEY = "carverity_online_listing_url";

function isPlausibleYear(value: string) {
  const year = Number(value);
  if (!year || isNaN(year)) return false;

  const current = new Date().getFullYear();
  const earliest = 1970;
  const maxAllowed = current + 2; // allow near-future models

  return year >= earliest && year <= maxAllowed;
}

export default function OnlineVehicleDetails() {
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<VehicleState>({
    make: "",
    model: "",
    year: "",
    variant: "",
    importStatus: DEFAULT_IMPORT_STATUS,
  });

  const [estimatedFromListing, setEstimatedFromListing] = useState(false);

  // ===========================
  // LOAD EXISTING OR EXTRACTED DATA
  // ===========================
  useEffect(() => {
    const progress = (loadProgress() as any) ?? {};
    const existing = progress.vehicle ?? {};

    const listingUrl =
      progress?.listingUrl ??
      window.localStorage.getItem(LEGACY_LISTING_URL_KEY) ??
      "";

    // If vehicle already exists → hydrate + stop here
    if (Object.keys(existing).length > 0) {
      setVehicle({
        make: existing.make ?? "",
        model: existing.model ?? "",
        year: existing.year ?? "",
        variant: existing.variant ?? "",
        importStatus: existing.importStatus ?? DEFAULT_IMPORT_STATUS,
      });

      setEstimatedFromListing(false);
      return;
    }

    // If no listing URL → user will manually enter details
    if (!listingUrl) {
      console.log("No listing URL — manual entry mode");
      return;
    }

    // Fetch extracted vehicle fields again if available
    (async () => {
      try {
        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: listingUrl }),
        });

        const data = await res.json();

        if (!data?.vehicle) {
          console.log("No extracted vehicle fields — manual mode");
          return;
        }

        const extracted = data.vehicle;

        const safeYear = isPlausibleYear(extracted.year)
          ? extracted.year
          : "";

        const merged: VehicleState = {
          make: extracted.make ?? "",
          model: extracted.model ?? "",
          year: safeYear,
          variant: extracted.variant ?? "",
          importStatus:
            extracted.importStatus ?? DEFAULT_IMPORT_STATUS,
        };

        setVehicle(merged);
        setEstimatedFromListing(true);

        saveProgress({
          ...progress,
          type: "online",
          step: "/online/vehicle-details",
          listingUrl,
          vehicle: merged,
        });
      } catch (err) {
        console.error("Vehicle extraction failed:", err);
      }
    })();
  }, []);

  // ===========================
  // FIELD UPDATE HANDLER
  // ===========================
  function updateField<K extends keyof VehicleState>(
    field: K,
    value: VehicleState[K]
  ) {
    setVehicle((prev) => {
      const next = { ...prev, [field]: value };

      const progress = loadProgress() ?? {};
      saveProgress({
        ...progress,
        type: "online",
        step: "/online/vehicle-details",
        vehicle: next,
      });

      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const progress = loadProgress() ?? {};
    saveProgress({
      ...progress,
      type: "online",
      step: "/online/vehicle-details",
      vehicle,
    });

    navigate("/online/photos");
  }

  // ===========================
  // UI
  // ===========================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-2">
          Review the vehicle details
        </h1>

        {estimatedFromListing && (
          <div className="mb-4 text-sm text-amber-300 bg-amber-900/20 border border-amber-700 rounded px-3 py-2">
            ✨ Estimated from the listing — please review and correct anything
            that looks wrong before continuing.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Make</label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.make}
              onChange={(e) => updateField("make", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Model</label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.model}
              onChange={(e) => updateField("model", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Year</label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.year}
              onChange={(e) => updateField("year", e.target.value)}
              placeholder="e.g. 2016"
            />
            {!isPlausibleYear(vehicle.year) && vehicle.year && (
              <p className="text-xs text-rose-400 mt-1">
                This year looks unusual — please confirm it is correct.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm mb-1">Variant (optional)</label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.variant}
              onChange={(e) => updateField("variant", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Import status</label>
            <select
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.importStatus}
              onChange={(e) =>
                updateField("importStatus", e.target.value)
              }
            >
              <option value={DEFAULT_IMPORT_STATUS}>
                Sold new in Australia (default)
              </option>
              <option value="Parallel / grey import">
                Parallel / grey import
              </option>
              <option value="Unknown import status">
                Unknown import status
              </option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              Continue
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
