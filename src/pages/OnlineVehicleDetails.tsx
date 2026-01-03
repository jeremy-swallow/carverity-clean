// src/pages/OnlineVehicleDetails.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  normaliseVehicle,
  type SavedResult,
  type VehicleInfo,
} from "../utils/onlineResults";

export default function OnlineVehicleDetails() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SavedResult | null>(null);
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) {
      navigate("/scan/online", { replace: true });
      return;
    }

    const v = normaliseVehicle(stored.vehicle);
    setResult(stored);
    setVehicle(v);
  }, [navigate]);

  if (!result || !vehicle) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Vehicle details</h1>
        <p className="text-sm text-slate-400">Loading vehicle information…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold">Vehicle details</h1>

      <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
          <div>
            <div className="text-xs text-slate-400">Make</div>
            <div>{vehicle.make || "—"}</div>

            <div className="mt-3 text-xs text-slate-400">Model</div>
            <div>{vehicle.model || "—"}</div>

            <div className="mt-3 text-xs text-slate-400">Year</div>
            <div>{vehicle.year || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-slate-400">Variant</div>
            <div>{vehicle.variant || "—"}</div>

            <div className="mt-3 text-xs text-slate-400">Kilometres</div>
            <div>{vehicle.kilometres ?? "—"}</div>

            {vehicle.importStatus && (
              <>
                <div className="mt-3 text-xs text-slate-400">
                  Import status
                </div>
                <div>{vehicle.importStatus}</div>
              </>
            )}
          </div>
        </div>
      </section>

      {result.listingUrl && (
        <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 text-sm">
          <div className="text-xs text-slate-400 mb-1">Listing URL</div>
          <a
            href={result.listingUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all text-indigo-300 hover:text-indigo-200 text-xs"
          >
            {result.listingUrl}
          </a>
        </section>
      )}
    </div>
  );
}
