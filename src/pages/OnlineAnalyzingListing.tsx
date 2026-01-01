import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnlineResults } from "../utils/onlineResults";
import type { SavedResult } from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    console.log("🚀 Running listing scan for:", listingUrl);
    runAnalysis(listingUrl);
  }, []);

  async function runAnalysis(listingUrl: string) {
    try {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      });

      const data = await res.json();
      console.log("📦 ANALYSIS RESULT >>>", data);

      if (!data?.ok) {
        alert("Scan failed — the listing could not be analysed.");
        navigate("/start-scan", { replace: true });
        return;
      }

      const result: SavedResult = {
        type: "online",
        step: "/online/vehicle-details", // ⭐ user confirms KM next
        createdAt: new Date().toISOString(),

        listingUrl,
        vehicle: data.vehicle ?? {},
        sections: data.sections ?? [],
        signals: data.signals ?? [],

        photos: {
          listing: data.photos ?? [],
          meta: [],
        },

        kilometres:
          typeof data?.kilometres === "string" ||
          typeof data?.kilometres === "number"
            ? data.kilometres
            : null,

        isUnlocked: true,
        analysisSource: "auto-search+extractor",
        source: "listing",
        conditionSummary: data?.conditionSummary ?? "",
        summary: data?.summary ?? "",
        notes: "",
      };

      saveOnlineResults(result);
      console.log("💾 Saved scan state >>>", result);

      // ⭐ STOP sending user to next-actions
      // navigate("/online/next-actions", { replace: true });

      // ⭐ Correct flow:
      // 1) confirm details (incl kilometres)
      // 2) then results page
      navigate("/online/vehicle-details", { replace: true });

    } catch (err) {
      console.error("❌ Analysis failed:", err);
      alert("Scan failed — please try again.");
      navigate("/start-scan", { replace: true });
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-2">Analyzing listing…</h1>
      <p className="text-muted-foreground">
        This may take a few seconds.
      </p>
    </div>
  );
}
