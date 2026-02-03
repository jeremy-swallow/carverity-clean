import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Camera,
  ClipboardCheck,
} from "lucide-react";
import { loadProgress, startFreshProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

export default function InPersonStart() {
  const navigate = useNavigate();

  /**
   * Load any existing progress ONCE.
   * This represents an in-progress or completed scan.
   */
  const existing: any = useMemo(() => loadProgress() ?? {}, []);

  const hasExistingScan = Boolean(existing?.scanId && existing?.step);

  function handleStart() {
    /**
     * SAFETY RULE:
     * If a scan already exists, DO NOT wipe it.
     * Starting fresh should only happen when there is no progress at all.
     */
    if (hasExistingScan) {
      // Resume instead of destroying data
      handleResume();
      return;
    }

    const scanId = generateScanId();

    startFreshProgress("in-person", "/scan/in-person/sale", scanId);

    navigate("/scan/in-person/sale");
  }

  function handleResume() {
    const step = typeof existing?.step === "string" ? existing.step : "";

    if (step && step.startsWith("/scan/in-person/")) {
      navigate(step);
      return;
    }

    // Fallback: resume at sale context if step is missing/corrupt
    navigate("/scan/in-person/sale");
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-14 space-y-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          In-person scan
        </p>

        <h1 className="text-3xl md:text-4xl font-semibold text-white">
          Inspect a car with calm guidance
        </h1>

        <p className="text-slate-400 leading-relaxed max-w-2xl">
          CarVerity helps you record what you actually observe, then converts it
          into a buyer-safe report with reasoning and next steps — without hype,
          scripts, or pressure.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-300 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">
              Designed for real car yards
            </p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              The flow is fast, step-by-step, and built to reduce buyer regret.
              It doesn’t diagnose faults — it helps you make a clear decision.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Camera className="h-4 w-4" />
              <p className="text-sm font-semibold text-white">Evidence</p>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Optional photos to support what you recorded.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 text-slate-300">
              <ClipboardCheck className="h-4 w-4" />
              <p className="text-sm font-semibold text-white">Checks</p>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Mark what looks fine, what concerns you, and what you’re unsure
              about.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-sm font-semibold text-white">Report</p>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Clear reasoning, follow-ups, and buyer-safe decision guidance.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-3">
        {hasExistingScan && (
          <button
            onClick={handleResume}
            className="flex-1 rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-5 py-3 text-slate-200"
          >
            Resume scan
          </button>
        )}

        <button
          onClick={handleStart}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 font-semibold text-black inline-flex items-center justify-center gap-2"
        >
          {hasExistingScan ? "Continue scan" : "Start in-person scan"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <p className="text-[11px] text-slate-500 text-center">
        CarVerity helps you document observations — it does not diagnose
        mechanical faults.
      </p>
    </div>
  );
}
