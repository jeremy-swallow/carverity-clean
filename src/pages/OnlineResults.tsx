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
  const [data, setData] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) {
      navigate("/scan/online", { replace: true });
      return;
    }
    setData(stored);
  }, [navigate]);

  if (!data) return null;

  const vehicle = (data.vehicle as any) || {};

  const kilometresRaw =
    (data as any).kilometres ??
    vehicle.kilometres ??
    vehicle.kms ??
    vehicle.kilometers ??
    vehicle.odometerKm ??
    vehicle.odometer ??
    null;

  const kilometres = formatKilometres(kilometresRaw);
  const isUnlocked = !!data.isUnlocked;
  const confidenceLabel = labelConfidence(data.confidenceCode);

  function handleUnlock() {
    setData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, isUnlocked: true } as SavedResult;
      saveOnlineResults(updated);
      return updated;
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-2xl font-semibold">
        Scan results — AI-assisted review
      </h1>

      {/* Confidence banner */}
      {data.confidenceCode && (
        <div className="rounded-md border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-2" />
          <span className="font-medium">
            Confidence assessment: {confidenceLabel}
          </span>
        </div>
      )}

      {/* Preview summary */}
      <div className="rounded-md border border-white/10 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold mb-2">
          CarVerity analysis — preview
        </h2>
        <p className="text-sm leading-relaxed">{data.conditionSummary}</p>
        <p className="mt-2 text-xs opacity-70">
          (Free preview — the full scan provides a deeper, listing-specific
          breakdown.)
        </p>
      </div>

      {/* Vehicle details */}
      <div className="rounded-md border border-white/10 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold mb-2">Vehicle details</h2>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <Field label="Make" value={vehicle.make} />
          <Field label="Model" value={vehicle.model} />
          <Field label="Year" value={vehicle.year} />
          <Field label="Variant" value={vehicle.variant ?? "—"} />
          <Field label="Kilometres" value={kilometres ?? "—"} />
        </div>
      </div>

      {/* Full AI analysis (blurred + unlock) */}
      <div className="rounded-md border border-white/10 bg-slate-900/60 p-4 relative overflow-hidden">
        <h2 className="text-sm font-semibold mb-3">Full AI analysis</h2>

        {!isUnlocked && (
          <>
            <div className="blur-sm opacity-70 select-none pointer-events-none">
              {renderSections(data)}
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/70 backdrop-blur-sm rounded-md px-6 py-3 text-center max-w-lg mx-auto">
                <p className="text-sm mb-2">
                  Full scan locked — unlock to reveal detailed risk signals,
                  tailored buyer checks and negotiation insights for this
                  listing.
                </p>
                <button
                  type="button"
                  onClick={handleUnlock}
                  className="bg-indigo-500 hover:bg-indigo-400 px-4 py-2 rounded text-sm font-medium"
                >
                  Unlock full scan
                </button>
              </div>
            </div>
          </>
        )}

        {isUnlocked && renderSections(data)}
      </div>
    </div>
  );
}

/* ----------------- helpers ----------------- */

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <span className="opacity-70 mr-1">{label}:</span>
      <span>{value ?? "—"}</span>
    </div>
  );
}

function formatKilometres(raw: any) {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  if (isNaN(n)) return String(raw);
  return n.toLocaleString() + " km";
}

function labelConfidence(code?: string | null) {
  if (code === "HIGH") return "High — looks solid overall";
  if (code === "LOW") return "Low — important risks found";
  if (code === "MODERATE") return "Moderate — a few things to confirm";
  return "Not assessed";
}

function renderSections(data: SavedResult) {
  const sections = data.sections || [];
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {sections.map((s, idx) => (
        <div key={idx}>
          <h3 className="font-semibold mb-1">{s.title}</h3>
          <p className="opacity-90 whitespace-pre-line">{s.content}</p>
        </div>
      ))}
    </div>
  );
}
