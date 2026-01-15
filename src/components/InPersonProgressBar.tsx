// src/components/InPersonProgressBar.tsx

import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";

type Step = {
  route: string;
  label: string;
  short: string;
  index: number; // 1-based
};

const STEPS: Step[] = [
  { route: "/scan/in-person/start", label: "Start", short: "Start", index: 1 },
  {
    route: "/scan/in-person/vehicle-details",
    label: "Vehicle details",
    short: "Vehicle",
    index: 2,
  },
  { route: "/scan/in-person/photos", label: "Photos", short: "Photos", index: 3 },
  {
    route: "/scan/in-person/checks/intro",
    label: "Checks intro",
    short: "Checks",
    index: 4,
  },
  {
    route: "/scan/in-person/checks/around",
    label: "Around the car",
    short: "Around",
    index: 5,
  },
  {
    route: "/scan/in-person/checks/inside",
    label: "Inside cabin",
    short: "Cabin",
    index: 6,
  },
  {
    route: "/scan/in-person/checks/drive",
    label: "Test drive",
    short: "Drive",
    index: 7,
  },
  { route: "/scan/in-person/summary", label: "Summary", short: "Summary", index: 8 },
  {
    route: "/scan/in-person/analyzing",
    label: "Analysing",
    short: "Analysing",
    index: 9,
  },
  { route: "/scan/in-person/results", label: "Results", short: "Results", index: 10 },
];

function normaliseRoute(pathname: string) {
  // Treat analyzing/:scanId and results/:scanId as their base routes
  if (pathname.startsWith("/scan/in-person/analyzing")) return "/scan/in-person/analyzing";
  if (pathname.startsWith("/scan/in-person/results")) return "/scan/in-person/results";
  return pathname;
}

export default function InPersonProgressBar() {
  const location = useLocation();

  const pathname = normaliseRoute(location.pathname);

  const { currentStep, totalSteps, percent, currentLabel, currentShort } =
    useMemo(() => {
      const found = STEPS.find((s) => s.route === pathname);

      // Fallback to progress.step if user is on an in-person route but it doesn't match
      const progress: any = loadProgress();
      const progressStep = progress?.step ? normaliseRoute(progress.step) : null;
      const foundByProgress = progressStep
        ? STEPS.find((s) => s.route === progressStep)
        : null;

      const step = found ?? foundByProgress ?? null;

      const total = STEPS.length;
      const idx = step?.index ?? 1;
      const pct = Math.round(((idx - 1) / (total - 1)) * 100);

      return {
        currentStep: idx,
        totalSteps: total,
        percent: pct,
        currentLabel: step?.label ?? "In-person scan",
        currentShort: step?.short ?? "Scan",
      };
    }, [pathname]);

  // Only show on in-person routes
  if (!pathname.startsWith("/scan/in-person/")) return null;

  // Hide on home / pricing etc (already handled above), also hide on print
  if (pathname.startsWith("/scan/in-person/print")) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              In-person scan
            </p>
            <p className="text-sm font-semibold text-white truncate">
              {currentShort}
              <span className="text-slate-400 font-normal"> — {currentLabel}</span>
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[11px] text-slate-400">
              Step {currentStep} / {totalSteps}
            </p>
            <p className="text-xs text-slate-300">{percent}%</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
