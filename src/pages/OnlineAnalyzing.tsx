// src/pages/OnlineAnalyzing.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    console.log("🚀 Running scan for:", listingUrl);
    runScan(listingUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runScan(listingUrl: string) {
    try {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingUrl }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Scan failed:", text);
        throw new Error(text || "Scan failed");
      }

      const data = await res.json();

      const previewSummary: string | null =
        data.previewSummary ?? null;
      const fullSummary: string | null = data.fullSummary ?? null;
      const confidenceCode: "LOW" | "MODERATE" | "HIGH" | undefined =
        data.confidenceCode ?? undefined;

      const vehicle = data.vehicle ?? {};

      const saved: SavedResult = {
        type: "online",
        step: "analysis-complete",
        createdAt: new Date().toISOString(),

        listingUrl,
        vehicle: {
          make: vehicle.make ?? "",
          model: vehicle.model ?? "",
          year: vehicle.year ?? "",
          kilometres: vehicle.kilometres ?? "",
          ...vehicle,
        },

        confidenceCode,
        previewSummary,
        fullSummary,
        // keep summary for backwards compatibility
        summary: fullSummary ?? previewSummary ?? null,

        sections: [],
        signals: [],
        photos: { listing: [], meta: [] },
        isUnlocked: false,

        source: data.source ?? "gemini-2.5-flash",
        analysisSource: "online-listing-v1",
        sellerType: data.sellerType ?? undefined,

        conditionSummary: "",
        kilometres: vehicle.kilometres ?? "",
        owners: "",
        notes: "",
      };

      saveOnlineResults(saved);

      navigate("/scan/online/results", { replace: true });
    } catch (err: any) {
      console.error("❌ Analysis error:", err);
      // For now just bounce back; later we can show a nicer error page
      navigate("/scan/online", { replace: true });
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-100">
      <h1 className="text-2xl font-semibold mb-2">
        Scan results — AI-assisted review
      </h1>
      <p className="text-sm text-slate-400">
        Running your online listing through CarVerity&hellip;
      </p>
    </div>
  );
}
