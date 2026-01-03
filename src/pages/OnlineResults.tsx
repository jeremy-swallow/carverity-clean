import { useEffect, useState } from "react";

interface VehicleInfo {
  make?: string;
  model?: string;
  year?: string;
  kilometres?: string | null;
}

interface ScanResult {
  summary: string | null;
  confidenceCode?: string | null;
  vehicle: VehicleInfo;
  isUnlocked?: boolean;
}

export default function OnlineResults() {
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("carverity_online_result_v2");
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        setResult(null);
      }
    }
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">No scan data found</h1>
        <p className="text-muted-foreground">
          Run a scan to see your CarVerity results.
        </p>
      </div>
    );
  }

  const { vehicle, summary, confidenceCode, isUnlocked } = result;

  const preview =
    summary
      ?.split("\n")
      .slice(0, 4)
      .join(" ")
      .trim() || null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

      {/* CONFIDENCE */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          Listing confidence
        </h2>
        <p className="text-white font-medium">
          {confidenceCode ? `${confidenceCode} — listing confidence` : "Not available"}
        </p>
      </section>

      {/* PREVIEW (FREE VIEW) */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          CarVerity analysis — preview
        </h2>

        {!summary && (
          <p className="text-muted-foreground">
            No preview available.
          </p>
        )}

        {summary && !isUnlocked && (
          <p className="text-slate-200 text-sm leading-relaxed">
            {preview}… <span className="text-indigo-400">
              Unlock full scan to see the complete report.
            </span>
          </p>
        )}

        {summary && isUnlocked && (
          <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
            {summary}
          </pre>
        )}
      </section>

      {/* VEHICLE DETAILS */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-2">
          Vehicle details
        </h2>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground block">Make</span>
            <span>{vehicle?.make || "—"}</span>
          </div>

          <div>
            <span className="text-muted-foreground block">Model</span>
            <span>{vehicle?.model || "—"}</span>
          </div>

          <div>
            <span className="text-muted-foreground block">Year</span>
            <span>{vehicle?.year || "—"}</span>
          </div>

          <div>
            <span className="text-muted-foreground block">Kilometres</span>
            <span>{vehicle?.kilometres || "—"}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
