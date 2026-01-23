import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadProgress, saveProgress } from "../utils/scanProgress";
import { saveScan } from "../utils/scanStorage";
import { supabase } from "../supabaseClient";

function vehicleTitleFromProgress(p: any): string {
  const year = p?.vehicleYear ?? p?.vehicle?.year ?? "";
  const make = p?.vehicleMake ?? p?.vehicle?.make ?? "";
  const model = p?.vehicleModel ?? p?.vehicle?.model ?? "";
  const parts = [year, make, model].filter(Boolean);
  return parts.length ? parts.join(" ") : "In-person inspection";
}

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

    async function run(scanIdSafe: string) {
      try {
        const progress: any = loadProgress();

        if (!progress) {
          navigate("/scan/in-person/start", { replace: true });
          return;
        }

        // Ensure scanId is persisted
        if (!progress?.scanId || progress.scanId !== scanIdSafe) {
          saveProgress({
            ...(progress ?? {}),
            scanId: scanIdSafe,
          });
        }

        // Auth required
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/signin", { replace: true });
          return;
        }

        // =====================================================
        // CREDIT USAGE POINT
        // Spend 1 credit ONLY at the moment we actually start
        // report generation (API usage).
        // =====================================================
        const res = await fetch("/api/start-in-person-scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ scanId: scanIdSafe }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (
            data?.error === "INSUFFICIENT_CREDITS" ||
            data?.error === "NO_CREDITS"
          ) {
            navigate("/pricing", { replace: true });
            return;
          }

          if (data?.error === "NOT_AUTHENTICATED") {
            navigate("/signin", { replace: true });
            return;
          }

          throw new Error(data?.error || "FAILED_TO_DEDUCT_CREDIT");
        }

        // Generate analysis (pure function)
        const analysis = analyseInPersonInspection({
          ...(progress ?? {}),
          scanId: scanIdSafe,
        });

        // Persist a completed scan record for reload-safe results
        const firstPhoto = Array.isArray(progress?.photos)
          ? progress.photos[0]?.dataUrl
          : null;

        const concernsCount = Array.isArray(analysis?.risks)
          ? analysis.risks.filter((r: any) => r?.severity !== "info").length
          : 0;

        const unsureCount = Array.isArray((analysis as any)?.uncertaintyFactors)
          ? (analysis as any).uncertaintyFactors.length
          : 0;

        const imperfectionsCount = Array.isArray(progress?.imperfections)
          ? progress.imperfections.length
          : 0;

        const photosCount = Array.isArray(progress?.photos)
          ? progress.photos.length
          : 0;

        saveScan({
          id: scanIdSafe,
          type: "in-person",
          title: vehicleTitleFromProgress(progress),
          createdAt: new Date().toISOString(),
          vehicle: {
            year: progress?.vehicleYear ? String(progress.vehicleYear) : undefined,
            make: progress?.vehicleMake,
            model: progress?.vehicleModel,
            variant: progress?.vehicleVariant,
          },
          thumbnail: firstPhoto || null,
          askingPrice:
            typeof progress?.askingPrice === "number" ? progress.askingPrice : null,
          score:
            typeof analysis?.confidenceScore === "number"
              ? analysis.confidenceScore
              : null,
          concerns: concernsCount,
          unsure: unsureCount,
          imperfectionsCount,
          photosCount,
          fromOnlineScan: Boolean(progress?.fromOnlineScan),
          completed: true,
          history: [
            {
              at: new Date().toISOString(),
              event: "report_generated",
            },
          ],
          analysis,
          progressSnapshot: progress,
        });

        // Short delay so it feels deliberate, without wasting time
        await new Promise((r) => setTimeout(r, 1200));

        if (!cancelled) {
          navigate(`/scan/in-person/results/${scanIdSafe}`, { replace: true });
        }
      } catch (err) {
        console.error("In-person analysis failed:", err);
        if (!cancelled) setStatus("error");
      }
    }

    run(scanId);

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
            We’re weighing observations, uncertainty, and risk signals to prepare
            your buyer-safe report.
          </p>
        </div>

        <p className="text-xs text-slate-500">This usually takes around 10 seconds.</p>
      </div>
    </div>
  );
}
