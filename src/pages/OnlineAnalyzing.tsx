import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { saveOnlineResults } from "../utils/onlineResults";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();
  const location = useLocation();

  const listingUrl =
    (location.state as { listingUrl?: string })?.listingUrl ?? "";

  useEffect(() => {
    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    console.log("🔎 Running scan on:", listingUrl);

    // Temporary success placeholder
    saveOnlineResults({
      createdAt: new Date().toISOString(),
      source: "online",
      sellerType: "unknown",
      listingUrl,
      signals: [],
      sections: [],
      analysisSource: "live",
    });

    navigate("/scan/online/results", { replace: true });
  }, [listingUrl, navigate]);

  return (
    <main className="flex items-center justify-center min-h-screen">
      <p className="text-white/80">Analyzing listing…</p>
    </main>
  );
}
