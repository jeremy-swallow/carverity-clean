// src/pages/OnlineResults.tsx

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface ApiResult {
  ok: boolean;
  analysisSource: string;
  sellerType?: string;
  htmlLength?: number;
  signals?: Array<{
    id: string;
    label: string;
    severity: string;
    description: string;
  }>;
}

export default function OnlineResults() {
  const location = useLocation();
  const [result, setResult] = useState<ApiResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("online_scan_result");
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        console.error("Failed to parse stored result");
      }
    }
  }, [location]);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">No results available</h1>
        <p className="text-muted-foreground">
          Run a scan first to see your analysis results.
        </p>
      </div>
    );
  }

  const signals = result.signals ?? []; // <-- SAFE DEFAULT

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-xl font-semibold mb-6">
        Scan results — AI analysis
      </h1>

      <div className="mb-6 p-4 rounded-lg border border-white/10 bg-black/20">
        <p className="text-sm mb-1">
          <strong>Analysis mode:</strong> {result.analysisSource}
        </p>
        <p className="text-sm mb-1">
          <strong>Seller type:</strong> {result.sellerType ?? "Unknown"}
        </p>
        <p className="text-sm">
          <strong>HTML size:</strong>{" "}
          {result.htmlLength ? `${result.htmlLength} chars` : "N/A"}
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-3">Risk signals</h2>

      {/* SAFELY HANDLE EMPTY SIGNAL LIST */}
      {signals.length === 0 && (
        <div className="p-4 rounded-lg border border-white/10 bg-black/10">
          <p>No risk signals were detected for this listing.</p>
        </div>
      )}

      {signals.length > 0 && (
        <div className="space-y-3">
          {signals.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-lg border border-white/10 bg-black/10"
            >
              <p className="font-medium">{s.label}</p>
              <p className="text-sm opacity-80">{s.description}</p>
              <p className="text-xs mt-1 opacity-60">
                Severity: {s.severity}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
