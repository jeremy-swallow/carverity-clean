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

  // =========================================================
  // HYDRATE FROM SAVED PROGRESS (AND CALL EXTRACTOR IF NEEDED)
  // =========================================================
  useEffect(() => {
    const progress = (loadProgress() as any) ?? {};
    console.log("Loaded progress >>>", progress);

    const existingVehicle = (progress.vehicle ?? {}) as Partial<VehicleState>;
    console.log("Hydrating with >>>", existingVehicle);

    // 1) If we already have vehicle details in progress → just hydrate
    if (Object.keys(existingVehicle).length > 0) {
      setVehicle((v) => ({
        ...v,
        ...existingVehicle,
        importStatus:
          existingVehicle.importStatus ?? v.importStatus,
      }));
      return;
    }

    // 2) If we *don't* have vehicle details but we DO have the listing URL,
    //    call the extractor *from this page* and then save to localStorage.
    const listingUrl = progress.listingUrl as string | undefined;
    if (!listingUrl) {
      // No URL, nothing we can auto-fill – user will type manually.
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: listingUrl }),
        });

        const data = await res.json();
        console.log("ANALYSIS RESULT >>>", data);

        const extracted =
          (data.extracted ?? data.vehicle ?? {}) as Partial<VehicleState>;

        // Hydrate UI
        setVehicle((v) => ({
          ...v,
          ...extracted,
          importStatus:
            extracted.importStatus ?? v.importStatus,
        }));

        // Persist into browser scan progress (merge-safe)
        const latest = (loadProgress() as any) ?? progress;
        saveProgress({
          ...latest,
          type: "online",
          step: "/online/vehicle",
          listingUrl,
          vehicle: {
            ...(latest.vehicle ?? {}),
            ...extracted,
          },
          startedAt: latest.startedAt ?? new Date().toISOString(),
        });
      } catch (err) {
        console.error(
          "❌ analyze-listing from vehicle page failed:",
          err
        );
      }
    })();
  }, []);

  // =========================================================
  // FIELD UPDATES (MERGE INTO PROGRESS)
  // =========================================================
  function updateField<K extends keyof VehicleState>(
    field: K,
    value: VehicleState[K]
  ) {
    setVehicle((prev) => {
      const next = { ...prev, [field]: value };

      const progress = (loadProgress() as any) ?? {};
      saveProgress({
        ...progress,
        type: "online",
        step: "/online/vehicle",
        vehicle: next,
      });

      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const progress = (loadProgress() as any) ?? {};
    saveProgress({
      ...progress,
      type: "online",
      step: "/online/vehicle",
      vehicle,
    });

    // Move to the next step in your online flow
    navigate("/online/owners");
  }

  // =========================================================
  // UI
  // =========================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-2">
          Tell us a bit about the car
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          ✨ Estimated from the listing — please review before continuing
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Make</label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.make}
              onChange={(e) => updateField("make", e.target.value)}
              placeholder="e.g. Mitsubishi"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Model</label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.model}
              onChange={(e) => updateField("model", e.target.value)}
              placeholder="e.g. Lancer"
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
          </div>

          <div>
            <label className="block text-sm mb-1">
              Variant <span className="text-slate-500">(optional)</span>
            </label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.variant}
              onChange={(e) => updateField("variant", e.target.value)}
              placeholder="e.g. ES Sport"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Import status (estimated)
            </label>
            <select
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
              value={vehicle.importStatus}
              onChange={(e) => updateField("importStatus", e.target.value)}
            >
              <option value="Sold new in Australia (default)">
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
