// src/pages/OnlineAnalyzing.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";
import { loadProgress, type ScanProgress } from "../utils/scanProgress";

const LISTING_URL_KEY = "carverity_online_listing_url";

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

        // ========= Load saved progress (user-entered values) =========
        const progress: ScanProgress | null = loadProgress();

        const userCondition =
          progress && typeof progress.conditionSummary === "string"
            ? progress.conditionSummary.trim()
            : "";

        const userNotes =
          progress && typeof progress.notes === "string"
            ? progress.notes.trim()
            : "";

        let userPhotos: string[] = [];
        let userMeta: any[] = [];

        if (progress?.photos) {
          if (Array.isArray(progress.photos.listing)) {
            userPhotos = progress.photos.listing;
          }
          if (Array.isArray(progress.photos.meta)) {
            userMeta = progress.photos.meta;
          }
        }

        // ------------ Safe array helpers ------------
        const toArray = <T,>(v: any): T[] =>
          Array.isArray(v) ? v : v ? [v] : [];

        const sections = toArray<any>(data?.sections);
        const signals = toArray<any>(data?.signals);
        const apiPhotos = toArray<string>(data?.photos);
        const apiMeta = toArray<any>(data?.photoMeta);

        // ------------ Text fallback strategy ------------
        const apiSummary =
          typeof data?.summary === "string" ? data.summary : "";

        const apiCondition =
          typeof data?.conditionSummary === "string"
            ? data.conditionSummary
            : apiSummary;

        // Prefer user text if present, otherwise API text
        const conditionSummary =
          userCondition || apiCondition || "";

        const notes =
          userNotes ||
          (typeof data?.notes === "string" ? data.notes : "") ||
          "";

        // Merge photos without duplication
        const mergedPhotos = Array.from(
          new Set([...userPhotos, ...apiPhotos])
        );

        const mergedMeta = Array.from(new Set([...userMeta, ...apiMeta]));

        const result: SavedResult = {
          type: "online",
          step: "/scan/online/results",
          createdAt: new Date().toISOString(),

          listingUrl,
          vehicle: data?.vehicle ?? {},

          sections,
          signals,

          photos: {
            listing: mergedPhotos,
            meta: mergedMeta,
          },

          conditionSummary,
          summary: apiSummary,

          kilometres:
            typeof data?.kilometres === "string" ||
            typeof data?.kilometres === "number"
              ? data.kilometres
              : undefined,

          owners:
            typeof data?.owners === "string" ? data.owners : undefined,

          notes,

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

    const url = localStorage.getItem(LISTING_URL_KEY);

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
