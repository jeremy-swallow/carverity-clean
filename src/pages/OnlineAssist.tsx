// src/pages/OnlineAssist.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
  LISTING_URL_KEY,
  normaliseVehicle,
} from "../utils/onlineResults";
import { saveScan, generateScanId } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

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

    const listingUrlRaw = localStorage.getItem(LISTING_URL_KEY);
    const listingUrl: string | undefined = listingUrlRaw ?? undefined;

    try {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingUrl,
          pastedText,
          mode: "assist-manual",
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Assist analysis failed");
      }

      let vehicle = normaliseVehicle(data.vehicle ?? {});

      const saved: SavedResult = {
        type: "online",
        step: "analysis-complete",
        createdAt: new Date().toISOString(),
        listingUrl: listingUrl ?? null,
        vehicle,
        confidenceCode: data.confidenceCode ?? undefined,
        previewSummary: data.previewSummary ?? null,
        summary: data.summary ?? null,
        fullSummary: data.fullSummary ?? null,
        sections: data.sections ?? [],
        signals: data.signals ?? [],
        photos: { listing: [], meta: [] },
        isUnlocked: false,
        source: data.source ?? "gemini-2.5-flash",
        analysisSource: "online-assist-v1",
        conditionSummary: "",
        kilometres: vehicle.kilometres ?? "",
        owners: "",
        notes: "",
      };

      saveOnlineResults(saved);

      const scan: SavedScan = {
        id: generateScanId(),
        type: "online",
        title:
          `${vehicle.year || ""} ${vehicle.make || ""} ${
            vehicle.model || ""
          }`.trim() || "Online scan (assist)",
        createdAt: saved.createdAt,
        listingUrl,
        summary: saved.previewSummary || "Assist-mode scan saved",
        completed: true,
      };

      saveScan(scan);

      navigate("/scan/online/results", { replace: true });
    } catch (err) {
      console.error("Assist mode AI analysis failed", err);
      alert("Something went wrong generating the report. Try again.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold mb-2">
          Assisted scan — we’ll help finish this one
        </h1>

        <p className="text-slate-400 mb-6">
          This listing couldn’t be scanned automatically, but you can still get
          a full CarVerity analysis by pasting the details below.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6">
          <button
            onClick={handlePasteClick}
            className="w-full rounded-xl bg-indigo-400/80 hover:bg-indigo-400 text-slate-900 font-semibold py-3 mb-3"
          >
            {isExtracting ? "Extracting…" : "Paste from clipboard"}
          </button>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Or paste listing text here…"
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
            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold py-3 disabled:opacity-40"
          >
            Continue — generate report
          </button>
        </div>
      </div>
    </div>
  );
}
