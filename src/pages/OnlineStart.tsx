// src/pages/OnlineStart.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveListingUrl } from "../utils/onlineResults";

export default function OnlineStart() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = url.trim();
    if (!trimmed) return;

    // Save URL for scan flow
    saveListingUrl(trimmed);
    console.log("🚗 Listing URL saved:", trimmed);

    // ✅ MUST match App.tsx route
    navigate("/scan/online/analyzing", { replace: true });
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold mb-4">Online Listing Scan</h1>
      <p className="text-muted-foreground">
        Paste a used-car listing URL to analyse wording, pricing and seller risk
        signals.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Listing URL
          </label>
          <input
            type="url"
            required
            placeholder="https://www.cars24.com.au/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          Start online scan
        </button>
      </form>
    </div>
  );
}
