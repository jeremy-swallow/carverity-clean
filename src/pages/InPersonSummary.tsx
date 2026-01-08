// src/pages/InPersonSummary.tsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

type PricingVerdict = "missing" | "info" | "room" | "concern";

export default function InPersonSummary() {
  const navigate = useNavigate();
  const { scanId: routeScanId } = useParams<{ scanId?: string }>();

  const progress: any = loadProgress();
  const activeScanId: string | null = progress?.scanId || routeScanId || null;

  const imperfections = progress?.imperfections ?? [];
  const followUps = progress?.followUpPhotos ?? [];
  const checks = progress?.checks ?? {};
  const photos = progress?.photos ?? [];
  const fromOnlineScan = Boolean(progress?.fromOnlineScan);

  const askingPrice =
    typeof progress?.askingPrice === "number" &&
    Number.isFinite(progress.askingPrice)
      ? progress.askingPrice
      : null;

  const vehicle = {
    year: progress?.vehicleYear ?? "",
    make: progress?.vehicleMake ?? "",
    model: progress?.vehicleModel ?? "",
    variant: progress?.vehicleVariant ?? "",
    kms: progress?.vehicleKms ?? progress?.kilometres ?? "",
  };

  const [savedId, setSavedId] = useState<string | null>(null);

  const pricingInsight = useMemo(() => {
    if (!askingPrice) {
      return {
        verdict: "missing" as PricingVerdict,
        confidence: "Price confidence unavailable",
        advice:
          "Add the asking price to unlock condition-aware pricing guidance.",
      };
    }

    const total = imperfections.length;

    let verdict: PricingVerdict = "info";

    const hasHighSignal = imperfections.some((i: any) =>
      `${i?.type ?? ""} ${i?.note ?? ""}`
        .toLowerCase()
        .match(/rust|crack|leak|warning|accident|misaligned|corrosion/)
    );

    if (hasHighSignal) verdict = "concern";
    else if (total > 0) verdict = "room";

    const confidenceMap: Record<PricingVerdict, string> = {
      missing: "Price confidence unavailable",
      info: "Price appears reasonable for condition",
      room: "Some negotiation room is likely",
      concern: "Low price confidence — negotiate firmly",
    };

    const adviceMap: Record<PricingVerdict, string> = {
      missing: "",
      info:
        "Based on your inspection notes, the asking price broadly aligns with observed condition.",
      room:
        "The dealer may have priced in some wear, but your notes support a reasonable negotiation.",
      concern:
        "One or more inspection findings significantly weaken price justification.",
    };

    return {
      verdict,
      confidence: confidenceMap[verdict],
      advice: adviceMap[verdict],
    };
  }, [askingPrice, imperfections]);

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
        askingPrice,
        pricingInsight,
        imperfections,
        followUps,
        checks,
        photos,
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
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan — Inspection summary
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Inspection summary
      </h1>

      {/* VEHICLE */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4">
        <p className="font-semibold text-slate-100">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.variant ? ` — ${vehicle.variant}` : ""}
        </p>
        <p className="text-sm text-slate-400">
          Odometer: {vehicle.kms || "—"} km
        </p>
      </section>

      {/* OBSERVATIONS */}
      <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4">
        <h2 className="text-sm font-semibold text-amber-200">
          Inspection observations
        </h2>
        {imperfections.length === 0 ? (
          <p className="text-sm text-slate-300 mt-1">
            No notable observations recorded.
          </p>
        ) : (
          <ul className="text-sm text-slate-300 space-y-1 mt-2">
            {imperfections.map((i: any) => (
              <li key={i.id}>
                • {i.area}: {i.type}
                {i.note ? ` — ${i.note}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* PRICING CONFIDENCE */}
      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 space-y-2">
        <h2 className="text-sm font-semibold text-emerald-200">
          Pricing confidence
        </h2>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold
              ${
                pricingInsight.confidence.includes("reasonable")
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                  : pricingInsight.confidence.includes("negotiation")
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                  : pricingInsight.confidence.includes("Low")
                  ? "bg-red-500/20 text-red-300 border border-red-400/40"
                  : "bg-slate-500/20 text-slate-300 border border-slate-400/30"
              }
            `}
          >
            {pricingInsight.confidence}
          </span>
        </div>

        <p className="text-sm text-slate-300">
          {pricingInsight.advice}
        </p>

        <p className="text-[11px] text-slate-400">
          Condition-aware guidance only — not a market valuation.
        </p>
      </section>

      {/* SAVE */}
      {!savedId ? (
        <button
          onClick={saveToLibrary}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
        >
          Save inspection to My Scans
        </button>
      ) : (
        <>
          <button
            onClick={viewMyScans}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-3"
          >
            View in My Scans
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
