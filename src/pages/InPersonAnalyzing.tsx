// src/pages/InPersonAnalyzing.tsx

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

async function hasUnlockForScan(scanId: string): Promise<boolean> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.warn("[Analyzing] getUser error:", userError.message);
  }

  if (!user) return false;

  const reference = `scan:${scanId}`;

  const { data, error } = await supabase
    .from("credit_ledger")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_type", "in_person_scan_completed")
    .eq("reference", reference)
    .limit(1);

  if (error) {
    console.error("[Analyzing] Unlock check failed:", error);
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

/**
 * Remove heavy fields (like base64 photo data) before sending to API.
 * This keeps request sizes safe and avoids slow / failed requests.
 */
function stripHeavyFields(progress: any) {
  const p = { ...(progress ?? {}) };

  if (Array.isArray(p.photos)) {
    p.photos = p.photos.map((ph: any) => ({
      id: ph?.id,
      stepId: ph?.stepId,
      // DO NOT send dataUrl
    }));
  }

  if (Array.isArray(p.followUpPhotos)) {
    p.followUpPhotos = p.followUpPhotos.map((ph: any) => ({
      id: ph?.id,
      stepId: ph?.stepId,
      note: ph?.note,
      // DO NOT send dataUrl
    }));
  }

  return p;
}

async function postJson<T>(url: string, body: any): Promise<{ ok: boolean; status: number; json: T | null }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });

    const status = res.status;

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    return { ok: res.ok, status, json };
  } catch (err) {
    console.error("[Analyzing] postJson failed:", url, err);
    return { ok: false, status: 0, json: null };
  }
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

        // Persist scan identity + "current step" so resume works during analyzing
        saveProgress({
          ...(progress ?? {}),
          type: "in-person",
          scanId: scanIdSafe,
          step: `/scan/in-person/analyzing/${scanIdSafe}`,
        });

        // Auth required
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/signin", { replace: true });
          return;
        }

        // 1) If already unlocked, proceed.
        // 2) If not unlocked, attempt to consume 1 credit (server-side) and create unlock ledger entry.
        //    If insufficient credits, route to unlock page.
        const alreadyUnlocked = await hasUnlockForScan(scanIdSafe);

        if (!alreadyUnlocked) {
          const attempt = await postJson<any>("/api/mark-in-person-scan-completed", {
            scanId: scanIdSafe,
          });

          // If server says no / insufficient, route to unlock
          const explicitInsufficient =
            (attempt.json as any)?.error === "insufficient_credits" ||
            (attempt.json as any)?.error === "not_enough_credits" ||
            (attempt.json as any)?.code === "insufficient_credits";

          if (!attempt.ok || explicitInsufficient || attempt.status === 402 || attempt.status === 403) {
            saveProgress({
              ...(loadProgress() ?? {}),
              type: "in-person",
              scanId: scanIdSafe,
              step: `/scan/in-person/unlock/${scanIdSafe}`,
            });

            navigate(`/scan/in-person/unlock/${scanIdSafe}`, { replace: true });
            return;
          }
        }

        const latestProgress: any = loadProgress() ?? progress;

        // Generate analysis (pure function)
        const analysis = analyseInPersonInspection({
          ...(latestProgress ?? {}),
          scanId: scanIdSafe,
        });

        const concernsCount = Array.isArray((analysis as any)?.risks)
          ? (analysis as any).risks.filter((r: any) => r?.severity !== "info").length
          : 0;

        const unsureCount = Array.isArray((analysis as any)?.uncertaintyFactors)
          ? (analysis as any).uncertaintyFactors.length
          : 0;

        const imperfectionsCount = Array.isArray(latestProgress?.imperfections)
          ? latestProgress.imperfections.length
          : 0;

        const photosCount = Array.isArray(latestProgress?.photos)
          ? latestProgress.photos.length
          : 0;

        // Call Gemini interpretation for in-person scan (adds paid value)
        // Send a stripped snapshot to avoid base64 payloads
        const aiRequest = {
          scanId: scanIdSafe,
          progress: stripHeavyFields(latestProgress),
          analysis,
          summary: {
            concernsCount,
            unsureCount,
            imperfectionsCount,
            photosCount,
          },
        };

        const aiResp = await postJson<any>("/api/analyze-in-person", aiRequest);

        const aiInterpretation = aiResp.ok ? (aiResp.json as any)?.ai : null;

        // IMPORTANT:
        // DO NOT store base64 images in localStorage (quota will be exceeded).
        // Thumbnail must be null unless you generate a tiny compressed one.
        saveScan({
          id: scanIdSafe,
          type: "in-person",
          title: vehicleTitleFromProgress(latestProgress),
          createdAt: new Date().toISOString(),
          vehicle: {
            year: latestProgress?.vehicleYear ? String(latestProgress.vehicleYear) : undefined,
            make: latestProgress?.vehicleMake,
            model: latestProgress?.vehicleModel,
            variant: latestProgress?.vehicleVariant,
          },
          thumbnail: null,
          askingPrice: typeof latestProgress?.askingPrice === "number" ? latestProgress.askingPrice : null,
          score: typeof (analysis as any)?.confidenceScore === "number" ? (analysis as any).confidenceScore : null,
          concerns: concernsCount,
          unsure: unsureCount,
          imperfectionsCount,
          photosCount,
          fromOnlineScan: Boolean(latestProgress?.fromOnlineScan),
          completed: true,
          history: [
            {
              at: new Date().toISOString(),
              event: "report_generated",
            },
            ...(aiInterpretation
              ? [
                  {
                    at: new Date().toISOString(),
                    event: "ai_interpretation_generated",
                  },
                ]
              : []),
          ],
          analysis,
          progressSnapshot: latestProgress,

          // Additive only: new field to power richer results page
          // (safe even if UI doesn't render it yet)
          aiInterpretation,
        } as any);

        // IMPORTANT:
        // Do NOT set resume step to results.
        // Resume should take the user back to summary (or last meaningful step).
        saveProgress({
          ...(loadProgress() ?? {}),
          type: "in-person",
          scanId: scanIdSafe,
          step: "/scan/in-person/summary",
        });

        // Short delay so it feels deliberate
        await new Promise((r) => setTimeout(r, 900));

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
            Your inspection data is safe. Please return to the summary and try again.
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
            We’re weighing observations, uncertainty, and risk signals to prepare your buyer-safe report.
          </p>
        </div>

        <p className="text-xs text-slate-500">This usually takes around 10 seconds.</p>
      </div>
    </div>
  );
}
