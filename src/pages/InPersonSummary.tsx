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
  const [showWhy, setShowWhy] = useState(false);

  const pricingInsight = useMemo(() => {
    if (!askingPrice) {
      return {
        verdict: "missing" as PricingVerdict,
        confidence: "Price context not added yet",
        advice:
          "Add the asking price to see how the condition you observed lines up with the price.",
        buyerRiskReason: undefined as string | undefined,
        buyerContext: undefined as string | undefined,
        hasHighSignal: false,
        total: 0,
      };
    }

    const total = imperfections.length;

    const hasHighSignal = imperfections.some((i: any) =>
      `${i?.type ?? ""} ${i?.note ?? ""}`
        .toLowerCase()
        .match(/rust|crack|leak|warning|accident|misaligned|corrosion/)
    );

    let verdict: PricingVerdict = "info";
    if (hasHighSignal) verdict = "concern";
    else if (total > 0) verdict = "room";

    const confidenceMap: Record<PricingVerdict, string> = {
      missing: "Price context not added yet",
      info: "What you observed broadly supports the asking price",
      room: "Your inspection suggests there may be room to negotiate",
      concern: "Some inspection findings weaken the asking price",
    };

    const adviceMap: Record<PricingVerdict, string> = {
      missing: "",
      info:
        "Based on what you noted during the inspection, the condition appears broadly consistent with the asking price.",
      room:
        "Based on what you observed, the condition may support a reasonable negotiation — even if the price initially seems firm.",
      concern:
        "Several things you noted go beyond normal wear, which makes the asking price difficult to justify without meaningful movement.",
    };

    const buyerRiskReason =
      verdict === "concern"
        ? "One or more inspection findings go beyond normal wear and materially weaken the justification for the asking price."
        : undefined;

    const buyerContext =
      verdict === "room"
        ? "Inspection notes suggest the vehicle condition may support a reasonable negotiation."
        : verdict === "concern"
        ? "Condition issues noted meaningfully weaken the asking price justification and may affect overall suitability if unaddressed."
        : undefined;

    return {
      verdict,
      confidence: confidenceMap[verdict],
      advice: adviceMap[verdict],
      buyerRiskReason,
      buyerContext,
      hasHighSignal,
      total,
    };
  }, [askingPrice, imperfections]);

  function saveToLibrary() {
    const id = activeScanId ?? generateScanId();

    const historyEvents =
      pricingInsight.verdict === "room" || pricingInsight.verdict === "concern"
        ? [
            ...(pricingInsight.buyerContext
              ? [
                  {
                    at: new Date().toISOString(),
                    event: `Buyer context recorded: ${pricingInsight.buyerContext}`,
                  },
                ]
              : []),
            ...(pricingInsight.verdict === "concern"
              ? [
                  {
                    at: new Date().toISOString(),
                    event: "Buyer leverage increased due to inspection findings",
                  },
                ]
              : []),
          ]
        : undefined;

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
      history: historyEvents,
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
          What your inspection suggests
        </h2>

        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-400/40">
          {pricingInsight.confidence}
        </span>

        <p className="text-sm text-slate-300">{pricingInsight.advice}</p>

        {pricingInsight.buyerRiskReason && (
          <p className="text-sm text-red-300 font-semibold">
            ⚠ Why this matters: {pricingInsight.buyerRiskReason}
          </p>
        )}

        {pricingInsight.buyerContext && (
          <p className="text-sm text-slate-200">
            <span className="font-semibold">Context:</span>{" "}
            {pricingInsight.buyerContext}
          </p>
        )}

        <button
          onClick={() => setShowWhy((v) => !v)}
          className="text-xs text-slate-400 underline pt-1"
        >
          {showWhy ? "Hide explanation" : "Why we reached this guidance"}
        </button>
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
