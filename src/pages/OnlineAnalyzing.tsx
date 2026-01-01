import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrl = localStorage.getItem("carverity_online_listing_url");

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    runScan(listingUrl);
  }, []);

  async function runScan(listingUrl: string) {
    try {
      const response = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      });

      const data = await response.json();
      console.log("🧠 ANALYSIS RESULT >>>", data);

      const result: SavedResult = {
        type: "online",
        step: "/online/results",
        createdAt: new Date().toISOString(),

        listingUrl,
        vehicle: data?.vehicle ?? {},

        summary: data?.summary ?? "This AI scan has been completed.",
        conditionSummary: data?.conditionSummary ?? "",

        sections: data?.sections ?? [],
        signals: data?.signals ?? [],

        photos: data?.photos ?? { listing: [], meta: [] },

        kilometres:
          typeof data?.kilometres === "string" ||
          typeof data?.kilometres === "number"
            ? data.kilometres
            : null,

        isUnlocked: false, // 🔒 default: user must unlock
        analysisSource: "auto-search+extractor",
        source: "listing",
      };

      saveOnlineResults(result);
      console.log("💾 Saved scan >>", result);

      navigate("/online/results", { replace: true });
    } catch (err) {
      console.error("❌ Analysis failed:", err);
      alert("Scan failed — please try again.");
      navigate("/start-scan", { replace: true });
    }
  }

  return null;
}
