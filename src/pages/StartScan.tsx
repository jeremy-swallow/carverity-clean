// src/pages/StartScan.tsx

import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function StartScan() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = url.trim();

    if (!trimmed) {
      console.warn("No URL entered — aborting");
      return;
    }

    // Save URL so the analyzing step can read it
    localStorage.setItem(LISTING_URL_KEY, trimmed);
    console.log("📌 Saved listing URL:", trimmed);

    // Navigate to analyzing step
    navigate("/scan/online/analyzing", { replace: true });
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-2xl font-semibold mb-6">
        Let’s start with the listing
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          className="w-full rounded px-3 py-2 bg-black/30 border border-white/20"
          placeholder="Paste listing link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />

        <button
          type="submit"
          className="mt-2 px-4 py-2 rounded bg-blue-600 text-white"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
