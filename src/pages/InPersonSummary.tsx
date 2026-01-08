import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

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
     Pricing guidance logic (rule-based, conservative)
  ========================================================== */

  const pricingInsight = useMemo(() => {
    if (!askingPrice) return null;

    const issueCount = imperfections.length;

    let stance: string;
    let guidance: string;
    let adjustment: string;

    if (issueCount === 0) {
      stance = "Appears fairly priced";
      guidance =
        "No notable issues were recorded during the inspection. Based on visible condition alone, the asking price appears reasonable.";
      adjustment = "Little to no adjustment expected based on condition.";
    } else if (issueCount <= 2) {
      stance = "Slightly negotiable";
      guidance =
        "A small number of minor issues were observed. These provide reasonable grounds for a modest price discussion.";
      adjustment =
        "A reduction in the range of $500–$1,500 may be reasonable, depending on severity.";
    } else {
      stance = "Price likely high for condition";
      guidance =
        "Multiple issues were identified during inspection. Together, these materially affect condition and strengthen your negotiation position.";
      adjustment =
        "A more meaningful adjustment (often $2,000–$4,000+) may be justified, depending on repair costs.";
    }

    return { stance, guidance, adjustment };
  }, [askingPrice, imperfections]);

  /* =========================================================
     Missing journey guard
  ========================================================== */

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

  /* =========================================================
     Actions
  ========================================================== */

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

  /* =========================================================
     UI
  ========================================================== */

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

      {/* PRICE GUIDANCE */}
      {pricingInsight && (
        <section className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 space-y-2">
          <h2 className="text-sm font-semibold text-emerald-200">
            Price & negotiation guidance
          </h2>

          <p className="text-sm text-slate-200 font-semibold">
            {pricingInsight.stance}
          </p>

          <p className="text-sm text-slate-300">
            {pricingInsight.guidance}
          </p>

          <p className="text-sm text-slate-300">
            <strong>Negotiation insight:</strong> {pricingInsight.adjustment}
          </p>

          <p className="text-[11px] text-slate-400">
            This guidance is based on visible condition only and does not replace
            a mechanical inspection or market valuation.
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

      {/* CHECKS */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 space-y-2">
        <h2 className="text-sm font-semibold text-slate-100">
          Condition-awareness checks
        </h2>

        {Object.keys(checks).length === 0 ? (
          <p className="text-sm text-slate-300">
            No condition-awareness responses were recorded.
          </p>
        ) : (
          <ul className="text-sm text-slate-300 space-y-1">
            {Object.entries(checks).map(([id, value]) => (
              <li key={id}>• {value as string}</li>
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
            Once saved, you can revisit or compare this inspection at any time.
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
