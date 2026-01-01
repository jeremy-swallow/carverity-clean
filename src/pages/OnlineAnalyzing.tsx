import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnlineResults, type SavedResult } from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrlFromStorage = localStorage.getItem(LISTING_URL_KEY) || null;

    if (!listingUrlFromStorage) {
      alert("Missing listing URL — please start again.");
      navigate("/start-scan", { replace: true });
      return;
    }

    runScan(listingUrlFromStorage);
  }, []);

  async function runScan(listingUrl: string) {
    try {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      });

      const data = await res.json();
      console.log("ANALYSIS RESULT >>>", data);

      if (!data?.ok) {
        alert("Scan failed — the listing could not be analysed.");
        navigate("/start-scan", { replace: true });
        return;
      }

      const mergedPhotos: string[] = Array.isArray(data?.photos)
        ? data.photos.slice(0, 8)
        : [];

      const mergedMeta: any[] = Array.isArray(data?.photosMeta)
        ? data.photosMeta.slice(0, 8)
        : [];

      const kilometresValue =
        typeof data?.kilometres === "string" ||
        typeof data?.kilometres === "number"
          ? data.kilometres
          : undefined;

      const result: SavedResult = {
        type: "online",
        step: "/online/vehicle-details",
        createdAt: new Date().toISOString(),

        listingUrl,
        vehicle: data?.vehicle ?? {},
        sections: data?.sections ?? [],
        signals: data?.signals ?? [],

        photos: {
          listing: mergedPhotos,
          meta: mergedMeta,
        },

        conditionSummary: data?.conditionSummary ?? "",
        summary: data?.summary ?? "",
        notes: "",

        kilometres: kilometresValue,

        isUnlocked: true,
        analysisSource: "auto-search+extractor",
        source: "listing",
      };

      saveOnlineResults(result);
      console.log("💾 Saved scan state >>>", result);

      navigate("/online/vehicle-details", { replace: true });
    } catch (err) {
      console.error("❌ Analysis failed:", err);
      alert("Scan failed — please try again.");
      navigate("/start-scan", { replace: true });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Analyzing listing…</h1>
      <p>This may take a few seconds.</p>

      <ul className="mt-6 space-y-2 text-sm text-slate-400 text-left inline-block">
        <li>• Reading listing content…</li>
        <li>• Checking vehicle details…</li>
        <li>• Reviewing photo coverage…</li>
        <li>• Extracting key information…</li>
        <li>• Preparing suggestions…</li>
      </ul>
    </div>
  );
}
