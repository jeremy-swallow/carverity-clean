// src/pages/InPersonChecksIntro.tsx

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Timer,
  Hand,
  Sparkles,
  Camera,
  AlertTriangle,
  Eye,
  HeartPulse,
  Info,
} from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type StepCard = {
  key: string;
  label: string;
  blurb: string;
  time: string;
  icon: React.ElementType;
};

export default function InPersonChecksIntro() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const steps = useMemo(
    () => [
      { key: "around", label: "Around" },
      { key: "inside", label: "Inside" },
      { key: "drive", label: "Drive" },
    ],
    []
  );

  const currentIndex = 0;
  const percent = Math.round(((currentIndex + 1) / steps.length) * 100);

  const stepCards: StepCard[] = useMemo(
    () => [
      {
        key: "around",
        label: "Around",
        blurb:
          "Quick exterior signals. We’re not chasing perfection — we’re looking for red flags.",
        time: "~2 min",
        icon: Eye,
      },
      {
        key: "inside",
        label: "Inside",
        blurb:
          "Cabin condition and moisture cues. Fast checks that catch expensive surprises.",
        time: "~2 min",
        icon: HeartPulse,
      },
      {
        key: "drive",
        label: "Drive",
        blurb:
          "Only if allowed. A short drive to notice warning lights, noises, steering feel.",
        time: "~3–5 min",
        icon: Timer,
      },
    ],
    []
  );

  useEffect(() => {
    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white">
              Quick checks (guided)
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              This takes{" "}
              <span className="text-slate-200 font-medium">under 5 minutes</span>
              . Tap answers, capture only what matters, and we’ll turn it into a{" "}
              <span className="text-slate-200 font-medium">
                calm buyer report
              </span>
              .
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-4 py-3 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-slate-300 mt-0.5" />
          <p className="text-sm text-slate-300 leading-relaxed">
            You don’t need to be a car expert. If something feels off, mark it —
            we’ll translate it into clear “what it means” guidance later.
          </p>
        </div>
      </div>

      {/* 3 step cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stepCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="rounded-2xl border border-white/12 bg-slate-900/60 px-4 py-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Step {idx + 1}
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {card.label}
                  </div>
                </div>

                <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-slate-200" />
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {card.blurb}
              </p>

              <div className="inline-flex items-center gap-2 text-xs text-slate-300 pt-1">
                <Timer className="h-3.5 w-3.5 text-slate-400" />
                {card.time}
              </div>
            </div>
          );
        })}
      </section>

      {/* Core values / guardrails */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/60 px-5 py-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-200">
          <Hand className="h-4 w-4 text-slate-300" />
          <h2 className="text-sm font-semibold">What we do (and don’t do)</h2>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5" />
            <p className="leading-relaxed">
              We only use what{" "}
              <span className="text-slate-100 font-medium">you recorded</span>.
              No guessing. No “magic”.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5" />
            <p className="leading-relaxed">
              Unknown items stay{" "}
              <span className="text-slate-100 font-medium">unknown</span> — they
              don’t automatically become “bad”.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Camera className="h-4 w-4 text-slate-300 mt-0.5" />
            <p className="leading-relaxed">
              Photos help you remember what you saw and keep the report aligned
              to your inspection.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-300 mt-0.5" />
            <p className="leading-relaxed">
              This is guidance — not a valuation, not a mechanical inspection,
              and not repair-cost estimates.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-slate-300 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              No underbody inspection required. We keep this realistic for
              normal buyers at a yard.
            </p>
          </div>
        </div>
      </section>

      {/* Low typing promise */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/60 px-5 py-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-200">
          <Sparkles className="h-4 w-4 text-slate-300" />
          <h2 className="text-sm font-semibold">Low typing by design</h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          Most users finish this without typing anything. If something stands
          out, tap a quick chip (like “Uneven wear” or “Warning light”) and move
          on.
        </p>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-slate-400 leading-relaxed">
            Tip: if you’re not sure, choose{" "}
            <span className="text-slate-200 font-medium">Couldn’t check</span>{" "}
            and keep going.
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex-1 rounded-xl border border-white/25 px-4 py-3 text-slate-200"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => navigate("/scan/in-person/checks/around")}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 inline-flex items-center justify-center gap-2"
        >
          Start checks
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
