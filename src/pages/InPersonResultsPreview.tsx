// src/pages/InPersonResultsPreview.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import { isScanUnlocked } from "../utils/scanUnlock";

export default function InPersonResultsPreview() {
  const navigate = useNavigate();
  const progress: any = loadProgress();
  const scanId: string | undefined = progress?.scanId;

  /* -------------------------------------------------------
     Guard & redirect logic (must run in effects)
  ------------------------------------------------------- */
  useEffect(() => {
    if (!scanId) {
      navigate("/scan/in-person/start", { replace: true });
      return;
    }

    if (isScanUnlocked(scanId)) {
      navigate(
        `/scan/in-person/analyzing?scanId=${encodeURIComponent(scanId)}`,
        { replace: true }
      );
    }
  }, [scanId, navigate]);

  if (!scanId || isScanUnlocked(scanId)) {
    return null;
  }

  /* -------------------------------------------------------
     Preview data
  ------------------------------------------------------- */
  const photos = progress.photos?.length ?? 0;
  const checks = Object.values(progress.checks ?? {}).filter(Boolean).length;

  const confidenceLabel =
    photos >= 4 && checks >= 5 ? "High" : photos >= 3 ? "Medium" : "Low";

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan — Preview
      </span>

      <h1 className="text-2xl font-semibold text-white">
        Inspection completed
      </h1>

      <section className="rounded-2xl bg-slate-900/70 border border-white/10 px-6 py-5 space-y-3">
        <p className="text-sm text-slate-300">
          Your inspection is ready. Here’s a brief preview.
        </p>

        <div className="flex gap-10">
          <div>
            <p className="text-[11px] uppercase text-slate-400">
              Evidence captured
            </p>
            <p className="text-lg font-semibold text-white">
              {photos} photos · {checks} checks
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase text-slate-400">
              Confidence (preview)
            </p>
            <p className="text-lg font-semibold text-white">
              {confidenceLabel}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Full verdict, risk signals, pricing context, and negotiation guidance
          are available after unlock.
        </p>
      </section>

      <button
        onClick={() =>
          navigate(
            `/scan/in-person/unlock?scanId=${encodeURIComponent(scanId)}`
          )
        }
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-3"
      >
        Unlock full report
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        No analysis or paid computation runs until you unlock.
      </p>
    </div>
  );
}
