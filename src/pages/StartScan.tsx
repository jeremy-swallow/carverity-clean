// src/pages/StartScan.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveListingUrl } from "../utils/onlineResults";

export default function StartScan() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleaned = url.trim();
    if (!cleaned) {
      alert("Please paste a valid car listing URL before continuing.");
      return;
    }

    // ✅ Persist URL for the analyzing step (shared helper)
    saveListingUrl(cleaned);
    console.log("🚗 Listing URL saved from StartScan:", cleaned);

    // ✅ MUST match App.tsx route:
    // <Route path="/scan/online/analyzing" element={<OnlineAnalyzing />} />
    navigate("/scan/online/analyzing", { replace: true });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Paste the listing URL</h1>
      <p className="text-muted-foreground mb-6">
        CarVerity will scan the listing and help you review it.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg bg-slate-900"
          placeholder="https://example.com/car-listing"
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded shadow w-full"
        >
          Scan listing
        </button>
      </form>
    </div>
  );
}
