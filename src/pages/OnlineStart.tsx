// src/pages/OnlineStart.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineStart() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    // Save URL for the scan flow
    localStorage.setItem(LISTING_URL_KEY, url);

    console.log("🚀 Listing URL saved:", url);

    // Go straight to analyzing page
    navigate("/scan/online/analyzing", { replace: true });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">
        Online Listing Scan
      </h1>

      <p className="text-muted-foreground mb-6">
        Paste a listing link and we’ll instantly analyse wording,
        pricing signals, seller risk flags and key details.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-3 rounded bg-slate-800 border border-white/10 mb-4"
          placeholder="Paste listing URL…"
          required
        />

        <button
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded"
        >
          Start scan →
        </button>
      </form>
    </div>
  );
}
