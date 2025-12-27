import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadOnlineResults } from "../utils/onlineResults";
import type { SavedResult } from "../utils/onlineResults";

export default function OnlineReport() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();

    if (!stored) {
      console.warn("No stored results — redirecting");
      navigate("/scan/online");
      return;
    }

    // Ensure arrays always exist
    setResult({
      ...stored,
      signals: Array.isArray(stored.signals) ? stored.signals : [],
      sections: Array.isArray(stored.sections) ? stored.sections : [],
    });
  }, [navigate]);

  if (!result) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">No results available</h1>
        <p className="text-muted-foreground">
          Run a scan first to see your analysis results.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">Listing Analysis</h1>

      <p className="text-sm text-muted-foreground mb-4">
        Source: {result.source} — Seller: {result.sellerType}
      </p>

      {/* Signals */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Signals</h2>

        {result.signals.length > 0 ? (
          <ul className="list-disc pl-4">
            {result.signals.map((s: any, i: number) => (
              <li key={i}>{s?.text ?? "Unnamed signal"}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No signals detected in this listing.
          </p>
        )}
      </section>

      {/* Sections */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Analysis Details</h2>

        {result.sections.length > 0 ? (
          result.sections.map((section: any, i: number) => (
            <div
              key={i}
              className="border border-white/10 rounded p-4 mb-3"
            >
              <h3 className="font-semibold mb-1">{section?.title ?? "Section"}</h3>
              <p>{section?.content ?? ""}</p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">
            No structured breakdown available.
          </p>
        )}
      </section>
    </main>
  );
}
