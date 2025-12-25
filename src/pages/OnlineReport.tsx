// src/pages/OnlineReport.tsx

import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  clearOnlineResults,
  loadOnlineResults,
} from "../utils/onlineResults";
import type { StoredResult } from "../utils/onlineResults";

export default function OnlineReport() {
  const navigate = useNavigate();

  // Try to load an existing stored result (if user returns to this page)
  const existing = loadOnlineResults();

  // Temporary placeholder demo report (until AI generation is added)
  const sample: StoredResult = existing ?? {
    createdAt: new Date().toISOString(),
    source: "online",
    sections: [
      {
        title: "Listing Overview",
        content:
          "Placeholder content — listing extraction & vehicle signals will appear here.",
      },
      {
        title: "Risk Factors",
        content:
          "Placeholder content — potential concerns or red flags will appear here.",
      },
      {
        title: "Next Actions",
        content:
          "Placeholder content — recommended steps for inspection and verification.",
      },
    ],
  };

  function handleSave() {
    saveOnlineResults(sample);
    navigate("/online-results");
  }

  function handleDiscard() {
    clearOnlineResults();
    navigate("/start-scan");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Online scan report</h1>

      <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
        {JSON.stringify(sample, null, 2)}
      </pre>

      <div className="mt-8 flex gap-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-md bg-blue-600 text-white"
        >
          Save to My Scans
        </button>

        <button
          onClick={handleDiscard}
          className="px-4 py-2 rounded-md border"
        >
          Discard and restart
        </button>
      </div>
    </div>
  );
}
