// src/pages/InPersonAnalyzing.tsx

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadProgress, saveProgress } from "../utils/scanProgress";
import { isScanUnlocked } from "../utils/scanUnlock";

export default function InPersonAnalyzing() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const scanId = params.get("scanId") || "";
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    if (!scanId) {
      navigate("/scan/in-person/start", { replace: true });
      return;
    }

    const progress: any = loadProgress();

    // Ensure scanId is hydrated into progress
    if (!progress?.scanId || progress.scanId !== scanId) {
      saveProgress({
        ...(progress ?? {}),
        scanId,
      });
    }

    // If not unlocked yet, send back to preview (should be rare post-payment)
    if (!isScanUnlocked(scanId)) {
      navigate("/scan/in-person/preview?scanId=" + scanId, {
        replace: true,
      });
      return;
    }

    try {
      // Run analysis once to ensure everything is warm and valid
      analyseInPersonInspection({
        ...(progress ?? {}),
        scanId,
      });

      // Small intentional delay for perceived value + stability
      const timer = setTimeout(() => {
        navigate(`/scan/in-person/results?scanId=${scanId}`, {
          replace: true,
        });
      }, 1800);

      return () => clearTimeout(timer);
    } catch (err) {
      console.error("In-person analysis failed", err);
      setStatus("error");
    }
  }, [scanId, navigate]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold">
            We hit a snag analysing this inspection
          </h1>
          <p className="text-sm text-slate-400">
            Your scan data is safe. Please return to your summary and try again.
          </p>
          <button
            onClick={() => navigate("/scan/in-person/summary")}
            className="mt-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-2"
          >
            Back to summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="text-2xl font-semibold tracking-wide">
            Car<span className="text-emerald-400">Verity</span>
          </div>
        </div>

        {/* Spinner */}
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        </div>

        {/* Copy */}
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">
            Analysing your in-person inspection
          </h1>
          <p className="text-sm text-slate-400">
            We’re reviewing what you recorded, weighing risks, and preparing
            your buyer-safe results.
          </p>
        </div>

        {/* Trust line */}
        <p className="text-xs text-slate-500">
          This usually takes just a moment.
        </p>
      </div>
    </div>
  );
}
