import { useEffect, useState } from "react";
import { loadOnlineResults } from "../utils/onlineResults";
import { Link } from "react-router-dom";

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
  const [result, setResult] = useState<StoredResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    setResult(stored ?? null);
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">No results found</h1>
        <p className="text-muted-foreground mb-6">
          It looks like there are no saved scan results yet.
        </p>

        <Link
          to="/scan/online"
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
        <h1 className="text-3xl font-bold mb-1">Online scan results</h1>
        <p className="text-muted-foreground">
          These findings were generated from your online vehicle listing.
        </p>
      </header>

      <div className="space-y-4">
        {result.sections.map((section, idx) => (
          <div
            key={idx}
            className="rounded-xl border bg-card px-4 py-4 shadow-sm"
          >
            <h2 className="font-semibold text-lg mb-1">{section.title}</h2>
            <p className="text-sm text-muted-foreground">
              {section.content}
            </p>
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

        <Link
          to="/my-scans"
          className="px-4 py-2 rounded-md border"
        >
          Back to My Scans
        </Link>
      </div>
    </div>
  );
}
