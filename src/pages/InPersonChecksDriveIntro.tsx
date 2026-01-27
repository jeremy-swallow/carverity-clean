// src/pages/InPersonChecksDriveIntro.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Car,
  ShieldCheck,
  AlertTriangle,
  Timer,
  CheckCircle2,
  Info,
  RotateCcw,
} from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

const DRIVE_CHECK_IDS = ["steering", "noise-hesitation", "adas-systems"];

function removeDriveChecksFromProgress(progress: any) {
  const nextChecks = { ...(progress?.checks ?? {}) };

  for (const id of DRIVE_CHECK_IDS) {
    if (nextChecks[id]) {
      delete nextChecks[id];
    }
  }

  // Also remove drive-derived imperfections (so report doesn't keep stale drive findings)
  const nextImperfections = Array.isArray(progress?.imperfections)
    ? progress.imperfections.filter((imp: any) => {
        const id = String(imp?.id ?? "");
        const loc = String(imp?.location ?? "").toLowerCase();

        if (id.startsWith("imp:steering")) return false;
        if (id.startsWith("imp:noise-hesitation")) return false;
        if (id.startsWith("imp:adas-systems")) return false;
        if (loc.includes("during the drive")) return false;

        return true;
      })
    : progress?.imperfections;

  return {
    ...(progress ?? {}),
    checks: nextChecks,
    imperfections: nextImperfections,
  };
}

export default function InPersonChecksDriveIntro() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  useEffect(() => {
    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks/drive-intro",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startDriveChecks() {
    const latest: any = loadProgress();

    saveProgress({
      ...(latest ?? {}),
      step: "/scan/in-person/checks/drive",
    });

    navigate("/scan/in-person/checks/drive");
  }

  function startOverDriveChecks() {
    const latest: any = loadProgress();

    const cleaned = removeDriveChecksFromProgress(latest);

    saveProgress({
      ...cleaned,
      step: "/scan/in-person/checks/drive",
    });

    navigate("/scan/in-person/checks/drive");
  }

  function cantTestDriveRightNow() {
    const latest: any = loadProgress();

    saveProgress({
      ...(latest ?? {}),
      step: "/scan/in-person/summary",
    });

    navigate("/scan/in-person/summary");
  }

  const existingDriveAnswers = (() => {
    const checks = progress?.checks ?? {};
    return DRIVE_CHECK_IDS.some((id) => {
      const a = checks?.[id];
      return Boolean(a?.value || (a?.note ?? "").trim().length > 0);
    });
  })();

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-xs text-slate-500">Step 3 of 3 — Test drive</div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Car className="h-5 w-5 text-emerald-300" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white">
              Test drive check
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              If you’re serious about buying the car, a short test drive is{" "}
              <span className="text-slate-200 font-medium">
                highly recommended
              </span>
              . Only proceed if the seller allows it and it feels safe. This
              step is about spotting{" "}
              <span className="text-slate-200 font-medium">
                big decision signals
              </span>{" "}
              — how the car behaves while running, not chasing perfection.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/60 px-5 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-emerald-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">
                Safety first (non-negotiable)
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                If anything feels unsafe — stop. You don’t owe anyone a test
                drive.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Timer className="h-4 w-4 text-slate-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">
                Keep it short (2–5 minutes)
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                You’re watching for warning lights, listening for unusual
                noises, and noticing how the car responds once it’s fully
                running.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">
                What a “good” drive looks like
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                Smooth idle, normal steering, predictable braking, no warning
                lights, and nothing that feels inconsistent or unreliable in
                use.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 space-y-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-300 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                If you can’t test drive it
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                If the seller won’t allow a drive (or it’s not possible today),
                that doesn’t prove something is wrong — but it does leave an
                important unknown. CarVerity will treat it as something to
                clarify before you commit.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-slate-300 mt-0.5" />
            <p className="text-sm text-slate-400 leading-relaxed">
              CarVerity won’t “fill gaps”. If you can’t drive it, we keep it as
              unknown and treat it as a question — not a fault.
            </p>
          </div>
        </div>

        {existingDriveAnswers && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4 space-y-3">
            <div className="flex items-start gap-3">
              <RotateCcw className="h-4 w-4 text-slate-300 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  You already have drive notes saved
                </p>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                  If you’re re-checking the car, you can continue where you left
                  off — or start over if you want a clean slate.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={startOverDriveChecks}
              className="w-full rounded-xl border border-white/20 bg-slate-950/30 hover:bg-slate-900 px-4 py-3 text-slate-200 font-semibold inline-flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Start over (clear drive notes)
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate("/scan/in-person/checks/inside")}
          className="flex-1 rounded-xl border border-white/25 px-4 py-3 text-slate-200"
        >
          Back to inside checks
        </button>

        <button
          type="button"
          onClick={cantTestDriveRightNow}
          className="flex-1 rounded-xl border border-white/25 bg-slate-950/30 hover:bg-slate-900 px-4 py-3 text-slate-200"
        >
          Can’t test drive right now
        </button>

        <button
          type="button"
          onClick={startDriveChecks}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
        >
          Start test drive checks
        </button>
      </div>
    </div>
  );
}
