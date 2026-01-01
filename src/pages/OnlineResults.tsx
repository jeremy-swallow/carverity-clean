// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineResults() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SavedResult | null>(null);

  // Load saved scan when page mounts
  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) {
      console.warn("⚠️ No scan result found — returning to start");
      navigate("/start-scan", { replace: true });
      return;
    }
    setResult(stored);
  }, [navigate]);

  // While loading (or if redirect just happened)
  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold mb-2">Loading results…</h1>
      </div>
    );
  }

  // Safe helpers for rendering
  const vehicle = result.vehicle ?? {};
  const sections = result.sections ?? [];

  const summary =
    result.summary?.trim() ||
    "No AI summary was returned for this listing — but the details below were successfully extracted.";

  function handleContinue() {
    // 🔒 Runtime guard so TS knows result is non-null here as well
    if (!result) return;

    // ✅ Guarantee all required SavedResult fields + literals
    const updated: SavedResult = {
      ...result,
      type: "online", // preserve literal type
      step: "/online/next-actions",
      createdAt: result.createdAt ?? new Date().toISOString(),
      listingUrl: result.listingUrl ?? "",
      vehicle: result.vehicle ?? {},
      sections: result.sections ?? [],
      photos: result.photos ?? { listing: [], meta: [] },
      isUnlocked: result.isUnlocked ?? true,
      conditionSummary: result.conditionSummary ?? "",
    };

    saveOnlineResults(updated);
    setResult(updated);

    navigate("/online/next-actions", { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">
        Scan results — AI-assisted review
      </h1>

      <p className="text-sm mb-6">
        Listing analysed:&nbsp;
        <a
          href={result.listingUrl || "#"}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          {result.listingUrl || "Unknown listing"}
        </a>
      </p>

      {/* Summary card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-2">CarVerity review summary</h2>
        <p>{summary}</p>
      </div>

      {/* Vehicle details card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-2">Vehicle details</h2>

        <p>Make: {vehicle.make ?? "—"}</p>
        <p>Model: {vehicle.model ?? "—"}</p>
        <p>Year: {vehicle.year ?? "—"}</p>
        <p>Variant: {vehicle.variant ?? "—"}</p>
        <p>
          Import status:{" "}
          {vehicle.importStatus ?? "Not specified in listing"}
        </p>
        <p>Kilometres: {result.kilometres ?? "Not specified"}</p>
      </div>

      {/* Extra sections from AI */}
      {sections.length > 0 ? (
        sections.map((s, i) => (
          <div
            key={i}
            className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4"
          >
            <h3 className="font-semibold mb-1">{s.title}</h3>
            <p>{s.content}</p>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No additional sections returned from the scan.
        </p>
      )}

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleContinue}
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
