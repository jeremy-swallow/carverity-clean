import { useEffect, useState } from "react";
import { loadOnlineResults } from "../utils/onlineResults";

interface Signal {
  text?: string;
}

interface Section {
  title?: string;
  content?: string;
}

interface StoredResult {
  createdAt: string;
  source: string;
  sellerType: string;
  signals: Signal[];
  sections: Section[];
  listingUrl: string;
}

export default function OnlineResults() {
  const [result, setResult] = useState<StoredResult | null>(null);

  useEffect(() => {
    const raw = loadOnlineResults();

    // No saved result
    if (!raw || typeof raw !== "object") {
      setResult(null);
      return;
    }

    // 🔒 Safe normalization layer
    const stored: StoredResult = {
      createdAt: (raw as any).createdAt ?? "",
      source: (raw as any).source ?? "unknown",
      sellerType: (raw as any).sellerType ?? "unknown",
      signals: Array.isArray((raw as any).signals) ? (raw as any).signals : [],
      sections: Array.isArray((raw as any).sections) ? (raw as any).sections : [],
      listingUrl: (raw as any).listingUrl ?? "",
    };

    setResult(stored);
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">No results available</h1>
        <p className="text-muted-foreground">
          Run a scan first to see your analysis results.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">Scan results — AI analysis</h1>

      <p className="mb-6 break-all text-sm text-muted-foreground">
        Listing analysed:<br />{result.listingUrl}
      </p>

      {/* Signals */}
      <div className="mb-8">
        <h2 className="font-semibold mb-2">Key signals</h2>

        {result.signals.length > 0 ? (
          <ul className="list-disc pl-4">
            {result.signals.map((s, i) => (
              <li key={i}>{s?.text ?? "Unnamed signal"}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No signals detected in this listing.
          </p>
        )}
      </div>

      {/* Sections */}
      <div>
        <h2 className="font-semibold mb-2">Analysis sections</h2>

        {result.sections.length > 0 ? (
          result.sections.map((section, i) => (
            <div
              key={i}
              className="border border-white/10 rounded p-4 mb-4"
            >
              <h3 className="font-medium mb-1">
                {section?.title ?? "Untitled section"}
              </h3>
              <p className="text-muted-foreground">
                {section?.content ?? ""}
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">
            No analysis sections returned.
          </p>
        )}
      </div>
    </div>
  );
}
