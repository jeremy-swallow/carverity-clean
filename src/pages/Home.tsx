// src/pages/Home.tsx

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  Sparkles,
  Camera,
  Timer,
  BadgeCheck,
} from "lucide-react";
import {
  loadProgress,
  clearProgress,
  saveProgress,
} from "../utils/scanProgress";
import { supabase } from "../supabaseClient";

function normaliseResumeTarget(
  step: string | null,
  progress: any
): string | null {
  if (!step) return null;

  const s = String(step).trim();
  if (!s) return null;

  // If stored step is already a full route, use it
  if (s.startsWith("/")) return s;

  // If older code stored a keyword step, map it safely
  const scanId: string | null = progress?.scanId
    ? String(progress.scanId)
    : null;

  if (s === "unlock" && scanId) return `/scan/in-person/unlock/${scanId}`;
  if (s === "analyzing" && scanId) return `/scan/in-person/analyzing/${scanId}`;
  if (s === "summary") return "/scan/in-person/summary";
  if (s === "start") return "/scan/in-person/start";

  // Unknown
  return null;
}

function isSafeResumeRoute(route: string): boolean {
  const allowedPrefixes = [
    "/scan/in-person/start",
    "/scan/in-person/vehicle-details",
    "/scan/in-person/asking-price",
    "/scan/in-person/photos",
    "/scan/in-person/owners",
    "/scan/in-person/checks/intro",
    "/scan/in-person/checks/around",
    "/scan/in-person/checks/inside",
    "/scan/in-person/checks/drive-intro",
    "/scan/in-person/checks/drive",
    "/scan/in-person/summary",
    "/scan/in-person/unlock/",
    "/scan/in-person/analyzing/",
    "/scan/in-person/results/",
    "/scan/in-person/decision",
    "/scan/in-person/price-positioning/",
    "/scan/in-person/print",
  ];

  return allowedPrefixes.some((p) => route.startsWith(p));
}

export default function Home() {
  const navigate = useNavigate();

  const [resumeStep, setResumeStep] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Auth gate: Resume should only appear when signed in
  useEffect(() => {
    let cancelled = false;

    async function loadAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        setIsLoggedIn(Boolean(data.session));
      } catch {
        if (cancelled) return;
        setIsLoggedIn(false);
      } finally {
        if (cancelled) return;
        setAuthReady(true);
      }
    }

    loadAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadAuth();
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Resume step loading (but we will only SHOW it when logged in)
  useEffect(() => {
    const progress: any = loadProgress();
    const rawStep = progress?.step ? String(progress.step) : "";

    if (!rawStep) {
      setResumeStep(null);
      return;
    }

    // If progress is pointing at an end-of-flow page, treat it as completed
    // and clear it once (not during render).
    const completedStepPrefixes = [
      "/scan/in-person/results",
      "/scan/in-person/print",
      "/scan/in-person/negotiation",
      "/scan/in-person/decision",
      "/scan/in-person/price-positioning",
      "/scan/online/results",
      "completed",
    ];

    const isCompleted = completedStepPrefixes.some((p) =>
      rawStep.startsWith(p)
    );

    if (isCompleted) {
      try {
        clearProgress();
      } catch {
        // ignore
      }
      setResumeStep(null);
      return;
    }

    const target = normaliseResumeTarget(rawStep, progress);

    if (!target || !isSafeResumeRoute(target)) {
      setResumeStep(null);
      return;
    }

    // Keep stored step in a route-safe format so resume never "flashes"
    if (rawStep !== target) {
      try {
        saveProgress({
          ...(progress ?? {}),
          step: target,
        });
      } catch {
        // ignore
      }
    }

    setResumeStep(target);
  }, []);

  const shouldShowResume = useMemo(() => {
    // IMPORTANT: Only show Resume when signed in
    if (!authReady) return false;
    if (!isLoggedIn) return false;
    return Boolean(resumeStep);
  }, [authReady, isLoggedIn, resumeStep]);

  function handleStartInPerson() {
    // USER REQUIREMENT:
    // Start scan must ALWAYS start clean unless user explicitly taps Resume.
    try {
      clearProgress();
    } catch {
      // ignore
    }

    navigate("/scan/in-person/start");
  }

  function resumeScan() {
    if (!resumeStep) return;

    // Safety: if somehow clicked while logged out, force sign-in
    if (!isLoggedIn) {
      try {
        const progress: any = loadProgress() ?? {};
        saveProgress({
          ...progress,
          step: resumeStep,
        });
      } catch {
        // ignore
      }
      navigate("/signin");
      return;
    }

    navigate(resumeStep);
  }

  return (
    <div className="text-white">
      {/* HERO */}
      <section className="relative w-full overflow-hidden border-b border-white/10">
        <img
          src="/photo-guides/hero.png"
          alt="Car interior dashboard"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/75 to-black/90" />

        {/* Subtle premium glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-20">
          <div className="max-w-xl md:max-w-2xl flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 w-fit">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <span className="text-[12px] text-slate-200">
                Buyer-safe in-person inspection
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
              Inspect a used car in person — with confidence.
            </h1>

            <p className="text-slate-200 text-[15px] leading-relaxed">
              CarVerity guides you step-by-step while you&apos;re standing next
              to the car, so you can spot visible issues, record evidence, and
              finish with a clear report and buyer-safe next steps.
            </p>

            <p className="text-slate-300 text-sm">
              No mechanic tools. No guesswork. Just what you can see, check, and
              confirm.
            </p>

            <div className="flex flex-wrap items-start gap-3 mt-1">
              <div className="flex flex-col gap-1">
                <button
                  onClick={handleStartInPerson}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-semibold transition"
                >
                  Start in-person inspection
                  <ArrowRight className="h-4 w-4" />
                </button>

                {/* NEW: reassurance under primary CTA */}
                <span className="text-[11px] text-slate-300">
                  No payment required to start.
                </span>
              </div>

              {shouldShowResume && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={resumeScan}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-semibold transition"
                  >
                    Resume inspection
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] text-slate-300">
                    Your progress is saved automatically.
                  </span>
                </div>
              )}
            </div>

            {/* BEST FOR */}
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-300 leading-relaxed">
              <span className="text-slate-400">
                Designed for real-world buying situations:
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-1">
                private sales
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-1">
                car yards
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-1">
                first-time buyers
              </span>
            </div>

            {/* HOW IT WORKS (premium strip) */}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                <div className="flex items-center gap-2 text-slate-200">
                  <ClipboardCheck className="h-4 w-4 text-slate-300" />
                  <p className="text-sm font-semibold">Guided scan</p>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Outside → cabin → test drive, with clear prompts that keep you
                  focused.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                <div className="flex items-center gap-2 text-slate-200">
                  <Camera className="h-4 w-4 text-slate-300" />
                  <p className="text-sm font-semibold">Evidence captured</p>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Notes + photos that create a clean record of what you actually
                  observed.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                <div className="flex items-center gap-2 text-slate-200">
                  <FileText className="h-4 w-4 text-slate-300" />
                  <p className="text-sm font-semibold">Buyer-ready report</p>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Priority findings, what to clarify, and next steps — based on
                  what you recorded.
                </p>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
              <Link
                to="/what-to-expect"
                className="text-slate-300 underline text-sm"
              >
                What to expect
              </Link>

              <Link to="/my-scans" className="text-slate-300 underline text-sm">
                View My Scans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* INFORMATION */}
      <section className="max-w-5xl mx-auto px-6 py-12 md:py-12 grid gap-6">
        {/* TRUST / WHO IT'S FOR */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold mb-2">
                Built for everyday buyers (not mechanics)
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                If you don’t buy cars often, it’s easy to miss small warning
                signs — or get pressured into a decision you’re not ready for.
                CarVerity is a guided flow that helps you slow down, stay
                organised, and focus on what actually matters.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <div>
                <div className="text-xs text-slate-200 font-semibold">
                  Premium feel
                </div>
                <div className="text-[11px] text-slate-400">
                  Structured, buyer-safe, step-by-step
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  No tools required
                </p>
              </div>
              <p className="text-slate-200 text-sm mt-2">
                You don’t need a jack, scanner, or mechanical knowledge.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  No underbody checks
                </p>
              </div>
              <p className="text-slate-200 text-sm mt-2">
                Everything is designed to be done standing normally around the
                car.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Buyer-safe wording
                </p>
              </div>
              <p className="text-slate-200 text-sm mt-2">
                Clear guidance without alarmist language or pressure.
              </p>
            </div>
          </div>
        </div>

        {/* WHAT YOU GET AT THE END */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold mb-2">
                What you get at the end
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                When you finish the inspection, CarVerity turns what you
                recorded into a clean, structured report — so you can decide
                what to do next with confidence.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 w-fit">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-slate-300" />
                <div>
                  <div className="text-xs text-slate-200 font-semibold">
                    Designed to feel “finished”
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Report → print → email (optional)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>
                <span className="font-semibold text-white">
                  Priority findings
                </span>{" "}
                (the biggest issues worth paying attention to)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>
                <span className="font-semibold text-white">
                  Items worth clarifying
                </span>{" "}
                (questions to ask before you commit)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>
                <span className="font-semibold text-white">Photo evidence</span>{" "}
                (what you captured during the scan)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>
                <span className="font-semibold text-white">
                  Negotiation advice
                </span>{" "}
                (kept separate from the report)
              </span>
            </li>
          </ul>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">Structured</p>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                The report is organised so you don’t miss the important bits.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">Buyer-safe</p>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Clear language that helps you clarify — not escalate.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <FileText className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">Shareable</p>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Print / save as PDF, and email it from your own device if you
                want.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleStartInPerson}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-semibold transition"
            >
              Start inspection
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link
              to="/what-to-expect"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 text-slate-200 font-semibold transition"
            >
              See what the scan includes
            </Link>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white">Already started?</h3>
            <p className="text-slate-300 text-sm mt-1">
              You can resume your in-progress inspection anytime.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {shouldShowResume && (
              <button
                onClick={resumeScan}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-semibold transition"
              >
                Resume inspection
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            <Link
              to="/my-scans"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 text-slate-200 font-semibold transition"
            >
              My scans
            </Link>
          </div>
        </div>

        {/* FOOTER NOTE */}
        <div className="text-xs text-slate-500 leading-relaxed">
          CarVerity helps you record what you can observe during an in-person
          inspection. It’s not a mechanical inspection or valuation — it’s a
          guided flow designed to reduce buyer regret and improve decision
          confidence.
        </div>
      </section>
    </div>
  );
}
