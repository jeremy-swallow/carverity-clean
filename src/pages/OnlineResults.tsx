import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  loadOnlineResults,
  unlockOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

import {
  calculatePhotoTransparency,
  type PhotoTransparencyResult,
} from "../utils/photoTransparency";

type SellerBadgeInfo = {
  label: string;
  desc: string;
  className: string;
};

export default function OnlineResults() {
  const navigate = useNavigate();

  const [result, setResult] = useState<SavedResult | null>(null);
  const [photoScore, setPhotoScore] =
    useState<PhotoTransparencyResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) return;

    setResult(stored);
    setPhotoScore(calculatePhotoTransparency(stored.photos ?? []));
  }, []);

  // No result available
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
    if (updated) setResult(updated);
  }

  function startInPersonScan() {
    // Extra safety guard for TypeScript
    if (!result) return;

    navigate("/scan/in-person/start", {
      state: {
        fromOnlineScan: true,
        listingUrl: result.listingUrl ?? "",
        vehicle: result.vehicle ?? {},
      },
    });
  }

  // ----- Seller badge -----
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

  const sellerBadge =
    sellerBadgeMap[sellerType] ?? sellerBadgeMap["unknown"];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">
        Scan results — AI analysis
      </h1>

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

      {/* Photo transparency score */}
      {photoScore && (
        <div className="mb-6 border border-white/10 rounded-lg p4 bg-black/20">
          <h3 className="font-semibold mb-1">
            Photo transparency score: {photoScore.score} / 100
          </h3>

          <p className="text-sm text-muted-foreground mb-2">
            {photoScore.summary}
          </p>

          <p className="text-xs text-muted-foreground mb-2">
            {photoScore.counts.total} photos analysed —{" "}
            {photoScore.counts.exterior} exterior ·{" "}
            {photoScore.counts.interior} interior ·{" "}
            {photoScore.counts.dash} dash ·{" "}
            {photoScore.counts.engine} engine
          </p>

          {photoScore.missing.length > 0 && (
            <ul className="text-xs text-amber-300 list-disc pl-4">
              {photoScore.missing.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Listing URL */}
      <p className="mb-6 break-all text-sm text-muted-foreground">
        Listing analysed:
        <br />
        {result.listingUrl}
      </p>

      {/* Unlock gate */}
      {locked && (
        <div className="border border-white/10 rounded-xl p-6 bg-black/30">
          <p className="mb-4 text-sm text-muted-foreground">
            This is a preview report. Unlock to see the full AI guidance.
          </p>

          <button
            onClick={handleUnlock}
            className="px-5 py-3 rounded-xl bg-blue-400 font-semibold text-black"
          >
            Unlock full report
          </button>
        </div>
      )}

      {!locked && (
        <div className="mt-6 space-y-6">
          <h2 className="text-xl font-semibold">Analysis details</h2>

          {(!result.sections || result.sections.length === 0) && (
            <p className="text-muted-foreground">
              No detailed analysis sections returned.
            </p>
          )}

          {result.sections?.map((s, i) => (
            <div key={i} className="border border-white/10 rounded-xl p-4">
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {s.content}
              </p>
            </div>
          ))}

          {/* CTA — Continue later to in-person scan */}
          <div className="mt-8 border border-white/10 rounded-xl p-4 bg-black/20">
            <h3 className="font-semibold mb-1">
              Ready to inspect this car in person?
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Bring this scan with you and continue the inspection on-site.
            </p>

            <button
              onClick={startInPersonScan}
              className="px-5 py-3 rounded-xl bg-emerald-300 text-black font-semibold"
            >
              Continue with in-person inspection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
