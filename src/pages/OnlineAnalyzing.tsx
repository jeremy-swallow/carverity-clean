// src/pages/OnlineAnalyzing.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnlineResults, type SavedResult } from "../utils/onlineResults";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    async function runScan(listingUrl: string) {
      try {
        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingUrl }),
        });

        if (!res.ok) {
          console.error("API returned non-OK response", res.status);
          alert("Scan failed — the listing could not be analysed.");
          navigate("/scan/online/start", { replace: true });
          return;
        }

        const data = await res.json();

        // ------------ Safe array coercion helpers ------------
        const toArray = <T,>(v: any): T[] =>
          Array.isArray(v) ? v : v ? [v] : [];

        const sections = toArray<any>(data?.sections);
        const signals = toArray<any>(data?.signals);
        const listingPhotos = toArray<string>(data?.photos);
        const metaPhotos = toArray<any>(data?.photoMeta);

        // ------------ Summary + condition fallback ------------
        const summaryText =
          typeof data?.summary === "string" ? data.summary : "";

        const conditionText =
          typeof data?.conditionSummary === "string"
            ? data.conditionSummary
            : summaryText;

        const result: SavedResult = {
          type: "online",
          step: "/scan/online/results",
          createdAt: new Date().toISOString(),

          listingUrl,
          vehicle: data?.vehicle ?? {},

          sections,
          signals,

          photos: {
            listing: listingPhotos,
            meta: metaPhotos,
          },

          conditionSummary: conditionText,
          summary: summaryText,

          kilometres:
            typeof data?.kilometres === "string" ||
            typeof data?.kilometres === "number"
              ? data.kilometres
              : undefined,

          owners:
            typeof data?.owners === "string" ? data.owners : undefined,

          notes:
            typeof data?.notes === "string" ? data.notes : undefined,

          sellerType:
            typeof data?.sellerType === "string"
              ? data.sellerType
              : "unknown",

          source: "ai",

          isUnlocked: false,
        };

        saveOnlineResults(result);
        navigate("/scan/online/results", { replace: true });
      } catch (err) {
        console.error("Scan failed:", err);
        alert("Scan failed — please try again.");
        navigate("/scan/online/start", { replace: true });
      }
    }

    const url = localStorage.getItem("carverity_online_listing_url");

    if (!url) {
      console.warn("No listing URL — redirecting user");
      navigate("/scan/online/start", { replace: true });
      return;
    }

    runScan(url);
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto py-16 px-6 text-center">
      <h1 className="text-xl font-semibold mb-2">Analyzing listing…</h1>
      <p className="text-muted-foreground">This may take a few seconds.</p>
    </div>
  );
}
