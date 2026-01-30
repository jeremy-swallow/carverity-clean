import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadProgress, saveProgress } from "../utils/scanProgress";
import { saveScan } from "../utils/scanStorage";
import { supabase } from "../supabaseClient";
import { normaliseInPersonAI, fallbackInPersonAI } from "../utils/inPersonAI";

/* =========================================================
   Helpers
========================================================= */

function vehicleTitleFromProgress(p: any): string {
  const year = p?.vehicleYear ?? "";
  const make = p?.vehicleMake ?? "";
  const model = p?.vehicleModel ?? "";
  const parts = [year, make, model].filter(Boolean);
  return parts.length ? parts.join(" ") : "In-person inspection";
}

function creditReferenceForScan(scanId: string) {
  return `scan:${scanId}`;
}

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

  return p;
}

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

/* =========================================================
   Page
========================================================= */

export default function InPersonAnalyzing() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId?: string }>();

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

        // ALWAYS attempt to spend 1 credit
        const attempt = await postJsonAuthed<any>(
          "/api/mark-in-person-scan-completed",
          { scanId: scanIdSafe, reference },
          accessToken
        );

        if (!attempt.ok || attempt.status === 402) {
          saveProgress({
            ...(loadProgress() ?? {}),
            type: "in-person",
            scanId: scanIdSafe,
            step: `/scan/in-person/unlock/${scanIdSafe}`,
          });

          navigate(`/scan/in-person/unlock/${scanIdSafe}`, { replace: true });
          return;
        }

        const latestProgress: any = loadProgress() ?? progress;

        // TS note:
        // analyseInPersonInspection's type may still expect legacy photo shapes (dataUrl).
        // Runtime is fine — pass as any to avoid type mismatch.
        const analysis: any = analyseInPersonInspection({
          ...(latestProgress as any),
          scanId: scanIdSafe,
        } as any);

        const aiResp = await postJsonAuthed<any>(
          "/api/analyze-in-person",
          {
            scanId: scanIdSafe,
            progress: stripHeavyFields(latestProgress),
            analysis,
          },
          accessToken
        );

        const aiInterpretation =
          normaliseInPersonAI(aiResp.json?.ai) ?? fallbackInPersonAI(analysis);

        saveScan({
          id: scanIdSafe,
          type: "in-person",
          title: vehicleTitleFromProgress(latestProgress),
          createdAt: new Date().toISOString(),
          completed: true,
          analysis,
          progressSnapshot: latestProgress,
          aiInterpretation,
        } as any);

        saveProgress({
          ...(loadProgress() ?? {}),
          type: "in-person",
          scanId: scanIdSafe,
          step: "/scan/in-person/summary",
        });

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
          <h1 className="text-xl font-semibold">
            We couldn’t generate the report
          </h1>
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
