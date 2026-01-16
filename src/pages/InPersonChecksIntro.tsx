// src/pages/InPersonChecksIntro.tsx

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  Timer,
  Sparkles,
} from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

export default function InPersonChecksIntro() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const scanId = useMemo(() => {
    return progress?.scanId || "";
  }, [progress]);

  useEffect(() => {
    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-5 w-5 text-slate-400" />
          <h1 className="text-2xl font-semibold text-white">Checks</h1>
        </div>

        <p className="text-sm text-slate-400 max-w-2xl">
          You’ll do a quick, buyer-safe walkaround in three short sections.
          Tap answers first — only add notes when something matters.
        </p>

        {scanId && (
          <p className="text-xs text-slate-500">
            Scan ID: <span className="text-slate-300">{scanId}</span>
          </p>
        )}
      </header>

      <section className="rounded-2xl border border-white/12 bg-slate-900/60 px-6 py-6 space-y-5">
        <div className="grid gap-4">
          <div className="flex items-start gap-3">
            <Timer className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Takes ~3–5 minutes
              </p>
              <p className="text-sm text-slate-400">
                Designed to be calm and fast at the car yard.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Buyer-safe logic
              </p>
              <p className="text-sm text-slate-400">
                We treat missing info as “not recorded”, not as automatic risk.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-slate-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Minimal typing
              </p>
              <p className="text-sm text-slate-400">
                Use quick-tap options and note chips if something stands out.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate("/scan/in-person/photos")}
          className="flex-1 rounded-xl border border-white/25 px-4 py-3 text-slate-200"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => navigate("/scan/in-person/checks/around")}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-3 font-semibold text-black"
        >
          Start checks
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
