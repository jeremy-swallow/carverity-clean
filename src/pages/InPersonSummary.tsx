// src/pages/InPersonSummary.tsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

type PricingVerdict = "missing" | "info" | "room" | "concern";

function formatAUD(n: number) {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n).toLocaleString("en-AU")}`;
  }
}

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

  const askingPriceRaw = progress?.askingPrice;
  const askingPrice =
    typeof askingPriceRaw === "number" && Number.isFinite(askingPriceRaw)
      ? askingPriceRaw
      : null;

  const vehicle = {
    year: progress?.vehicleYear ?? "",
    make: progress?.vehicleMake ?? "",
    model: progress?.vehicleModel ?? "",
    variant: progress?.vehicleVariant ?? "",
    // Keep existing key, but gracefully fall back to the one used in VehicleDetails
    kms: progress?.vehicleKms ?? progress?.kilometres ?? "",
  };

  const [savedId, setSavedId] = useState<string | null>(null);

  const journeyMissing =
    !progress || (!imperfections.length && !Object.keys(checks).length);

  const pricingInsight = useMemo(() => {
    if (!askingPrice) {
      return {
        verdict: "missing" as PricingVerdict,
        headline: "Add the asking price to unlock price guidance",
        subline:
          "If you’re unsure, you can add it later — even an approximate number helps.",
        bullets: [
          "We’ll use your recorded observations to guide negotiation strategy.",
          "This does not claim a market valuation — it’s condition-aware guidance.",
        ],
        script: [],
      };
    }

    const total = imperfections.length;

    const containsKeywords = (s: string, words: string[]) => {
      const t = String(s || "").toLowerCase();
      return words.some((w) => t.includes(w));
    };

    const highSignalCount = imperfections.filter((i: any) =>
      containsKeywords(`${i?.type ?? ""} ${i?.note ?? ""}`, [
        "rust",
        "corrosion",
        "crack",
        "windscreen",
        "hail",
        "misaligned",
        "panel gap",
        "leak",
        "warning light",
        "overheat",
        "smoke",
        "accident",
        "repair",
      ])
    ).length;

    const cosmeticCount = imperfections.filter((i: any) =>
      containsKeywords(`${i?.type ?? ""} ${i?.note ?? ""}`, [
        "scratch",
        "scuff",
        "scrape",
        "dent",
        "paint",
        "kerb",
        "curb",
        "wheel",
        "interior wear",
        "wear",
        "tear",
        "chip",
      ])
    ).length;

    // Conservative, non-market-based categorisation:
    // - “room” for negotiation: any recorded observations give reasonable leverage
    // - “concern” when higher-signal items exist (still not a diagnosis)
    let verdict: PricingVerdict = "info";
    if (highSignalCount > 0) verdict = "concern";
    else if (total > 0) verdict = "room";
    else verdict = "info";

    const headlineByVerdict: Record<PricingVerdict, string> = {
      missing: "",
      info: "Price guidance (condition-aware)",
      room: "Price guidance: reasonable — with negotiation room",
      concern: "Price guidance: proceed carefully — negotiate hard",
    };

    const sublineByVerdict: Record<PricingVerdict, string> = {
      missing: "",
      info:
        "Based on your inspection notes only. Dealers may already factor visible wear into the price.",
      room:
        "Based on your inspection notes only. The dealer may have priced some defects in — but you still have fair negotiation leverage.",
      concern:
        "Based on your inspection notes only. One or more items you recorded may justify a stronger negotiation stance (or walking away if the seller won’t address it).",
    };

    const bullets: string[] = [];
    if (total === 0) {
      bullets.push("You recorded no notable observations in this visit.");
      bullets.push(
        "If the vehicle drives well and paperwork checks out, the asking price may be broadly justified."
      );
      bullets.push(
        "If you want leverage, focus on service history, tyres, brakes, and any upcoming maintenance."
      );
    } else {
      bullets.push(
        `You recorded ${total} observation${total === 1 ? "" : "s"}${
          cosmeticCount ? ` (${cosmeticCount} cosmetic)` : ""
        }${highSignalCount ? ` (${highSignalCount} higher-signal)` : ""}.`
      );
      bullets.push(
        "Use your photos/notes as evidence — keep it calm and specific."
      );
      bullets.push(
        "Ask whether the dealer will repair items before delivery, or reduce price to cover your repair cost."
      );
    }

    const script: string[] = [];
    if (total > 0) {
      script.push(
        `“I like the car, but based on the inspection I’ve noted ${total} item${
          total === 1 ? "" : "s"
        }. Are you able to address these before delivery or adjust the price?”`
      );
      script.push(
        "“If we can’t get them repaired, I’d need a reduction to cover the cost and hassle.”"
      );
    } else {
      script.push(
        "“The car presents well. If we can tighten the deal slightly, I’m ready to move forward today.”"
      );
    }

    if (highSignalCount > 0) {
      script.push(
        "“Given what I’ve observed, I’m not comfortable at this price unless we resolve those items in writing.”"
      );
    }

    return {
      verdict,
      headline: headlineByVerdict[verdict],
      subline: sublineByVerdict[verdict],
      bullets,
      script,
    };
  }, [askingPrice, imperfections]);

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
        askingPrice: askingPrice ?? undefined,
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
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Inspection summary
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Inspection summary
      </h1>

      {/* VEHICLE IDENTITY */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-1">
        <p className="text-base font-semibold text-slate-100">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.variant ? ` — ${vehicle.variant}` : ""}
        </p>

        <p className="text-sm text-slate-400">
          Odometer: {vehicle.kms || "—"} km
        </p>
      </section>

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

      {/* FOLLOW UPS */}
      {followUps.length > 0 && (
        <section className="rounded-2xl border border-indigo-400/30 bg-indigo-600/10 px-5 py-4 space-y-2">
          <h2 className="text-sm font-semibold text-indigo-200">
            Areas reviewed in person
          </h2>

          <ul className="text-sm text-slate-300 space-y-1">
            {followUps.map((f: any) => (
              <li key={f.id}>• {f.label}</li>
            ))}
          </ul>
        </section>
      )}

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

      {/* PRICING & NEGOTIATION (B — below checks, above save actions) */}
      <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-emerald-200">
              Pricing & negotiation guidance
            </h2>
            <p className="text-xs text-slate-400">
              Condition-aware guidance only — not a market valuation.
            </p>
          </div>

          {askingPrice !== null && (
            <div className="text-right">
              <p className="text-[11px] text-slate-400">Asking price</p>
              <p className="text-sm font-semibold text-slate-100">
                {formatAUD(askingPrice)}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 space-y-2">
          <p className="text-sm font-semibold text-slate-100">
            {pricingInsight.headline}
          </p>
          <p className="text-sm text-slate-300">{pricingInsight.subline}</p>

          <ul className="text-sm text-slate-300 list-disc list-inside space-y-1 pt-1">
            {pricingInsight.bullets.map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>

          {pricingInsight.verdict === "missing" ? (
            <div className="pt-2">
              <button
                onClick={() => navigate("/scan/in-person/asking-price")}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2"
              >
                Add asking price
              </button>
            </div>
          ) : (
            <>
              {pricingInsight.script.length > 0 && (
                <div className="pt-2 space-y-1">
                  <p className="text-xs font-semibold text-slate-200">
                    Suggested negotiation script
                  </p>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {pricingInsight.script.map((s, idx) => (
                      <li key={idx} className="rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2">
                        {s}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Tip: ask the seller to confirm repairs/adjustments in writing (invoice/“due bill”).
                  </p>
                </div>
              )}
            </>
          )}
        </div>
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
