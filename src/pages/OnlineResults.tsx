import { useEffect, useState } from "react";
import { loadOnlineResults } from "../utils/onlineResults";
import { Link } from "react-router-dom";

interface ResultItem {
  title: string;
  description: string;
  action?: string;
  confidence?: string;
}

export default function OnlineResults() {
  const [results, setResults] = useState<ResultItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadOnlineResults() as ResultItem[] | null;
    setResults(stored);
    setLoading(false);
  }, []);

  // ⏳ Wait for storage before deciding what to do
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">Loading results…</h1>
        <p className="text-muted-foreground">
          Please wait while we retrieve your scan.
        </p>
      </div>
    );
  }

  // 🟡 Only show "no results" AFTER loading completes
  if (!results || results.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">No results found</h1>
        <p className="text-muted-foreground mb-6">
          It looks like there are no saved scan results yet.
        </p>

        <Link
          to="/online-start"
          className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white"
        >
          Start a new scan
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Scan results</h1>
        <p className="text-muted-foreground">
          These findings are generated from your online vehicle listing.
        </p>
      </header>

      <div className="space-y-4">
        {results.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card px-4 py-4 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-semibold text-lg">{item.title}</h2>

              {item.confidence && (
                <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Confidence: {item.confidence}
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {item.description}
            </p>

            {item.action && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 rounded-md">
                Recommended action: {item.action}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <Link
          to="/online-next-actions"
          className="px-4 py-2 rounded-md bg-emerald-600 text-white"
        >
          View next actions
        </Link>

        <Link to="/my-scans" className="px-4 py-2 rounded-md border">
          Back to My Scans
        </Link>
      </div>
    </div>
  );
}
