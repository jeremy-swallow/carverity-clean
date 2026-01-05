// src/pages/OnlineAnalyzing.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
  type VehicleInfo,
  normaliseVehicle,
  LISTING_URL_KEY,
} from "../utils/onlineResults";
import { saveScan, generateScanId } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";
import { syncScanToCloud } from "../services/scanSyncService";

/* =========================================================
   Preview builder
========================================================= */
function buildPreviewFromConfidence(text: string): string {
  if (!text) return "";
  const match = text.match(
    /CONFIDENCE ASSESSMENT[\r\n]+([\s\S]*?)(?=\n{2,}|CONFIDENCE_CODE:|WHAT THIS MEANS FOR YOU|$)/i
  );
  let result = match?.[1] ?? text;

  result = result
    .replace(/\*\*/g, "")
    .replace(/#+\s*/g, "")
    .replace(/CONFIDENCE_CODE:.*/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!result) return "";
  const sentences = result.split(/(?<=[.!?])\s+/);
  let output = "";

  for (const s of sentences) {
    const next = output ? `${output} ${s}` : s;
    if (next.length > 320) break;
    output = next;
  }

  return (output || result.slice(0, 320)).trim();
}

/* =========================================================
   Vehicle enrichment
========================================================= */
const KNOWN_BRANDS = [
  "Toyota",
  "Kia",
  "Mazda",
  "Ford",
  "Hyundai",
  "Nissan",
  "Mitsubishi",
  "Subaru",
  "Honda",
  "Volkswagen",
  "Audi",
  "BMW",
  "Mercedes",
  "Holden",
  "Peugeot",
  "Renault",
  "Jeep",
  "Volvo",
  "Lexus",
];

function enrichVehicleFromSummary(
  vehicle: VehicleInfo,
  summary: string | null
): VehicleInfo {
  if (!summary || !summary.trim()) return vehicle;

  const updated: VehicleInfo = { ...vehicle };
  const firstLine = summary.split(/\r?\n/)[0] || summary;
  const text = firstLine || summary;
  const brandRegex = new RegExp(`\\b(${KNOWN_BRANDS.join("|")})\\b`, "i");

  if (!updated.make) {
    const brandMatch = text.match(brandRegex);
    if (brandMatch) updated.make = brandMatch[1];
  }

  if (!updated.model && updated.make) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(updated.make.toLowerCase());
    if (idx !== -1) {
      const after = text.slice(idx + updated.make.length);
      const tokens = after.split(/[\s,.;:()]+/).filter(Boolean);
      if (tokens.length > 0) {
        const candidate = tokens[0];
        if (candidate && candidate.length <= 24) {
          updated.model = candidate;
        }
      }
    }
  }

  return updated;
}

/* =========================================================
   Component
========================================================= */
export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  const steps = [
    "Fetching the listing details…",
    "Extracting key vehicle information…",
    "Reviewing the listing text…",
    "Preparing your CarVerity report…",
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((i) => (i + 1) % steps.length);
    }, 1600);
    return () => clearInterval(timer);
  }, [steps.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 2.2));
    }, 90);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);
    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }
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

      const data = await res.json();

      // ✅ NEW: explicit assist-mode handling from backend
      if (data && data.ok === false && data.mode === "assist-required") {
        console.warn(
          "⚠️ Assist mode triggered by backend:",
          data.reason || "scrape-blocked"
        );

        const fallback: SavedResult = {
          type: "online",
          step: "assist-required",
          createdAt: new Date().toISOString(),
          listingUrl,
          vehicle: {},
          previewSummary: null,
          fullSummary: null,
          summary: null,
          sections: [],
          signals: [],
          photos: { listing: [], meta: [] },
          isUnlocked: false,
          conditionSummary: "",
          kilometres: "",
          owners: "",
          notes: "",
        };

        saveOnlineResults(fallback);
        navigate("/scan/online/assist", { replace: true });
        return;
      }

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Scan failed");
      }

      let vehicle = normaliseVehicle(data.vehicle ?? {});
      const rawSummary: string | null =
        data.summary ?? data.fullSummary ?? data.previewSummary ?? null;
      const fullSummary: string | null = rawSummary ?? null;

      vehicle = enrichVehicleFromSummary(vehicle, rawSummary);

      const previewSummary: string | null = rawSummary
        ? buildPreviewFromConfidence(rawSummary)
        : null;

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
        confidenceCode: data.confidenceCode ?? undefined,
        previewSummary,
        fullSummary,
        summary: rawSummary,
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

      const scan: SavedScan = {
        id: generateScanId(),
        type: "online",
        title:
          `${vehicle.year || ""} ${vehicle.make || ""} ${
            vehicle.model || ""
          }`.trim() || "Online scan",
        createdAt: saved.createdAt,
        listingUrl,
        summary: previewSummary ?? "Online scan saved",
        completed: true,
      };

      saveScan(scan);

      await syncScanToCloud(scan, {
        plan: "free",
        report: {
          listingUrl,
          vehicle,
          confidenceCode: saved.confidenceCode,
          previewSummary,
          fullSummary,
          source: saved.source,
        },
      });

      navigate("/scan/online/results", { replace: true });
    } catch (err) {
      console.error("❌ Analysis error — switching to assist mode:", err);

      // 🟣 FALLBACK — Assisted Scan Mode
      const listingUrl = localStorage.getItem(LISTING_URL_KEY);

      const fallback: SavedResult = {
        type: "online",
        step: "assist-required",
        createdAt: new Date().toISOString(),
        listingUrl: listingUrl ?? null,
        vehicle: {},
        previewSummary: null,
        fullSummary: null,
        summary: null,
        sections: [],
        signals: [],
        photos: { listing: [], meta: [] },
        isUnlocked: false,
        conditionSummary: "",
        kilometres: "",
        owners: "",
        notes: "",
      };

      saveOnlineResults(fallback);

      // 🚀 Go to guided assist entry page
      navigate("/scan/online/assist", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-xl">
        <div className="relative w-24 h-24 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-[pulse_2.4s_ease-in-out_infinite]" />
          <img
            src="/logo.png"
            alt="CarVerity logo"
            className="relative w-24 h-24 mx-auto opacity-95"
          />
        </div>

        <h1 className="text-xl font-semibold mb-2">Scanning the listing…</h1>
        <p className="text-slate-400 text-sm mb-6">
          CarVerity is thoughtfully reviewing the listing to help you feel
          confident about your next steps.
        </p>

        <div className="flex items-center justify-center gap-2 mb-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === stepIndex ? "bg-indigo-400 scale-110" : "bg-slate-600"
              }`}
            />
          ))}
        </div>

        <p className="text-sm text-indigo-300 font-medium h-6">
          {steps[stepIndex]}
        </p>

        <div className="mt-5 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-slate-500 mt-6">
          This usually takes a few moments — thanks for your patience.
        </p>
      </div>
    </div>
  );
}
