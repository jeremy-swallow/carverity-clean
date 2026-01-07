// src/pages/OnlinePhotos.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

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

  // Until we know what to show, render nothing
  if (!result) return null;

  async function handleContinue() {
    // Extra runtime + TS guard
    if (!result) {
      navigate("/start-scan", { replace: true });
      return;
    }

    const updated: SavedResult = {
      ...result,
      type: "online",
      step: "results",
      photos: result.photos ?? {
        listing: [],
        meta: [],
      },
    };

    saveOnlineResults(updated);

    // Correct route for the online results screen
    navigate("/scan/online/results", { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Select listing photos</h1>

      <p className="text-muted-foreground mb-4">
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

      <div className="bg-slate-800/40 border border-white/10 rounded-xl p-4 mb-8">
        🚗 We’ll automatically pull up to 8 relevant photos from the listing.
        You’ll be able to confirm or replace these later.
      </div>

      <p className="text-muted-foreground mb-6">
        No photos extracted yet — continue to proceed.
      </p>

      <button
        onClick={handleContinue}
        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
      >
        Continue
      </button>
    </div>
  );
}
