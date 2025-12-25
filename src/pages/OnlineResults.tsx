// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import { loadOnlineResults, clearOnlineResults } from "../utils/onlineResults";
import { Link, useNavigate } from "react-router-dom";

interface ResultSection {
  title: string;
  content: string;
}

interface StoredResult {
  createdAt: string;
  source: string;
  sections: ResultSection[];
}

export default function OnlineResults() {
  const navigate = useNavigate();
  const [results, setResults] = useState<StoredResult[] | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults() as StoredResult[] | null;
    setResults(stored);
  }, []);

  function handleClear() {
    clearOnlineResults();
    navigate("/start-scan");
  }

  // No results saved yet
  if (!results || results.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-2">No results found</h1>
        <p className="text-muted-foreground mb-6">
          It looks like there are no saved online scan results yet.
        </p>

        <Link
          to="/scan/online"
          className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white"
        >
          Start a new online scan
        </Link>
      </div>
    );
  }

  const latest = results[results.length - 1];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Scan results</h1>
        <p className="text-muted-foreground">
          These findings were generated from your online vehicle listing.
        </p>

        <p className="mt-2 text-xs text-muted-foreground">
          Scan date: {new Date(latest.createdAt).toLocaleString()}
        </p>
      </header>

      <div className="space-y-4">
        {latest.sections.map((section, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card px-4 py-4 shadow-sm"
          >
            <h2 className="font-semibold text-lg mb-1">{section.title}</h2>
            <p className="text-sm text-muted-foreground">{section.content}</p>
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

        <button
          onClick={handleClear}
          className="px-4 py-2 rounded-md border text-muted-foreground"
        >
          Clear and start again
        </button>
      </div>

      <div className="mt-6 text-right">
        <Link to="/my-scans" className="text-sm underline">
          Back to My Scans
        </Link>
      </div>
    </div>
  );
}
