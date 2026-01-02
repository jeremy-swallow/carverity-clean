// src/pages/OnlineVehicleDetails.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineVehicleDetails() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SavedResult | null>(null);

  // Local editable fields
  const [kilometres, setKilometres] = useState<string | number>("");
  const [variant, setVariant] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [owners, setOwners] = useState("");

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) {
      navigate("/scan/online", { replace: true });
      return;
    }

    const v = stored.vehicle ?? {};

    setResult(stored);
    setKilometres(v.kilometres ?? stored.kilometres ?? "");
    setVariant(v.variant ?? "");
    setImportStatus(v.importStatus ?? "");
    setOwners(v.owners ?? "");
  }, [navigate]);

  if (!result) return null;

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!result) return;

    const updated: SavedResult = {
      ...result,
      vehicle: {
        ...(result.vehicle ?? {}),
        variant: variant || undefined,
        kilometres: kilometres === "" ? null : kilometres,
        importStatus: importStatus || undefined,
        owners: owners || undefined,
      },
      // keep root kilometres in sync for legacy reads
      kilometres: kilometres === "" ? null : kilometres,
    };

    saveOnlineResults(updated);
    setResult(updated);

    navigate("/scan/online/photos");
  }

  const v = result.vehicle ?? {};
  const makeModel = [v.year, v.make, v.model].filter(Boolean).join(" ");

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold mb-2">Confirm vehicle details</h1>
      <p className="text-muted-foreground text-sm">
        We’ve pulled basic details from the listing. Confirm or refine anything
        that looks off — this helps keep your report accurate.
      </p>

      <section className="border border-white/10 rounded-lg p-4 bg-slate-900/40 text-sm space-y-1">
        <p className="font-medium">{makeModel || "Vehicle from listing"}</p>
        <p>
          Listing URL:{" "}
          {result.listingUrl ? (
            <a
              href={result.listingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 underline"
            >
              {result.listingUrl}
            </a>
          ) : (
            "—"
          )}
        </p>
      </section>

      <form onSubmit={handleContinue} className="space-y-5 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-xs font-medium">
              Variant / trim (optional)
            </label>
            <input
              type="text"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium">
              Kilometres (approx.)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={kilometres}
              onChange={(e) => setKilometres(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              If the odometer looks wrong in the listing, correct it here.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-xs font-medium">
              Import status (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Australian delivered, grey import, ex-Japan"
              value={importStatus}
              onChange={(e) => setImportStatus(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium">
              Known number of previous owners (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 1 owner, ex-fleet"
              value={owners}
              onChange={(e) => setOwners(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/scan/online")}
            className="inline-flex items-center rounded-md border border-white/15 px-4 py-2 text-xs font-medium hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-indigo-500 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-400"
          >
            Continue to photos
          </button>
        </div>
      </form>
    </div>
  );
}
