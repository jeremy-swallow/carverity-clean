// src/pages/StartScan.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress } from "../utils/scanProgress";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function StartScan() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = url.trim();
    if (!trimmed || !trimmed.startsWith("http")) {
      alert("Please enter a valid listing URL.");
      return;
    }

    // Persist URL for the entire online scan flow
    localStorage.setItem(LISTING_URL_KEY, trimmed);

    // Persist scan progress
    saveProgress({
      type: "online",
      step: "/online/analyzing-listing",
      listingUrl: trimmed,
      startedAt: new Date().toISOString(),
    });

    // Continue to analyzing screen
    navigate("/online/analyzing-listing", { replace: true });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-4">Paste the listing URL</h1>
      <p className="text-sm text-slate-400 mb-6">
        CarVerity will scan the listing and help you review it
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/car-listing"
        />

        <button
          type="submit"
          className="w-full rounded-md bg-blue-500 text-slate-950 py-2 font-medium"
        >
          Scan listing
        </button>
      </form>
    </div>
  );
}
