// src/pages/OnlineAnalyzing.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnlineResults } from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    "Fetching the listing details…",
    "Scanning the page for important information…",
    "Running AI analysis — almost there…",
    "Still working — thanks for your patience!",
  ];

  useEffect(() => {
    // Rotate reassurance messages every 6s
    const interval = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, messages.length - 1));
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
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

      const data = await res.json();

      if (!data?.ok) {
        alert("Scan failed — the listing could not be analysed.");
        navigate("/start-scan", { replace: true });
        return;
      }

      saveOnlineResults(data);
      navigate("/online/vehicle-details");
    } catch (err) {
      console.error("❌ Scan error:", err);
      alert("Scan failed — network or server error.");
      navigate("/start-scan", { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold mb-3">
          Analyzing listing…
        </h1>

        <p className="text-muted-foreground mb-6">
          This usually takes <strong>10–30 seconds</strong>.<br />
          {messages[messageIndex]}
        </p>

        <div className="flex justify-center gap-2">
          <span className="animate-bounce delay-0 w-2 h-2 bg-white/80 rounded-full" />
          <span className="animate-bounce delay-200 w-2 h-2 bg-white/60 rounded-full" />
          <span className="animate-bounce delay-400 w-2 h-2 bg-white/40 rounded-full" />
        </div>
      </div>
    </div>
  );
}
