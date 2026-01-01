import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
} from "../utils/onlineResults";
import type { SavedResult } from "../utils/onlineResults";

export default function OnlinePhotos() {
  const navigate = useNavigate();
  const stored = loadOnlineResults(); // SavedResult | null

  // Redirect if there is no stored scan
  useEffect(() => {
    if (!stored) {
      console.warn("⚠️ No scan state in photos step — returning to start");
      navigate("/start-scan", { replace: true });
    }
  }, [navigate, stored]);

  // TS + runtime guard
  if (!stored) return null;

  async function handleContinue() {
    console.log("📸 Photos step complete — continuing to results…");

    if (!stored) {
      navigate("/start-scan", { replace: true });
      return;
    }

    const updated: SavedResult = {
      ...stored,
      type: "online",        // ensure literal type stays correct
      step: "/online/results",
      photos: stored.photos ?? {
        listing: [],
        meta: [],
      },
    };

    saveOnlineResults(updated);
    navigate("/online/results", { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Select listing photos</h1>

      <p className="text-muted-foreground mb-4">
        From listing:{" "}
        <a
          href={stored.listingUrl ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          {stored.listingUrl}
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
