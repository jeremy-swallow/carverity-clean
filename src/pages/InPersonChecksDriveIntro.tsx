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
} from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

const DRIVE_CHECK_IDS = ["steering", "noise-hesitation", "adas-systems"];

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
    // ✅ IMPORTANT:
    // User may have previously tapped "Couldn't check" in Drive checks,
    // then changed their mind and came back here.
    // When they now proceed, we want a clean slate (no highlighted buttons).
    const nextChecks = { ...(progress?.checks ?? {}) };

    for (const id of DRIVE_CHECK_IDS) {
      if (nextChecks[id]) {
        delete nextChecks[id];
      }
    }

    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks/drive",
      checks: nextChecks,
    });

    navigate("/scan/in-person/checks/drive");
  }

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

        <div className="text-xs text-slate-500">
          Step 3 of 3 — Drive (optional)
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Car className="h-5 w-5 text-emerald-300" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white">
              Drive check (optional)
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Only do this if the seller allows it and it feels safe. This step
              is about spotting{" "}
              <span className="text-slate-200 font-medium">
                big decision signals
              </span>{" "}
              — not chasing perfection.
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
                You’re listening for warning lights, harsh shifts, steering pull,
                braking feel, and any “something isn’t right” sensation.
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
                lights, and no obvious clunks/knocks.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 space-y-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-300 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                If the seller won’t allow a drive
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                That’s not automatically “bad”, but it becomes an unknown. Mark
                “Couldn’t check” on the drive items and continue.
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
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate("/scan/in-person/checks/inside")}
          className="flex-1 rounded-xl border border-white/25 px-4 py-3 text-slate-200"
        >
          Back to inside checks
        </button>

        <button
          type="button"
          onClick={startDriveChecks}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
        >
          Start drive checks
        </button>
      </div>
    </div>
  );
}
