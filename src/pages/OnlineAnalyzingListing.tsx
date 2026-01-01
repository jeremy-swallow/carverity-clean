import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LISTING_URL_KEY = "carverity_online_listing_url";

const steps = [
  "Fetching the listing details…",
  "Scanning description for risks…",
  "Checking for missing or unclear information…",
  "Preparing your buyer-friendly summary…",
];

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Rotate progress messages every 1.5s
    const timer = setInterval(() => {
      setStepIndex((i) => (i + 1) % steps.length);
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    if (!listingUrl) {
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

      if (!data.ok) {
        alert("Scan failed — the listing could not be analysed.");
        navigate("/start-scan", { replace: true });
        return;
      }

      localStorage.setItem("carverity_latest_scan", JSON.stringify(data));
      navigate("/online/vehicle-details", { replace: true });
    } catch (err) {
      alert("Something went wrong while analysing the listing.");
      navigate("/start-scan", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-2xl font-semibold mb-3">
          Analyzing listing…
        </h1>

        <p className="text-slate-300 mb-6">
          This usually takes <b>10–30 seconds</b>.<br />
          Thanks for your patience — we’re working through the details carefully.
        </p>

        <div className="bg-slate-800/70 border border-white/10 rounded-xl p-4">
          <p className="text-emerald-300 font-medium">
            {steps[stepIndex]}
          </p>

          <div className="flex justify-center mt-4 gap-2">
            <span className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></span>
            <span className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-200"></span>
            <span className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-400"></span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          If this takes longer than expected, please keep this page open — the scan is still running.
        </p>
      </div>
    </div>
  );
}
