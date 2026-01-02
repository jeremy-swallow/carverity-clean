// src/pages/OnlineAnalyzing.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnlineResults } from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    console.log("🔎 Analyzing page loaded, URL =", listingUrl);

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — redirecting to start");
      navigate("/scan/online", { replace: true });
      return;
    }

    runScan(listingUrl);
  }, []);

  async function runScan(listingUrl: string) {
    try {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      });

      if (!res.ok) throw new Error("Scan failed");

      const result = await res.json();

      saveOnlineResults({
        ...result,
        listingUrl,
        isUnlocked: false,
      });

      console.log("✅ Scan saved, navigating to results");

      navigate("/scan/online/results", { replace: true });
    } catch (err) {
      console.error("❌ Scan error:", err);
      navigate("/scan/online", { replace: true });
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-2">Analyzing listing…</h1>
      <p className="text-muted-foreground">
        Sit tight — we’re reviewing wording, pricing signals and seller risk flags.
      </p>
    </div>
  );
}
