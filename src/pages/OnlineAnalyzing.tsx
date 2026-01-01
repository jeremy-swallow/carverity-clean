import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

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
      setStep(1); // Fetching
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      });

      setStep(2); // AI analysing

      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Scan failed");

      setStep(3); // Preparing results

      localStorage.setItem("carverity_online_result", JSON.stringify(data));
      navigate("/online/vehicle-details", { replace: true });
    } catch (err) {
      alert("Scan failed — the listing could not be analysed.");
      navigate("/start-scan", { replace: true });
    }
  }

  const steps = [
    "Fetching the vehicle listing…",
    "Extracting key vehicle details…",
    "Running AI safety & risk analysis…",
    "Preparing your results…",
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-6">
        <h1 className="text-2xl font-semibold mb-4">
          Analysing listing
        </h1>

        <p className="text-slate-300 mb-6">
          This usually takes around 20–30 seconds. Thanks for your patience.
        </p>

        <div className="space-y-3 text-left">
          {steps.map((text, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                i <= step
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-white/10"
              }`}
            >
              {i < step ? "✓ " : "• "}
              {text}
            </div>
          ))}
        </div>

        <div className="mt-8 animate-pulse text-slate-400">
          CarVerity is reviewing the listing carefully…
        </div>
      </div>
    </div>
  );
}
