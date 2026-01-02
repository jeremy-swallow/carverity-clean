// src/pages/OnlineAnalyzing.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadListingUrl } from "../utils/onlineResults";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const url = loadListingUrl();

    console.log("🧩 Analyzing page — URL =", url);

    if (!url) {
      console.warn("⚠️ Missing listing URL — returning to start");
      navigate("/scan/online", { replace: true });
      return;
    }

    // TODO: call API → then navigate to results
    // navigate("/scan/online/results");
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">
        Analyzing listing…
      </h1>
      <p className="text-muted-foreground">
        Sit tight — we’re reviewing wording, pricing signals and seller risk flags.
      </p>
    </div>
  );
}
