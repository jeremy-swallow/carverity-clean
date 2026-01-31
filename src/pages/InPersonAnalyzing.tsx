import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadProgress, saveProgress } from "../utils/scanProgress";
import { saveScan, loadScanById } from "../utils/scanStorage";
import { supabase } from "../supabaseClient";

/* =========================================================
   Helpers
========================================================= */

function vehicleTitleFromProgress(p: any): string {
  const year = p?.vehicleYear ?? p?.vehicle?.year ?? "";
  const make = p?.vehicleMake ?? p?.vehicle?.make ?? "";
  const model = p?.vehicleModel ?? p?.vehicle?.model ?? "";
  const parts = [year, make, model].filter(Boolean);
  return parts.length ? parts.join(" ") : "In-person inspection";
}

/**
 * Canonical credit reference
 */
function creditReferenceForScan(scanId: string) {
  return `scan:${scanId}`;
}

/**
 * Remove heavy / incompatible fields before analysis or API calls.
 * - We no longer rely on base64 `dataUrl`
 * - Keeps the payload small and stable
 */
function stripHeavyFields(progress: any) {
  const p = { ...(progress ?? {}) };

  if (Array.isArray(p.photos)) {
    p.photos = p.photos.map((ph: any) => ({
      id: ph?.id,
      stepId: ph?.stepId,
      storagePath: ph?.storagePath,
    }));
  }

  if (Array.isArray(p.followUpPhotos)) {
    p.followUpPhotos = p.followUpPhotos.map((ph: any) => ({
      id: ph?.id,
      stepId: ph?.stepId,
      note: ph?.note,
      storagePath: ph?.storagePath,
    }));
  }

  // Imperfection photos (if present)
  if (Array.isArray(p.imperfections)) {
    p.imperfections = p.imperfections.map((imp: any) => ({
      ...imp,
      // drop any embedded base64s if they ever appear
      dataUrl: undefined,
      photos: Array.isArray(imp?.photos)
        ? imp.photos.map((ph: any) => ({
            id: ph?.id,
            storagePath: ph?.storagePath,
          }))
        : imp?.photos,
    }));
  }

  return p;
}

/**
 * Authenticated POST helper
 */
async function postJsonAuthed<T>(
  url: string,
  body: any,
  accessToken: string
): Promise<{ ok: boolean; status: number; json: T | null }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body ?? {}),
    });

    const status = res.status;

    let json: any = null;
    try {
      json = await res.json();
    } catch {}

    return { ok: res.ok, status, json };
  } catch (err) {
    console.error("[InPersonAnalyzing] postJson failed:", url, err);
    return { ok: false, status: 0, json: null };
  }
}

/**
 * Idempotent AI generation:
 * - If scan already has aiInterpretation -> do nothing
 * - Otherwise call /api/analyze-in-person and persist aiInterpretation
 *
 * NOTE:
 * - SavedInspection type may not include aiInterpretation yet, so we treat it as any.
 */
async function generateAIIfMissing(args: {
  scanId: string;
  accessToken: string;
  progress: any;
  analysis: any;
}) {
  const { scanId, accessToken, progress, analysis } = args;

  const existingAny = (loadScanById(scanId) as any) ?? null;
  if (existingAny?.aiInterpretation) return;

  const concernsCount = Array.isArray(analysis?.risks)
    ? analysis.risks.filter((r: any) => r?.severity !== "info").length
    : 0;

  const unsureCount = Array.isArray(analysis?.uncertaintyFactors)
    ? analysis.uncertaintyFactors.length
    : 0;

  const imperfectionsCount = Array.isArray(progress?.imperfections)
    ? progress.imperfections.length
    : 0;

  const photosCount = Array.isArray(progress?.photos) ? progress.photos.length : 0;

  const aiResp = await postJsonAuthed<any>(
    "/api/analyze-in-person",
    {
      scanId,
      progress: stripHeavyFields(progress),
      analysis,
      summary: {
        concernsCount,
        unsureCount,
        imperfectionsCount,
        photosCount,
      },
    },
    accessToken
  );

  const aiInterpretation = aiResp.ok && aiResp.json ? (aiResp.json as any).ai : null;

  // Persist even if null (so UI can show a consistent fallback)
  await saveScan({
    ...(existingAny ?? {}),
    id: scanId,
    type: "in-person",
    aiInterpretation,
  } as any);
}

/* =========================================================
   Page
========================================================= */

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

        saveProgress({
          ...(progress ?? {}),
          type: "in-person",
          scanId: scanIdSafe,
          step: `/scan/in-person/analyzing/${scanIdSafe}`,
        });

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/signin", { replace: true });
          return;
        }

        const accessToken = session.access_token;
        const reference = creditReferenceForScan(scanIdSafe);

        /* --------------------------------------------------
           Attempt credit spend (server should be idempotent)
        -------------------------------------------------- */
        const creditAttempt = await postJsonAuthed<any>(
          "/api/mark-in-person-scan-completed",
          { scanId: scanIdSafe, reference },
          accessToken
        );

        if (!creditAttempt.ok || creditAttempt.status === 402) {
          saveProgress({
            ...(loadProgress() ?? {}),
            type: "in-person",
            scanId: scanIdSafe,
            step: `/scan/in-person/unlock/${scanIdSafe}`,
          });

          navigate(`/scan/in-person/unlock/${scanIdSafe}`, {
            replace: true,
          });
          return;
        }
        
window.dispatchEvent(new Event("carverity:credits-updated"));

        /* --------------------------------------------------
           Deterministic analysis (always safe to run)
           NOTE: analysis typing may still expect dataUrl -> cast boundary to any.
        -------------------------------------------------- */
        const latestProgress: any = loadProgress() ?? progress;

        const analysis = analyseInPersonInspection({
          ...(stripHeavyFields(latestProgress) ?? {}),
          scanId: scanIdSafe,
        } as any);

        /* --------------------------------------------------
           Persist scan (analysis)
        -------------------------------------------------- */
        const existingAny = (loadScanById(scanIdSafe) as any) ?? null;

        await saveScan({
          ...(existingAny ?? {}),
          id: scanIdSafe,
          type: "in-person",
          title: vehicleTitleFromProgress(latestProgress),
          createdAt: existingAny?.createdAt ?? new Date().toISOString(),
          vehicle: {
            year: latestProgress?.vehicleYear
              ? String(latestProgress.vehicleYear)
              : undefined,
            make: latestProgress?.vehicleMake,
            model: latestProgress?.vehicleModel,
            variant: latestProgress?.vehicleVariant,
          },
          thumbnail: existingAny?.thumbnail ?? null,
          askingPrice:
            typeof latestProgress?.askingPrice === "number"
              ? latestProgress.askingPrice
              : existingAny?.askingPrice ?? null,
          completed: true,
          analysis,
          progressSnapshot: latestProgress,
        } as any);

        /* --------------------------------------------------
           AI generation (idempotent)
        -------------------------------------------------- */
        await generateAIIfMissing({
          scanId: scanIdSafe,
          accessToken,
          progress: latestProgress,
          analysis,
        });

        saveProgress({
          ...(loadProgress() ?? {}),
          type: "in-person",
          scanId: scanIdSafe,
          step: "/scan/in-person/results",
        });

        await new Promise((r) => setTimeout(r, 600));

        if (!cancelled) {
          navigate(`/scan/in-person/results/${scanIdSafe}`, {
            replace: true,
          });
        }
      } catch (err) {
        console.error("[InPersonAnalyzing] failed:", err);
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
            We’re analysing what you recorded and preparing a buyer-safe
            explanation.
          </p>
        </div>

        <p className="text-xs text-slate-500">This usually takes around 10 seconds.</p>
      </div>
    </div>
  );
}
