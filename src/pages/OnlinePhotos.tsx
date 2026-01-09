// src/pages/OnlinePhotos.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const MAX_ONLINE_PHOTOS = 8;

export default function OnlinePhotos() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SavedResult | null>(null);

  // Load stored scan once on mount
  useEffect(() => {
    const stored = loadOnlineResults();

    if (!stored) {
      console.warn("⚠️ No scan state in photos step — returning to start");
      navigate("/start-scan", { replace: true });
      return;
    }

    setResult(stored);
  }, [navigate]);

  if (!result) return null;

  async function handleContinue() {
    // Extra runtime + TS guard
    if (!result) {
      navigate("/start-scan", { replace: true });
      return;
    }

    const updated: SavedResult = {
      ...result,
      // Ensure required fields exist to satisfy SavedResult typing
      createdAt: result.createdAt ?? new Date().toISOString(),
      id: result.id ?? crypto.randomUUID(),

      type: "online",
      step: "results",
      photos: result.photos ?? {
        listing: [],
        meta: [],
      },
    };

    saveOnlineResults(updated);
    navigate("/scan/online/results", { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-white">
      <h1 className="text-2xl font-semibold mb-2">
        Listing photos (optional context)
      </h1>

      <p className="text-slate-400 mb-4">
        From listing:{" "}
        <a
          href={result.listingUrl ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          {result.listingUrl || "No URL available"}
        </a>
      </p>

      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 mb-6 space-y-2">
        <p className="text-sm text-slate-300">
          CarVerity automatically extracts up to{" "}
          <strong>{MAX_ONLINE_PHOTOS}</strong> relevant photos from the listing.
        </p>

        <p className="text-xs text-slate-400">
          Online scans focus on listing context and missing details — not physical
          inspection. You’ll have a chance to capture detailed photos during an
          in-person scan.
        </p>
      </div>

      <p className="text-slate-400 mb-6">
        No photos extracted yet — continue to proceed.
      </p>

      <button
        onClick={handleContinue}
        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
      >
        Continue
      </button>
    </div>
  );
}
