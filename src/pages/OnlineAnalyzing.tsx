// src/pages/OnlineAnalyzing.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  loadListingUrl,
} from "../utils/onlineResults";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrl = loadListingUrl();
    console.log("🔍 Analyzing page loaded — URL =", listingUrl);

    if (!listingUrl) {
      console.warn("⚠️ Missing listing URL — restarting scan");
      navigate("/scan/online", { replace: true });
      return;
    }

    runScan(listingUrl);
  }, [navigate]);

  async function runScan(listingUrl: string) {
    try {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      });

      if (!res.ok) {
        console.error("❌ Analyze listing failed", res.status);
        navigate("/scan/online", { replace: true });
        return;
      }

      const data = await res.json();
      saveOnlineResults(data);

      navigate("/scan/online/results", { replace: true });
    } catch (err) {
      console.error("❌ Analyze listing error", err);
      navigate("/scan/online", { replace: true });
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold mb-3">Analyzing listing…</h1>
      <p className="text-muted-foreground">
        Sit tight — we’re reviewing wording, pricing signals and seller
        risk flags.
      </p>
    </div>
  );
}
