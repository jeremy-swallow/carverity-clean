// src/pages/InPersonAnalyzing.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadProgress, saveProgress } from "../utils/scanProgress";
import { supabase } from "../supabaseClient";

export default function InPersonAnalyzing() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();

  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    if (!scanId) {
      navigate("/scan/in-person/start", { replace: true });
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const progress: any = loadProgress();

        // Ensure scanId is persisted
        if (!progress?.scanId || progress.scanId !== scanId) {
          saveProgress({
            ...(progress ?? {}),
            scanId,
          });
        }

        // Auth required
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/sign-in", { replace: true });
          return;
        }

        // =====================================================
        // CREDIT USAGE POINT (PROFESSIONAL)
        // Spend 1 credit ONLY at the moment we actually start
        // the irreversible report generation step (API usage).
        //
        // This endpoint calls:
        //   deduct_credit_for_in_person_scan(p_reference = scan:{scanId})
        // =====================================================
        const res = await fetch("/api/start-in-person-scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ scanId }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          // Not enough credits → send them to Pricing
          if (
            data?.error === "INSUFFICIENT_CREDITS" ||
            data?.error === "NO_CREDITS"
          ) {
            navigate("/pricing", { replace: true });
            return;
          }

          if (data?.error === "NOT_AUTHENTICATED") {
            navigate("/sign-in", { replace: true });
            return;
          }

          throw new Error(data?.error || "FAILED_TO_DEDUCT_CREDIT");
        }

        // Warm analysis (pure function, client-side)
        analyseInPersonInspection({
          ...(progress ?? {}),
          scanId,
        });

        // Designed delay for perceived seriousness
        const timer = setTimeout(() => {
          if (!cancelled) {
            navigate(`/scan/in-person/results/${scanId}`, { replace: true });
          }
        }, 9000);

        return () => clearTimeout(timer);
      } catch (err) {
        console.error("In-person analysis failed:", err);
        if (!cancelled) setStatus("error");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [scanId, navigate]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold">We couldn’t generate the report</h1>
          <p className="text-sm text-slate-400">
            Your inspection data is safe. Please return to the summary and try
            again.
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
        <div className="text-2xl font-semibold tracking-wide">
          Car<span className="text-emerald-400">Verity</span>
        </div>

        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        </div>

        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Generating your report</h1>
          <p className="text-sm text-slate-400">
            We’re weighing observations, uncertainty, and risk signals to
            prepare your buyer-safe report.
          </p>
        </div>

        <p className="text-xs text-slate-500">
          This usually takes around 10 seconds.
        </p>
      </div>
    </div>
  );
}
