import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

type PriceInsight = {
  label: string;
  advice: string;
};

export default function InPersonSummary() {
  const navigate = useNavigate();
  const { scanId: routeScanId } = useParams<{ scanId?: string }>();

  const progress: any = loadProgress();

  const activeScanId: string | null =
    progress?.scanId || routeScanId || null;

  const imperfections = progress?.imperfections ?? [];
  const followUps = progress?.followUpPhotos ?? [];
  const checks = progress?.checks ?? {};
  const photos = progress?.photos ?? [];
  const fromOnlineScan = Boolean(progress?.fromOnlineScan);
  const askingPrice: number | undefined = progress?.askingPrice;

  const vehicle = {
    year: progress?.vehicleYear ?? "",
    make: progress?.vehicleMake ?? "",
    model: progress?.vehicleModel ?? "",
    variant: progress?.vehicleVariant ?? "",
    kms: progress?.vehicleKms ?? "",
  };

  const [savedId, setSavedId] = useState<string | null>(null);

  const journeyMissing =
    !progress || (!imperfections.length && !Object.keys(checks).length);

  /* =========================================================
     Pricing insight (rule-based, defensible)
  ========================================================== */

  const pricingInsight: PriceInsight | null = useMemo(() => {
    if (!askingPrice) {
      return {
        label: "Price not assessed",
        advice:
          "No asking price was entered, so a pricing assessment couldn’t be made.",
      };
    }

    if (imperfections.length === 0) {
      return {
        label: "Likely fairly priced",
        advice:
          "No notable condition issues were recorded. The asking price appears broadly reasonable for the visible condition.",
      };
    }

    if (imperfections.length <= 2) {
      return {
        label: "Fair, minor negotiation possible",
        advice:
          "Some minor imperfections were noted. The dealer may have factored these in, but there is reasonable scope to ask for a modest adjustment.",
      };
    }

    return {
      label: "High for observed condition",
      advice:
        "Multiple imperfections were recorded. Even if some were priced in, this provides a strong basis for negotiation or reconsidering the deal.",
    };
  }, [askingPrice, imperfections.length]);

  if (journeyMissing && !savedId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          Inspection summary unavailable
        </h1>

        <p className="text-sm text-slate-300">
          The in-person inspection data for this session could not be found.
        </p>

        <button
          onClick={() => navigate("/scan/in-person/photos")}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
        >
          Restart in-person inspection
        </button>

        <button
          onClick={() => navigate("/start-scan")}
          className="w-full mt-2 rounded-xl border border-white/25 text-slate-200 px-4 py-2"
        >
          Return to start
        </button>
      </div>
    );
  }

  function saveToLibrary() {
    const id = activeScanId ?? generateScanId();

    saveScan({
      id,
      type: "in-person",
      title: fromOnlineScan
        ? "In-person follow-up inspection"
        : "In-person inspection — stand-alone",
      createdAt: new Date().toISOString(),
      data: {
        vehicle,
        imperfections,
        followUps,
        checks,
        photos,
        askingPrice,
        pricingInsight,
      },
    } as any);

    clearProgress();
    setSavedId(id);
  }

  function viewMyScans() {
    navigate("/my-scans");
  }

  function startNewScan() {
    clearProgress();
    navigate("/start-scan");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Inspection summary
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Inspection summary
      </h1>

      {/* VEHICLE */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-1">
        <p className="text-base font-semibold text-slate-100">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.variant ? ` — ${vehicle.variant}` : ""}
        </p>

        <p className="text-sm text-slate-400">
          Odometer: {vehicle.kms || "—"} km
        </p>
      </section>

      {/* PRICE INSIGHT */}
      {pricingInsight && (
        <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 space-y-1">
          <h2 className="text-sm font-semibold text-emerald-200">
            Price assessment
          </h2>
          <p className="text-sm text-slate-200 font-semibold">
            {pricingInsight.label}
          </p>
          <p className="text-sm text-slate-300">
            {pricingInsight.advice}
          </p>
        </section>
      )}

      {/* OBSERVATIONS */}
      <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 space-y-2">
        <h2 className="text-sm font-semibold text-amber-200">
          Inspection observations
        </h2>

        {imperfections.length === 0 ? (
          <p className="text-sm text-slate-300">
            No notable observations were recorded during this visit.
          </p>
        ) : (
          <ul className="text-sm text-slate-300 space-y-1">
            {imperfections.map((i: any) => (
              <li key={i.id}>
                • {i.area}: {i.type}
                {i.note ? ` — ${i.note}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* SAVE ACTIONS */}
      {!savedId ? (
        <>
          <button
            onClick={saveToLibrary}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
          >
            Save inspection to My Scans
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            Pricing guidance is based only on visible condition, not full market data.
          </p>
        </>
      ) : (
        <>
          <section className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
            Inspection saved successfully.
          </section>

          <button
            onClick={viewMyScans}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-3 shadow"
          >
            View this inspection in My Scans
          </button>

          <button
            onClick={startNewScan}
            className="w-full mt-2 rounded-xl border border-white/25 text-slate-200 px-4 py-2"
          >
            Start a new scan
          </button>
        </>
      )}
    </div>
  );
}
