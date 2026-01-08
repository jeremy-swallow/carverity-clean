// src/pages/InPersonSummary.tsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

type PricingVerdict = "missing" | "fair" | "room" | "concern";

function formatAUD(n: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function InPersonSummary() {
  const navigate = useNavigate();
  const { scanId: routeScanId } = useParams<{ scanId?: string }>();

  const progress: any = loadProgress();
  const activeScanId = progress?.scanId || routeScanId || null;

  const imperfections = progress?.imperfections ?? [];
  const followUps = progress?.followUpPhotos ?? [];
  const checks = progress?.checks ?? {};
  const photos = progress?.photos ?? [];
  const fromOnlineScan = Boolean(progress?.fromOnlineScan);

  const askingPrice =
    typeof progress?.askingPrice === "number"
      ? progress.askingPrice
      : null;

  const vehicle = {
    year: progress?.vehicleYear ?? "",
    make: progress?.vehicleMake ?? "",
    model: progress?.vehicleModel ?? "",
    variant: progress?.vehicleVariant ?? "",
    kms: progress?.kilometres ?? "",
  };

  const [savedId, setSavedId] = useState<string | null>(null);

  const journeyMissing =
    !progress ||
    (!imperfections.length && !Object.keys(checks).length);

  /* =========================================================
     Pricing Insight (condition-aware, not market valuation)
  ========================================================= */

  const pricingInsight = useMemo(() => {
    if (!askingPrice) {
      return {
        verdict: "missing" as PricingVerdict,
        headline: "Add the asking price to assess fairness",
        confidenceLine: "Price confidence unavailable",
        explanation:
          "An asking price helps us assess whether the condition aligns with what’s being asked.",
        bullets: [],
        script: [],
      };
    }

    const totalIssues = imperfections.length;

    const highSignal = imperfections.filter((i: any) =>
      `${i.type} ${i.note}`.toLowerCase().match(
        /rust|corrosion|crack|leak|accident|warning|overheat|smoke|repair/
      )
    ).length;

    let verdict: PricingVerdict = "fair";
    if (highSignal > 0) verdict = "concern";
    else if (totalIssues > 0) verdict = "room";

    const confidenceLineByVerdict: Record<PricingVerdict, string> = {
      missing: "",
      fair: "Asking price appears broadly fair for observed condition",
      room: "Asking price likely includes some wear — negotiation is reasonable",
      concern: "Asking price does not reflect observed condition",
    };

    const explanationByVerdict: Record<PricingVerdict, string> = {
      missing: "",
      fair:
        "Based on what you recorded, the vehicle condition broadly aligns with the asking price.",
      room:
        "Some issues may already be priced in, but you still have reasonable leverage.",
      concern:
        "One or more issues materially affect value and justify a strong negotiation stance.",
    };

    const bullets: string[] = [];

    if (totalIssues === 0) {
      bullets.push(
        "No notable defects recorded during the inspection."
      );
      bullets.push(
        "If service history and paperwork check out, the price is likely justified."
      );
    } else {
      bullets.push(
        `You recorded ${totalIssues} issue${totalIssues > 1 ? "s" : ""}.`
      );
      bullets.push(
        "Use your inspection notes and photos as evidence."
      );
      bullets.push(
        "Ask whether repairs can be completed before delivery or reflected in price."
      );
    }

    const script: string[] = [];

    if (totalIssues > 0) {
      script.push(
        `“I like the car, but based on my inspection I noted ${totalIssues} issue${
          totalIssues > 1 ? "s" : ""
        }. Are you able to address these before delivery or adjust the price?”`
      );
      script.push(
        "“If the items can’t be resolved, I’d need a price reduction to cover them.”"
      );
    } else {
      script.push(
        "“The car presents well. If we can tighten the deal slightly, I’m ready to proceed today.”"
      );
    }

    if (highSignal > 0) {
      script.push(
        "“Given what I’ve observed, I’m not comfortable proceeding at this price unless these items are resolved.”"
      );
    }

    return {
      verdict,
      headline: "Pricing & negotiation guidance",
      confidenceLine: confidenceLineByVerdict[verdict],
      explanation: explanationByVerdict[verdict],
      bullets,
      script,
    };
  }, [askingPrice, imperfections]);

  /* =========================================================
     Guards
  ========================================================= */

  if (journeyMissing && !savedId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <h1 className="text-xl font-semibold text-white">
          Inspection summary unavailable
        </h1>
        <p className="text-sm text-slate-300">
          The inspection data for this session could not be found.
        </p>
        <button
          onClick={() => navigate("/scan/in-person/photos")}
          className="w-full rounded-xl bg-emerald-500 text-black font-semibold px-4 py-3"
        >
          Restart inspection
        </button>
        <button
          onClick={() => navigate("/start-scan")}
          className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-2"
        >
          Return to start
        </button>
      </div>
    );
  }

  /* =========================================================
     Actions
  ========================================================= */

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

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold text-white">
        Inspection summary
      </h1>

      <section className="rounded-2xl bg-slate-900/70 border border-white/10 px-5 py-4">
        <p className="text-lg font-semibold text-white">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        <p className="text-sm text-slate-400">
          Odometer: {vehicle.kms || "—"} km
        </p>
      </section>

      <section className="rounded-2xl bg-amber-500/10 border border-amber-400/30 px-5 py-4">
        <h2 className="text-sm font-semibold text-amber-200">
          Inspection observations
        </h2>
        {imperfections.length === 0 ? (
          <p className="text-sm text-slate-300">
            No notable issues recorded.
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

      {/* PRICING */}
      <section className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 px-5 py-4 space-y-2">
        <div className="flex justify-between">
          <h2 className="text-sm font-semibold text-emerald-200">
            Pricing insight
          </h2>
          {askingPrice !== null && (
            <span className="text-sm font-semibold text-white">
              {formatAUD(askingPrice)}
            </span>
          )}
        </div>

        <p className="text-sm font-semibold text-white">
          {pricingInsight.confidenceLine}
        </p>
        <p className="text-sm text-slate-300">
          {pricingInsight.explanation}
        </p>

        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
          {pricingInsight.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>

        {pricingInsight.script.length > 0 && (
          <div className="pt-2 space-y-2">
            <p className="text-xs font-semibold text-slate-200">
              Suggested negotiation language
            </p>
            {pricingInsight.script.map((s, i) => (
              <div
                key={i}
                className="rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 text-sm text-slate-200"
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </section>

      {!savedId ? (
        <button
          onClick={saveToLibrary}
          className="w-full rounded-xl bg-emerald-500 text-black font-semibold px-4 py-3"
        >
          Save inspection to My Scans
        </button>
      ) : (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 px-4 py-3 text-emerald-200">
          Inspection saved successfully.
        </div>
      )}
    </div>
  );
}
