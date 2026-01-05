import { useEffect, useState, useRef } from "react";
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
  "Toyota","Kia","Mazda","Ford","Hyundai","Nissan","Mitsubishi",
  "Subaru","Honda","Volkswagen","Audi","BMW","Mercedes","Holden",
  "Peugeot","Renault","Jeep","Volvo","Lexus",
];

function enrichVehicleFromSummary(
  vehicle: VehicleInfo,
  summary: string | null
): VehicleInfo {
  if (!summary || !summary.trim()) return vehicle;

  const updated: VehicleInfo = { ...vehicle };
  const text = summary;

  // Brand
  const brandRegex = new RegExp(`\\b(${KNOWN_BRANDS.join("|")})\\b`, "i");
  const brandMatch = text.match(brandRegex);
  if (!updated.make && brandMatch) {
    updated.make = brandMatch[1];
  }

  // Model — first token after make
  if (!updated.model && updated.make) {
    const regex = new RegExp(`${updated.make}\\s+([A-Za-z0-9-]+)`, "i");
    const m = text.match(regex);
    if (m?.[1]) updated.model = m[1];
  }

  // Year
  if (!updated.year) {
    const yearMatch = text.match(/\b(20[0-4]\d|19[8-9]\d)\b/);
    if (yearMatch) updated.year = yearMatch[1];
  }

  // Kilometres
  if (!updated.kilometres) {
    const kmMatch = text.match(/([\d,\.]+)\s*(km|kms|kilometres)/i);
    if (kmMatch) updated.kilometres = kmMatch[1].replace(/[,\.]/g, "");
  }

  return updated;
}

/* =========================================================
   Component
========================================================= */
export default function OnlineAnalyzing() {
  const navigate = useNavigate();
  const hasRunRef = useRef(false);

  const steps = [
    "Fetching the listing details…",
    "Extracting key vehicle information…",
    "Reviewing the listing text…",
    "Preparing your CarVerity report…",
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setStepIndex((i) => (i + 1) % steps.length),
      1600
    );
    return () => clearInterval(t);
  }, [steps.length]);

  useEffect(() => {
    const i = setInterval(
      () => setProgress((p) => (p >= 100 ? 0 : p + 2.2)),
      90
    );
    return () => clearInterval(i);
  }, []);

  function enterAssistMode(listingUrl: string | null) {
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
    setTimeout(() => navigate("/scan/online/assist", { replace: true }), 0);
  }

  useEffect(() => {
    const payloadRaw = localStorage.getItem("carverity_assist_payload");
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    if (!hasRunRef.current) {
      hasRunRef.current = true;

      if (payloadRaw) {
        const payload = JSON.parse(payloadRaw);
        runScan(listingUrl ?? "", payload);
      } else {
        runScan(listingUrl ?? "");
      }
    }
  }, []);

  async function runScan(listingUrl: string, assistPayload?: any) {
    try {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assistPayload ? assistPayload : { listingUrl }),
      });

      const data = await res.json();

      if (data && data.ok === false && data.mode === "assist-required") {
        enterAssistMode(listingUrl);
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
        vehicle,
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
          `${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model || ""}`.trim() ||
          "Online scan",
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

      localStorage.removeItem("carverity_assist_payload");
      navigate("/scan/online/results", { replace: true });
    } catch (err) {
      console.error("❌ Analysis error — switching to assist mode:", err);
      enterAssistMode(listingUrl);
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
