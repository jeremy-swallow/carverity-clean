// src/pages/OnlineAssist.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LISTING_URL_KEY } from "../utils/onlineResults";

export default function OnlineAssist() {
  const navigate = useNavigate();

  const [pastedText, setPastedText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  async function handlePasteClick() {
    try {
      setIsExtracting(true);
      const text = await navigator.clipboard.readText();
      setPastedText(text ?? "");
    } catch (err) {
      console.error("Clipboard read failed", err);
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleGenerateReport() {
    if (!pastedText.trim()) return;

    localStorage.setItem(
      "carverity_assist_payload",
      JSON.stringify({
        pastedText,
        listingUrl: localStorage.getItem(LISTING_URL_KEY) ?? null,
        mode: "assist-manual",
      })
    );

    navigate("/scan/online/analyzing", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold mb-2">
          Assisted scan — manual listing review
        </h1>

        <p className="text-slate-400 mb-6">
          This mode is used when a listing can’t be scanned automatically.
          Paste the listing text below to receive a CarVerity analysis.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6 space-y-2">
          <p className="text-xs text-slate-400">
            Assisted scans are <strong>text-only</strong>. Photos are not used in
            this mode.
          </p>

          <button
            onClick={handlePasteClick}
            className="w-full rounded-xl bg-indigo-400/80 hover:bg-indigo-400 text-slate-900 font-semibold py-3"
          >
            {isExtracting ? "Extracting…" : "Paste from clipboard"}
          </button>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste listing description here…"
            className="w-full h-40 bg-slate-900/60 border border-white/10 rounded-xl p-3 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 rounded-xl border border-white/10 py-3"
          >
            Cancel
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={!pastedText.trim()}
            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 disabled:opacity-40"
          >
            Continue — generate report
          </button>
        </div>
      </div>
    </div>
  );
}
