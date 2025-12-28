import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import { saveOnlineResults } from "../utils/onlineResults";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const progress = loadProgress();
    const details = progress?.details ?? {};
    const listingUrl = progress?.listingUrl ?? "";

    const normalized = {
      createdAt: new Date().toISOString(),
      source: "online" as const,
      sellerType: "unknown",
      listingUrl,
      signals: [],
      sections: [
        {
          title: "AI review based on entered details",
          content: details.notes || "No notes provided.",
        },
      ],
      analysisSource: "manual-entry",
      isUnlocked: false,
    };

    saveOnlineResults(normalized);
    navigate("/scan/online/results", { replace: true });
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto py-24 text-center">
      <p>Generating your AI report…</p>
    </div>
  );
}
