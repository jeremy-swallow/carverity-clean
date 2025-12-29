import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  unlockOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";
import { useNavigate } from "react-router-dom";

type SellerBadgeInfo = {
  label: string;
  desc: string;
  className: string;
};

export default function OnlineResults() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    const raw = loadOnlineResults();

    if (!raw || typeof raw !== "object") {
      setResult(null);
      return;
    }

    const stored: SavedResult = {
      createdAt: raw.createdAt ?? "",
      source: raw.source ?? "unknown",
      sellerType: raw.sellerType ?? "unknown",
      listingUrl: raw.listingUrl ?? "",
      vehicle: raw.vehicle ?? {},
      kilometres: raw.kilometres,
      owners: raw.owners,
      photos: raw.photos,
      signals: Array.isArray(raw.signals) ? raw.signals : [],
      sections: Array.isArray(raw.sections) ? raw.sections : [],
      analysisSource: raw.analysisSource,
      summary: raw.summary ?? "",
      isUnlocked: raw.isUnlocked ?? false,
    };

    setResult(stored);
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">No results available</h1>
        <p className="text-muted-foreground">
          Run a scan first to see your analysis results.
        </p>
      </div>
    );
  }

  const locked = !result.isUnlocked;

  function handleUnlock() {
    unlockOnlineResults();
    const updated = loadOnlineResults();
    setResult(updated);
  }

  function startInPersonScan() {
    navigate("/scan/in-person/start", {
      state: {
        fromOnlineScan: true,
        listingUrl: result?.listingUrl ?? "",
        vehicle: result?.vehicle ?? {},
      },
    });
  }

  // 🎯 Guaranteed seller badge (never undefined)
  const sellerType = result.sellerType ?? "unknown";

  const sellerBadgeMap: Record<string, SellerBadgeInfo> = {
    dealer: {
      label: "Dealer Sale",
      desc: "Dealer listings generally include consumer protections and statutory warranties.",
      className: "bg-emerald-300 text-black",
    },
    private: {
      label: "Private Seller",
      desc: "Private sales may offer better negotiation leverage but fewer protections.",
      className: "bg-amber-300 text-black",
    },
    unknown: {
      label: "Seller Type Unknown",
      desc: "The listing did not include enough information to determine the seller type.",
      className: "bg-slate-400 text-black",
    },
  };

  const sellerBadge: SellerBadgeInfo =
    sellerBadgeMap[sellerType] ?? sellerBadgeMap.unknown;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">Scan results — AI analysis</h1>

      {/* Seller badge */}
      <div className="mb-4">
        <span
          className={`px-3 py-1 rounded-lg text-sm font-semibold ${sellerBadge.className}`}
        >
          {sellerBadge.label}
        </span>
        <p className="text-xs mt-1 text-muted-foreground">
          {sellerBadge.desc}
        </p>
      </div>

      {/* Listing URL */}
      <p className="mb-6 break-all text-sm text-muted-foreground">
        Listing analysed:
        <br />
        {result.listingUrl}
      </p>

      {/* Vehicle info */}
      {result.vehicle && (
        <div className="mb-6 text-sm text-muted-foreground">
          <strong>Vehicle:</strong>{" "}
          {[
            result.vehicle?.year,
            result.vehicle?.make,
            result.vehicle?.model,
            result.vehicle?.variant,
          ]
            .filter(Boolean)
            .join(" ")}
        </div>
      )}

      {/* Signals */}
      <div className="mb-8">
        <h2 className="font-semibold mb-2">Key signals</h2>

        {result.signals.length > 0 ? (
          <ul className={`list-disc pl-4 ${locked ? "blur-sm" : ""}`}>
            {result.signals.map((s, i) => (
              <li key={i}>{s?.text ?? "Unnamed signal"}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No signals detected in this listing.
          </p>
        )}
      </div>

      {/* Sections */}
      <div className={locked ? "blur-sm pointer-events-none" : ""}>
        <h2 className="font-semibold mb-2">Analysis details</h2>

        {result.sections.length > 0 ? (
          result.sections.map((section, i) => (
            <div
              key={i}
              className="border border-white/10 rounded p-4 mb-4"
            >
              <h3 className="font-medium mb-1">
                {section?.title ?? "Untitled section"}
              </h3>
              <p className="text-muted-foreground">
                {section?.content ?? ""}
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">
            No analysis sections returned.
          </p>
        )}
      </div>

      {/* Unlock banner */}
      {locked && (
        <div className="mt-6 p-4 border border-white/20 rounded-lg bg-black/30">
          <p className="mb-3 text-sm text-muted-foreground">
            You’re viewing a preview. Unlock the full report without using
            another credit.
          </p>

          <button
            onClick={handleUnlock}
            className="px-4 py-2 rounded bg-blue-500 text-black font-semibold"
          >
            Unlock full report
          </button>
        </div>
      )}

      {/* Continue to in-person CTA */}
      <div className="mt-10 border border-white/10 rounded-lg p-4 bg-black/20">
        <h3 className="font-semibold mb-1">Next step</h3>
        <p className="text-sm text-muted-foreground mb-3">
          If you decide to inspect this vehicle in person, you can continue the
          process and build a deeper condition report.
        </p>

        <button
          onClick={startInPersonScan}
          className="px-4 py-2 rounded bg-emerald-400 text-black font-semibold"
        >
          Continue with in-person inspection
        </button>
      </div>
    </div>
  );
}
