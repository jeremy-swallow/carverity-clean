// src/pages/InPersonChecksDriveIntro.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Car,
  ShieldCheck,
  AlertTriangle,
  Timer,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

function ensureDriveUnknowns(existingChecks: Record<string, any> | undefined) {
  const checks = { ...(existingChecks ?? {}) };

  const driveIds = ["steering", "noise-hesitation", "adas-systems"];

  for (const id of driveIds) {
    const cur = checks[id] as CheckAnswer | undefined;

    // If the user already answered something, do NOT overwrite it.
    if (cur?.value) continue;

    checks[id] = {
      value: "unsure",
      note: "No test drive allowed",
    } satisfies CheckAnswer;
  }

  return checks;
}

export default function InPersonChecksDriveIntro() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const [selected, setSelected] = useState<"yes" | "no" | null>(null);

  const steps = useMemo(
    () => [
      { key: "around", label: "Around" },
      { key: "inside", label: "Inside" },
      { key: "drive", label: "Drive" },
    ],
    []
  );

  const currentIndex = 2; // drive
  const percent = Math.round(((currentIndex + 1) / steps.length) * 100);

  useEffect(() => {
    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks/drive-intro",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseYes() {
    setSelected("yes");
    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks/drive-intro",
      driveAllowed: true,
    });
  }

  function chooseNo() {
    setSelected("no");
    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks/drive-intro",
      driveAllowed: false,
      checks: ensureDriveUnknowns(progress?.checks),
    });
  }

  function continueNext() {
    if (selected === "yes") {
      navigate("/scan/in-person/checks/drive");
      return;
    }

    if (selected === "no") {
      navigate("/scan/in-person/summary");
      return;
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      {/* Mini progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
          <span>Checks</span>
          <span>{percent}%</span>
        </div>

        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          {steps.map((s, i) => {
            const active = i === currentIndex;
            const done = i < currentIndex;
            return (
              <div
                key={s.key}
                className={[
                  "flex-1 text-center",
                  active ? "text-slate-200 font-medium" : "",
                  done ? "text-slate-300" : "",
                ].join(" ")}
              >
                {s.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-xs text-slate-500">Step 3 of 3 — Drive (optional)</div>
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
              This is a short, buyer-safe check for{" "}
              <span className="text-slate-200 font-medium">decision signals</span>
              . If you can’t drive it, we’ll keep it as unknown — no guessing.
            </p>
          </div>
        </div>

        {/* Choice cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={chooseYes}
            className={[
              "rounded-2xl border px-5 py-5 text-left transition",
              selected === "yes"
                ? "border-emerald-400/50 bg-emerald-500/10"
                : "border-white/12 bg-slate-900/60 hover:bg-slate-900/70",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  Yes — I can do a short drive
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We’ll guide you through 3 fast items. No typing needed.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={chooseNo}
            className={[
              "rounded-2xl border px-5 py-5 text-left transition",
              selected === "no"
                ? "border-amber-400/50 bg-amber-500/10"
                : "border-white/12 bg-slate-900/60 hover:bg-slate-900/70",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  No — no drive available
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We’ll mark the drive section as “Couldn’t check” and continue.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Calm guidance */}
        <div className="rounded-2xl border border-white/12 bg-slate-900/60 px-5 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-emerald-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">
                Safety first (non-negotiable)
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                If anything feels unsafe — stop. You don’t owe anyone a test drive.
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
                You’re listening for warning lights, harsh shifting, steering pull,
                braking feel, and any “something isn’t right” sensation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-slate-300 mt-0.5" />
            <p className="text-sm text-slate-400 leading-relaxed">
              CarVerity won’t fill gaps. Unknown stays unknown — and becomes a
              question to clarify, not a fault.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
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
          onClick={continueNext}
          disabled={!selected}
          className={[
            "flex-1 rounded-xl font-semibold px-4 py-3 inline-flex items-center justify-center gap-2 transition",
            selected
              ? "bg-emerald-500 hover:bg-emerald-400 text-black"
              : "bg-slate-700 text-slate-300 cursor-not-allowed",
          ].join(" ")}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
