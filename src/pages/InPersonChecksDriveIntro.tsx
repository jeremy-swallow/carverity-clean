// src/pages/InPersonChecksDriveIntro.tsx

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Car,
  ShieldCheck,
  AlertTriangle,
  Timer,
  Info,
  RotateCcw,
  Eye,
  Sparkles,
  ArrowRight,
  CircleHelp,
  CheckCircle2,
  Gauge,
} from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

const DRIVE_CHECK_IDS = [
  "steering",
  "noise-hesitation",
  "braking",
  "adas-systems",
] as const;

function removeDriveChecksFromProgress(progress: any) {
  const nextChecks = { ...(progress?.checks ?? {}) };

  for (const id of DRIVE_CHECK_IDS) {
    if (nextChecks[id]) {
      delete nextChecks[id];
    }
  }

  const nextImperfections = Array.isArray(progress?.imperfections)
    ? progress.imperfections.filter((imp: any) => {
        const id = String(imp?.id ?? "");
        const loc = String(imp?.location ?? "").toLowerCase();

        if (id.startsWith("imp:steering")) return false;
        if (id.startsWith("imp:noise-hesitation")) return false;
        if (id.startsWith("imp:braking")) return false;
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

  const existingDriveAnswers = useMemo(() => {
    const checks = progress?.checks ?? {};
    return DRIVE_CHECK_IDS.some((id) => {
      const a = checks?.[id];
      return Boolean(a?.value || (a?.note ?? "").trim().length > 0);
    });
  }, [progress]);

  const driveIntroTone = useMemo(() => {
    if (existingDriveAnswers) {
      return {
        pill:
          "bg-sky-500/10 text-sky-200 border-sky-500/20",
        icon: "text-sky-300",
        card: "border-sky-500/20 bg-sky-500/8",
        title: "You can resume the drive check calmly",
        body:
          "You already recorded some drive impressions. You can continue from where you left off, or clear them and re-check the car if you want a fresh read.",
      };
    }

    return {
      pill:
        "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
      icon: "text-emerald-300",
      card: "border-emerald-500/20 bg-emerald-500/8",
      title: "This step is about confidence, not perfection",
      body:
        "You are not trying to prove the car is flawless. You are simply using a normal drive to notice whether anything feels reassuring, questionable, or worth slowing down for.",
    };
  }, [existingDriveAnswers]);

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

      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Car className="h-5 w-5 text-emerald-300" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-white">
              Test drive briefing
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
              This part of CarVerity is designed to help you use a normal drive
              to pick up decision signals without turning the experience into a
              stressful checklist.
            </p>
          </div>
        </div>

        <section
          className={[
            "rounded-3xl border px-5 py-5",
            driveIntroTone.card,
          ].join(" ")}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-[220px] flex-1">
              <div
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                  driveIntroTone.pill,
                ].join(" ")}
              >
                <Sparkles className={["h-4 w-4", driveIntroTone.icon].join(" ")} />
                Guided approach
              </div>

              <h2 className="mt-4 text-xl font-semibold text-white">
                {driveIntroTone.title}
              </h2>

              <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
                {driveIntroTone.body}
              </p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
                <p className="text-sm text-slate-200 leading-relaxed">
                  CarVerity only works from what you actually notice and record.
                  If something is unclear, it stays unclear. If you cannot test
                  something properly, it stays unassessed.
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[220px] rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                What this step covers
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <Gauge className="h-4 w-4 text-slate-400 mt-0.5" />
                  <span>Steering feel and response</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-slate-400 mt-0.5" />
                  <span>Noises, hesitation or odd behaviour</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-400 mt-0.5" />
                  <span>Braking feel and stability</span>
                </div>
                <div className="flex items-start gap-2">
                  <CircleHelp className="h-4 w-4 text-slate-400 mt-0.5" />
                  <span>Driver-assist alerts if fitted</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/12 bg-slate-900/50 px-5 py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-slate-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">
                The mindset for this drive
              </p>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Keep it practical. You are not trying to diagnose the whole car.
                You are simply noticing whether anything feels normal,
                reassuring, questionable, or uncomfortable enough to slow down
                the buying decision.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/12 bg-slate-900/60 px-5 py-4 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-emerald-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">
                Safety first
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                If anything feels unsafe, rushed, or pressured, stop. You do not
                owe anyone a test drive, and you do not need to “push through”
                discomfort just to finish this step.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Timer className="h-4 w-4 text-slate-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">
                Drive normally, not aggressively
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                You do not need to test the car hard. A normal drive is enough
                to notice whether steering feels settled, braking feels
                predictable, the car responds smoothly, and anything odd shows
                up once it has had a moment to warm up.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-slate-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">
                You can notice first and answer after
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                CarVerity asks the questions after the drive so you can focus on
                how the car feels in the moment instead of mentally ticking
                boxes while driving.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/12 bg-slate-950/40 px-5 py-4 space-y-4">
          <div className="flex items-start gap-3">
            <Eye className="h-4 w-4 text-slate-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">
                What to pay attention to during the drive
              </p>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                You do not need to remember everything perfectly. Just notice
                what stands out and what would make you pause.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">
                Pulling away & low speed
              </p>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Notice steering feel, slow turns, hesitation, warning lights, or
                anything that feels awkward right from the start.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">
                Acceleration & cruising
              </p>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Watch for smoothness, unusual noise, vibration, flat response,
                or anything that makes the car feel unsettled at steady speed.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">Braking</p>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Braking should feel predictable and controlled. Pay attention to
                pulling, grinding, shuddering, strong vibration, or a strange
                pedal feel.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">
                Driver assistance & alerts
              </p>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                If the car has assistance systems fitted, notice unexpected
                warnings, odd alerts, or anything that behaves in a way that
                does not feel settled or trustworthy.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              Buyer-safe reminder: this step is about capturing what you noticed,
              not proving you drove the “right” way or remembered every detail.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 space-y-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-300 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                If you cannot test drive it
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                If the seller will not allow a drive, or it is not possible
                today, that does not automatically prove something is wrong. It
                does mean an important part of the picture stays unresolved.
              </p>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                CarVerity will treat that as an unknown to clarify before you
                commit — not as a hidden fault and not as reassurance.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-slate-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">
                How this protects you
              </p>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                CarVerity does not fill gaps with optimistic assumptions. If you
                cannot drive it, or something stays unclear, the app keeps that
                uncertainty visible so it does not get mistaken for a positive.
              </p>
            </div>
          </div>
        </section>

        {existingDriveAnswers && (
          <section className="rounded-2xl border border-sky-500/20 bg-sky-500/8 px-5 py-4 space-y-4">
            <div className="flex items-start gap-3">
              <RotateCcw className="h-4 w-4 text-sky-300 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  You already have drive notes saved
                </p>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                  Continue where you left off if those notes still reflect this
                  car. If you are re-driving it and want a clean read, you can
                  start over and clear the previous drive entries first.
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
          </section>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate("/scan/in-person/checks/inside")}
          className="flex-1 rounded-xl border border-white/25 px-4 py-3 text-slate-200 hover:bg-slate-900/40"
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
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 inline-flex items-center justify-center gap-2"
        >
          Start the drive
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}