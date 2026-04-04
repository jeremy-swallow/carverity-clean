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
import { applySeo } from "../utils/seo";

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

  useEffect(() => {
    applySeo({
      title: "Used Car Inspection Checklist App Australia | CarVerity",
      description:
        "CarVerity is an Australian used car inspection checklist web app that guides you through an in-person vehicle check, helps you capture evidence, and turns your findings into a clear buyer-focused report.",
      canonical: "https://www.carverity.com.au/",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "CarVerity",
          url: "https://www.carverity.com.au/",
        },
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "CarVerity | Used Car Inspection Checklist App Australia",
          url: "https://www.carverity.com.au/",
          description:
            "Australian used car inspection checklist app that helps buyers inspect a car in person, capture evidence, and review a structured buyer-focused report.",
          inLanguage: "en-AU",
          isPartOf: {
            "@type": "WebSite",
            name: "CarVerity",
            url: "https://www.carverity.com.au/",
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "CarVerity",
          url: "https://www.carverity.com.au/",
          logo: "https://www.carverity.com.au/logo192.png",
          areaServed: "AU",
        },
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "CarVerity",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: "https://www.carverity.com.au/",
          areaServed: "AU",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "AUD",
          },
          description:
            "CarVerity is an Australian web app that guides buyers through a structured in-person used car inspection checklist and generates a clear, buyer-focused report.",
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is CarVerity?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "CarVerity is an Australian web app that guides buyers through a structured in-person used car inspection checklist and generates a clear, buyer-focused report.",
              },
            },
            {
              "@type": "Question",
              name: "Is CarVerity a mechanical inspection?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "No. CarVerity is not a mechanical inspection service. It helps you record visible observations during an in-person inspection and organise your findings into a structured report.",
              },
            },
            {
              "@type": "Question",
              name: "Do I need tools or mechanical knowledge?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "No tools or mechanical knowledge are required. The checklist is designed to be completed while standing normally around the vehicle.",
              },
            },
            {
              "@type": "Question",
              name: "Is CarVerity designed for Australian buyers?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. CarVerity is built for Australian used car buyers and reflects common real-world buying situations in Australia.",
              },
            },
            {
              "@type": "Question",
              name: "What should I check before buying a used car in Australia?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Start with a structured in-person checklist: inspect the exterior, cabin, and test drive, capture clear photos, and confirm key paperwork like a PPSR check before committing.",
              },
            },
            {
              "@type": "Question",
              name: "Should I do a PPSR check before buying a used car?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. A PPSR check can help you identify finance owing or certain recorded statuses before you buy, which reduces risk for Australian used car buyers.",
              },
            },
          ],
        },
      ],
    });
  }, []);

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

  useEffect(() => {
    const progress: any = loadProgress();
    const rawStep = progress?.step ? String(progress.step) : "";

    if (!rawStep) {
      setResumeStep(null);
      return;
    }

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
    if (!authReady) return false;
    if (!isLoggedIn) return false;
    return Boolean(resumeStep);
  }, [authReady, isLoggedIn, resumeStep]);

  function handleStartInPerson() {
    try {
      clearProgress();
    } catch {
      // ignore
    }

    navigate("/scan/in-person/start");
  }

  function resumeScan() {
    if (!resumeStep) return;

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
          alt="Used car inspection app interface and car interior dashboard for Australian buyers"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/75 to-black/90" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-24 md:py-20">
          <div className="flex max-w-xl flex-col gap-5 md:max-w-2xl">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <span className="text-[12px] text-slate-200">
                Buyer-safe in-person inspection
              </span>
            </div>

            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              Used car inspection checklist app for Australian buyers
            </h1>

            <p className="text-[12px] uppercase tracking-[0.18em] text-slate-400">
              Structured used car checks you can do in person without tools
            </p>

            <p className="text-[15px] leading-relaxed text-slate-200">
              CarVerity guides you step-by-step while you&apos;re standing next
              to the car — helping you assess what you can clearly see, capture
              evidence, and finish with a clean report so you can decide what to
              do next with confidence.
            </p>

            <p className="text-sm leading-relaxed text-slate-300">
              Designed for real-world Australian buying situations — from
              private driveway sales to licensed car yards across VIC, NSW, QLD
              and beyond.
            </p>

            <p className="text-sm text-slate-300">
              No mechanic tools. No crawling underneath the car. No guesswork.
              Just what you can see, check, and confirm.
            </p>

            <p className="text-sm leading-relaxed text-slate-300">
              If you&apos;re still working out{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-emerald-300 underline hover:text-emerald-200"
              >
                what to check when buying a used car in Australia
              </Link>
              , start with our full guide. For a simpler version you can keep on
              hand during an inspection, use the{" "}
              <Link
                to="/used-car-checklist-australia"
                className="text-emerald-300 underline hover:text-emerald-200"
              >
                used car checklist for Australia
              </Link>{" "}
              or the{" "}
              <Link
                to="/used-car-checklist-printable"
                className="text-emerald-300 underline hover:text-emerald-200"
              >
                printable used car checklist
              </Link>
              .
            </p>

            <p className="text-sm leading-relaxed text-slate-300">
              Want to understand the full flow before you begin?{" "}
              <Link
                to="/what-to-expect"
                className="text-emerald-300 underline hover:text-emerald-200"
              >
                See what to expect during an inspection
              </Link>
              , learn{" "}
              <Link
                to="/how-to-inspect-a-used-car-in-person"
                className="text-emerald-300 underline hover:text-emerald-200"
              >
                how to inspect a used car in person
              </Link>
              , and review{" "}
              <Link
                to="/how-to-test-drive-a-used-car-australia"
                className="text-emerald-300 underline hover:text-emerald-200"
              >
                how to test drive a used car in Australia
              </Link>
              .
            </p>

            <p className="text-sm leading-relaxed text-slate-300">
              Worried about high kilometres?{" "}
              <Link
                to="/how-many-km-is-too-many-used-car-australia"
                className="text-emerald-300 underline hover:text-emerald-200"
              >
                Read our guide on how many kilometres is too many for a used car
                in Australia
              </Link>
              .
            </p>

            <div className="mt-1 flex flex-wrap items-start gap-3">
              <div className="flex flex-col gap-1">
                <button
                  onClick={handleStartInPerson}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300"
                >
                  Start in-person inspection
                  <ArrowRight className="h-4 w-4" />
                </button>
                <span className="text-[11px] text-slate-300">
                  No payment required to start.
                </span>
              </div>

              {shouldShowResume && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={resumeScan}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-semibold text-black transition hover:bg-amber-300"
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

            <div className="flex flex-wrap items-center gap-2 text-[12px] leading-relaxed text-slate-300">
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

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                <div className="flex items-center gap-2 text-slate-200">
                  <ClipboardCheck className="h-4 w-4 text-slate-300" />
                  <p className="text-sm font-semibold">Guided scan</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  Outside → cabin → test drive, with clear prompts that keep you
                  focused.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                <div className="flex items-center gap-2 text-slate-200">
                  <Camera className="h-4 w-4 text-slate-300" />
                  <p className="text-sm font-semibold">Evidence captured</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  Notes and photos that create a clean record of what you
                  actually observed.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                <div className="flex items-center gap-2 text-slate-200">
                  <FileText className="h-4 w-4 text-slate-300" />
                  <p className="text-sm font-semibold">Buyer-ready report</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  Priority findings, what to clarify, and next steps based on
                  what you recorded.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
              <Link
                to="/what-to-expect"
                className="text-sm text-slate-300 underline"
              >
                What to expect
              </Link>

              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-sm text-slate-300 underline"
              >
                What to check when buying a used car
              </Link>

              <Link
                to="/used-car-checklist-australia"
                className="text-sm text-slate-300 underline"
              >
                Used car checklist (Australia)
              </Link>

              <Link
                to="/used-car-checklist-printable"
                className="text-sm text-slate-300 underline"
              >
                Printable checklist
              </Link>

              <Link
                to="/how-to-inspect-a-used-car-in-person"
                className="text-sm text-slate-300 underline"
              >
                How to inspect in person
              </Link>

              <Link
                to="/how-to-test-drive-a-used-car-australia"
                className="text-sm text-slate-300 underline"
              >
                Test drive guide
              </Link>

              <Link
                to="/ppsr-check-australia"
                className="text-sm text-slate-300 underline"
              >
                PPSR check
              </Link>

              <Link
                to="/how-many-km-is-too-many-used-car-australia"
                className="text-sm text-slate-300 underline"
              >
                High kilometre guide
              </Link>

              <Link to="/faq" className="text-sm text-slate-300 underline">
                FAQ
              </Link>

              <Link to="/about" className="text-sm text-slate-300 underline">
                About
              </Link>

              <Link to="/trust" className="text-sm text-slate-300 underline">
                Trust
              </Link>

              <Link to="/pricing" className="text-sm text-slate-300 underline">
                Pricing
              </Link>

              <Link
                to="/my-scans"
                className="text-sm text-slate-300 underline"
              >
                View My Scans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* INFORMATION */}
      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-12 md:py-12">
        {/* SEO HUB */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="mb-2 text-lg font-semibold">
            Used car buying guides for Australia
          </h2>

          <p className="text-sm leading-relaxed text-slate-300">
            If you&apos;re buying a used car in Australia, the best way to avoid
            regret is to slow down and follow a structured process. Start with
            our{" "}
            <Link
              to="/what-to-check-when-buying-a-used-car-australia"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              guide on what to check when buying a used car in Australia
            </Link>
            , then keep a simpler{" "}
            <Link
              to="/used-car-checklist-australia"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              used car checklist
            </Link>{" "}
            or{" "}
            <Link
              to="/used-car-checklist-printable"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              printable checklist
            </Link>{" "}
            ready for inspection day.
          </p>

          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Before you inspect, learn{" "}
            <Link
              to="/how-to-inspect-a-used-car-in-person"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              how to inspect a used car in person
            </Link>{" "}
            and{" "}
            <Link
              to="/how-to-test-drive-a-used-car-australia"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              how to test drive a used car in Australia
            </Link>
            . It also helps to avoid common{" "}
            <Link
              to="/used-car-inspection-mistakes-australia"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              used car inspection mistakes in Australia
            </Link>
            .
          </p>

          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Before committing, consider a{" "}
            <Link
              to="/ppsr-check-australia"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              PPSR check in Australia
            </Link>{" "}
            and decide whether{" "}
            <Link
              to="/is-a-mechanical-inspection-worth-it-australia"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              a mechanical inspection is worth it
            </Link>
            . If you are comparing sellers, read{" "}
            <Link
              to="/dealer-vs-private-seller-australia"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              dealer vs private seller in Australia
            </Link>
            , and if you are preparing an offer, see{" "}
            <Link
              to="/how-much-should-you-offer-used-car-australia"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              how much you should offer on a used car in Australia
            </Link>
            .
          </p>

          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            If odometer readings are making you hesitate, our{" "}
            <Link
              to="/how-many-km-is-too-many-used-car-australia"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              high-kilometre used car guide for Australia
            </Link>{" "}
            explains when kilometres matter, when they matter less, and how to
            judge value more clearly.
          </p>

          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Want to understand how CarVerity fits into that process?{" "}
            <Link
              to="/what-to-expect"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              See what to expect during a CarVerity inspection
            </Link>
            . For questions about how results, saved scans, and buyer-safe
            guidance work, read the{" "}
            <Link
              to="/faq"
              className="text-emerald-300 underline hover:text-emerald-200"
            >
              CarVerity FAQ
            </Link>
            .
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/what-to-check-when-buying-a-used-car-australia"
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:bg-slate-950/55"
            >
              <div className="flex items-center gap-2 text-slate-200">
                <ClipboardCheck className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">Full used car guide</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                The complete step-by-step guide for what to check before buying.
              </p>
            </Link>

            <Link
              to="/used-car-checklist-printable"
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:bg-slate-950/55"
            >
              <div className="flex items-center gap-2 text-slate-200">
                <ClipboardCheck className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">Printable checklist</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                A quick checklist you can save, print, or keep open on your
                phone.
              </p>
            </Link>

            <Link
              to="/how-to-test-drive-a-used-car-australia"
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:bg-slate-950/55"
            >
              <div className="flex items-center gap-2 text-slate-200">
                <Timer className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">Test drive guide</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                What to notice during a used car test drive in Australia.
              </p>
            </Link>

            <Link
              to="/ppsr-check-australia"
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:bg-slate-950/55"
            >
              <div className="flex items-center gap-2 text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">PPSR check guide</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Reduce risk by understanding what to confirm before you buy.
              </p>
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link
              to="/used-car-checklist-australia"
              className="text-slate-300 underline hover:text-white"
            >
              Used car checklist (Australia)
            </Link>
            <Link
              to="/used-car-checklist-printable"
              className="text-slate-300 underline hover:text-white"
            >
              Printable used car checklist
            </Link>
            <Link
              to="/how-to-inspect-a-used-car-in-person"
              className="text-slate-300 underline hover:text-white"
            >
              How to inspect a used car in person
            </Link>
            <Link
              to="/how-to-test-drive-a-used-car-australia"
              className="text-slate-300 underline hover:text-white"
            >
              How to test drive a used car
            </Link>
            <Link
              to="/used-car-inspection-mistakes-australia"
              className="text-slate-300 underline hover:text-white"
            >
              Used car inspection mistakes
            </Link>
            <Link
              to="/how-many-km-is-too-many-used-car-australia"
              className="text-slate-300 underline hover:text-white"
            >
              How many km is too many?
            </Link>
            <Link
              to="/is-a-mechanical-inspection-worth-it-australia"
              className="text-slate-300 underline hover:text-white"
            >
              Is a mechanical inspection worth it?
            </Link>
            <Link
              to="/dealer-vs-private-seller-australia"
              className="text-slate-300 underline hover:text-white"
            >
              Dealer vs private seller
            </Link>
            <Link
              to="/how-much-should-you-offer-used-car-australia"
              className="text-slate-300 underline hover:text-white"
            >
              How much should you offer?
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-950/30 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
            >
              View pricing
            </Link>

            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-950/30 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
            >
              About CarVerity
            </Link>

            <Link
              to="/trust"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-950/30 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
            >
              Trust
            </Link>

            <Link
              to="/terms"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-950/30 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
            >
              Terms
            </Link>

            <Link
              to="/privacy"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-950/30 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
            >
              Privacy
            </Link>
          </div>
        </div>

        {/* TRUST / WHO IT'S FOR */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="mb-2 text-lg font-semibold">
                Built for everyday buyers, not mechanics
              </h2>

              <p className="text-sm leading-relaxed text-slate-300">
                If you don&apos;t buy cars often, it&apos;s easy to miss small
                warning signs or get rushed into a decision you&apos;re not ready
                for. CarVerity is a guided inspection flow that helps you slow
                down, stay organised, and focus on what actually matters.
              </p>

              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                It is especially useful for first-time buyers, buyers comparing
                multiple cars on the same day, and anyone who wants a clearer
                structure during private sales or dealership inspections.
              </p>

              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Before you inspect, you can review our{" "}
                <Link
                  to="/what-to-check-when-buying-a-used-car-australia"
                  className="text-emerald-300 underline hover:text-emerald-200"
                >
                  step-by-step used car buying guide
                </Link>
                , use the{" "}
                <Link
                  to="/used-car-checklist-australia"
                  className="text-emerald-300 underline hover:text-emerald-200"
                >
                  used car checklist
                </Link>
                , or keep the{" "}
                <Link
                  to="/used-car-checklist-printable"
                  className="text-emerald-300 underline hover:text-emerald-200"
                >
                  printable checklist
                </Link>{" "}
                with you.
              </p>

              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Learn more about CarVerity&apos;s purpose and Australian business
                details on the{" "}
                <Link
                  to="/about"
                  className="text-emerald-300 underline hover:text-emerald-200"
                >
                  About page
                </Link>
                , browse our buyer-safe approach on{" "}
                <Link
                  to="/trust"
                  className="text-emerald-300 underline hover:text-emerald-200"
                >
                  Trust
                </Link>
                , or read common questions in the{" "}
                <Link
                  to="/faq"
                  className="text-emerald-300 underline hover:text-emerald-200"
                >
                  FAQ
                </Link>
                .
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 sm:flex">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <div>
                <div className="text-xs font-semibold text-slate-200">
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
              <p className="mt-2 text-sm text-slate-200">
                You do not need a scanner, a jack, or mechanical knowledge.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Standing-height checks
                </p>
              </div>
              <p className="mt-2 text-sm text-slate-200">
                The flow is designed around what you can inspect normally around
                the vehicle.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Buyer-safe wording
                </p>
              </div>
              <p className="mt-2 text-sm text-slate-200">
                Clear guidance without alarmist language or pressure-heavy
                prompts.
              </p>
            </div>
          </div>
        </div>

        {/* WHAT YOU GET */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="mb-2 text-lg font-semibold">
                What you get at the end of the inspection
              </h2>

              <p className="text-sm leading-relaxed text-slate-300">
                When you finish the scan, CarVerity turns what you recorded into
                a clean, structured report so you can decide what to do next
                with more confidence.
              </p>

              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                That makes it easier to compare cars, discuss issues with a
                seller, review the vehicle later, or decide whether you should
                pause and get more information first.
              </p>
            </div>

            <div className="w-fit rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-slate-300" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Designed to feel finished
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
                so the biggest concerns are easier to spot
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>
                <span className="font-semibold text-white">
                  Items worth clarifying
                </span>{" "}
                before you commit to the car
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>
                <span className="font-semibold text-white">Photo evidence</span>{" "}
                linked to what you captured during the scan
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>
                <span className="font-semibold text-white">
                  Separate negotiation guidance
                </span>{" "}
                kept away from the main report flow
              </span>
            </li>
          </ul>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">Structured</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                The report is organised so the important parts are easier to
                review.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">Buyer-safe</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Clear language designed to help you clarify, not escalate.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <FileText className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">Shareable</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Print it, save it as PDF, or email it from your own device if
                you want.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleStartInPerson}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300"
            >
              Start inspection
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link
              to="/what-to-expect"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-950/30 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
            >
              See what the scan includes
            </Link>

            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-950/30 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
            >
              View pricing
            </Link>
          </div>
        </div>

        {/* DECISION SUPPORT / CONTENT CLUSTER */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="mb-2 text-lg font-semibold">
            Still researching before you inspect?
          </h2>

          <p className="text-sm leading-relaxed text-slate-300">
            Many buyers are not ready to inspect straight away. If you are still
            comparing sellers, offers, and risk, these guides help build the
            bigger picture around the inspection itself.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Link
              to="/dealer-vs-private-seller-australia"
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:bg-slate-950/55"
            >
              <div className="flex items-center gap-2 text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">
                  Dealer vs private seller
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Understand the trade-offs between buying from a dealer and
                buying privately in Australia.
              </p>
            </Link>

            <Link
              to="/how-much-should-you-offer-used-car-australia"
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:bg-slate-950/55"
            >
              <div className="flex items-center gap-2 text-slate-200">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">
                  How much should you offer?
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Learn how buyers often think about pricing, room to move, and
                offer strategy in Australia.
              </p>
            </Link>

            <Link
              to="/is-a-mechanical-inspection-worth-it-australia"
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:bg-slate-950/55"
            >
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">
                  Is a mechanical inspection worth it?
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Work out when a professional inspection may still make sense
                after your own in-person checks.
              </p>
            </Link>

            <Link
              to="/used-car-inspection-mistakes-australia"
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:bg-slate-950/55"
            >
              <div className="flex items-center gap-2 text-slate-200">
                <FileText className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">
                  Common inspection mistakes
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                See where buyers commonly rush, overlook details, or lose track
                during inspections.
              </p>
            </Link>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-white">Already started?</h3>
            <p className="mt-1 text-sm text-slate-300">
              You can resume your in-progress inspection anytime.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {shouldShowResume && (
              <button
                onClick={resumeScan}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-semibold text-black transition hover:bg-amber-300"
              >
                Resume inspection
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            <Link
              to="/my-scans"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-950/30 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
            >
              My scans
            </Link>

            <Link
              to="/used-car-checklist-printable"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-950/30 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
            >
              Printable checklist
            </Link>
          </div>
        </div>

        {/* FOOTER NOTE */}
        <div className="text-xs leading-relaxed text-slate-500">
          CarVerity helps you record what you can observe during an in-person
          used car inspection. It is not a mechanical inspection or valuation.
          It is a structured, buyer-safe flow designed to reduce regret and
          improve decision confidence for Australian buyers. Learn more on the{" "}
          <Link to="/about" className="text-slate-300 underline">
            About page
          </Link>
          , read about buyer-safe design on{" "}
          <Link to="/trust" className="text-slate-300 underline">
            Trust
          </Link>
          , or browse common questions in the{" "}
          <Link to="/faq" className="text-slate-300 underline">
            FAQ
          </Link>
          .
          <span className="mt-3 block">
            Quick links:{" "}
            <Link to="/pricing" className="text-slate-300 underline">
              Pricing
            </Link>
            {" · "}
            <Link to="/what-to-expect" className="text-slate-300 underline">
              What to expect
            </Link>
            {" · "}
            <Link
              to="/what-to-check-when-buying-a-used-car-australia"
              className="text-slate-300 underline"
            >
              What to check when buying a used car
            </Link>
            {" · "}
            <Link
              to="/used-car-checklist-australia"
              className="text-slate-300 underline"
            >
              Used car checklist
            </Link>
            {" · "}
            <Link
              to="/used-car-checklist-printable"
              className="text-slate-300 underline"
            >
              Printable checklist
            </Link>
            {" · "}
            <Link
              to="/how-to-inspect-a-used-car-in-person"
              className="text-slate-300 underline"
            >
              Inspect in person
            </Link>
            {" · "}
            <Link
              to="/how-to-test-drive-a-used-car-australia"
              className="text-slate-300 underline"
            >
              Test drive guide
            </Link>
            {" · "}
            <Link
              to="/used-car-inspection-mistakes-australia"
              className="text-slate-300 underline"
            >
              Inspection mistakes
            </Link>
            {" · "}
            <Link
              to="/ppsr-check-australia"
              className="text-slate-300 underline"
            >
              PPSR check
            </Link>
            {" · "}
            <Link
              to="/how-many-km-is-too-many-used-car-australia"
              className="text-slate-300 underline"
            >
              How many km is too many?
            </Link>
            {" · "}
            <Link
              to="/is-a-mechanical-inspection-worth-it-australia"
              className="text-slate-300 underline"
            >
              Mechanical inspection: worth it?
            </Link>
            {" · "}
            <Link
              to="/dealer-vs-private-seller-australia"
              className="text-slate-300 underline"
            >
              Dealer vs private
            </Link>
            {" · "}
            <Link
              to="/how-much-should-you-offer-used-car-australia"
              className="text-slate-300 underline"
            >
              How much should you offer?
            </Link>
            {" · "}
            <Link to="/terms" className="text-slate-300 underline">
              Terms
            </Link>
            {" · "}
            <Link to="/privacy" className="text-slate-300 underline">
              Privacy
            </Link>
          </span>
        </div>
      </section>
    </div>
  );
}