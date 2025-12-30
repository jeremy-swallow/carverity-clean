// src/pages/StartScan.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress } from "../utils/scanProgress";

export default function StartScan() {
  const navigate = useNavigate();
  const [link, setLink] = useState("");

  const canContinue = link.trim().length > 10;

  useEffect(() => {
    saveProgress({
      type: "online",
      step: "/online/start",
      startedAt: new Date().toISOString(),
    });

    const existing = localStorage.getItem("carverity_listing_url");
    if (existing) setLink(existing);
  }, []);

  function handleContinue() {
    const trimmed = link.trim();
    localStorage.setItem("carverity_listing_url", trimmed);

    navigate("/online/analyzing-listing");
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-20 flex flex-col gap-6 text-center">
      <span className="text-xs tracking-wider uppercase text-slate-400">
        Online scan · Step 1 of 5
      </span>

      <h1 className="text-3xl font-extrabold text-white">
        Paste the listing URL
      </h1>

      <p className="text-slate-300 text-sm -mt-2">
        CarVerity will scan the listing and help you review it
      </p>

      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <input
          type="url"
          placeholder="https://example.com/car-listing"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="px-4 py-3 rounded-xl bg-slate-950/80 border border-white/15 text-slate-100 focus:outline-none"
        />

        <button
          disabled={!canContinue}
          onClick={handleContinue}
          className={`px-5 py-3 rounded-xl font-semibold transition ${
            canContinue
              ? "bg-blue-400 text-black"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
        >
          Scan listing
        </button>
      </div>
    </div>
  );
}
