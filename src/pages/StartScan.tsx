import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function StartScan() {
  const navigate = useNavigate();
  const [listingUrl, setListingUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = listingUrl.trim();

    if (!trimmed) {
      console.warn("⚠️ No URL entered");
      return;
    }

    // Store in sessionStorage as a backup so the next page can always read it
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(LISTING_URL_KEY, trimmed);
      }
    } catch (err) {
      console.error("Failed to stash listing URL in sessionStorage:", err);
    }

    // Also pass it via React Router state
    navigate("/scan/online/analyzing", {
      state: { listingUrl: trimmed },
    });
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-4">
        Let’s start with the listing
      </h1>

      <p className="text-sm text-white/70 mb-6">
        Share the online listing you’re looking at and I’ll help you spot
        potential issues before you inspect the car in person.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-2">Paste listing link</label>
          <input
            className="w-full p-3 rounded bg-zinc-900 border border-white/10 text-sm"
            placeholder="https://www.carsales.com.au/..."
            value={listingUrl}
            onChange={(e) => setListingUrl(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 rounded bg-indigo-500 hover:bg-indigo-600 text-sm font-medium"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
