// src/pages/InPersonPhotos.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

type Imperfection = {
  id: string;
  area: string;
  type: string;
  note?: string;
  costBand: string;
};

export default function InPersonPhotos() {
  const navigate = useNavigate();
  const existingProgress: any = loadProgress();

  const containerRef = useRef<HTMLDivElement | null>(null);

  // 🔐 Ensure every in-person journey has a persistent scanId
  const [scanId] = useState<string>(() => {
    if (existingProgress?.scanId) return existingProgress.scanId;
    const id = generateScanId();
    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId: id,
      step: "/scan/in-person/photos",
      startedAt: new Date().toISOString(),
    });
    return id;
  });

  const [onlineResult, setOnlineResult] = useState<SavedResult | null>(null);
  const [imperfections, setImperfections] = useState<Imperfection[]>([]);

  const [isAdvancing, setIsAdvancing] = useState(false); // 🛡 tap-lock
  const [showExitConfirm, setShowExitConfirm] = useState(false); // back-from-step-1 safety

  useEffect(() => {
    const stored = loadOnlineResults();
    if (stored) setOnlineResult(stored);

    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/photos",
      startedAt: existingProgress?.startedAt ?? new Date().toISOString(),
      fromOnlineScan: Boolean(stored),
    });
  }, [scanId]);

  /* =========================================================
     Priority areas detected from online scan
  ========================================================== */

  const priorityAreas = useMemo(() => {
    if (!onlineResult?.fullSummary && !onlineResult?.summary) return [];

    const text =
      (onlineResult.fullSummary || onlineResult.summary || "").toLowerCase();

    const map: Record<string, string[]> = {
      "Body / paintwork": [
        "dent",
        "scratch",
        "scrape",
        "panel damage",
        "paint fade",
        "oxidation",
        "hail",
        "rust",
      ],
      Tyres: ["tyre", "tread", "worn"],
      Wheels: ["kerb rash", "curb rash", "wheel damage"],
      Windscreen: ["chip", "windscreen", "crack"],
      Interior: ["seat wear", "trim wear", "interior wear"],
    };

    const detected: string[] = [];

    for (const [area, keywords] of Object.entries(map)) {
      if (keywords.some((k) => text.includes(k))) detected.push(area);
    }

    return detected;
  }, [onlineResult]);

  /* =========================================================
     Guided photo shot list
  ========================================================== */

  const steps = [
    {
      id: "exterior-front",
      title: "Front & front-left angle",
      guidance:
        "Stand back so the whole front and left side are visible. Keep the car centred and avoid cutting off the bumper or roof.",
      image: "/photo-guides/front.png",
    },
    {
      id: "exterior-side-left",
      title: "Full side profile — left side",
      guidance:
        "Move back far enough to capture the entire side, including wheels and door lines. Keep the camera level if possible.",
      image: "/photo-guides/side-left.png",
    },
    {
      id: "exterior-rear",
      title: "Rear & rear-right angle",
      guidance:
        "Photograph the rear plus right-side angle. Reflections help reveal dents or waviness in the paint.",
      image: "/photo-guides/rear.png",
    },
    {
      id: "exterior-side-right",
      title: "Full side profile — right side",
      guidance:
        "Repeat on the opposite side so you have a matching pair of comparison photos.",
      image: "/photo-guides/side-right.png",
    },
    {
      id: "tyres",
      title: "Tyres & wheel condition",
      guidance:
        "Take close-ups of each tyre tread and wheel face. If wear or marks stand out, capture an extra close photo.",
    },
    {
      id: "interior",
      title: "Interior & dashboard area",
      guidance:
        "Photograph the driver seat, steering wheel, dashboard, and centre console. Switch ignition to ACC only if safe.",
    },
    {
      id: "logbook",
      title: "Logbook / service records (if available)",
      guidance:
        "Photograph stamped pages or receipts. If dates or handwriting aren’t clear, take an additional close-up.",
    },
    {
      id: "vin",
      title: "VIN, build plate & compliance labels",
      guidance:
        "Capture the VIN plate and compliance sticker clearly. If hard to read, take one zoomed-in shot as well.",
    },
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  /* =========================================================
     Auto-scroll to top on step change
  ========================================================== */

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  /* =========================================================
     Imperfection logging
  ========================================================== */

  const COST_BANDS: Record<string, string> = {
    "Minor paint scuff": "$120–$300 typical repair",
    "Dent — no paint damage": "$150–$400 paintless repair",
    "Kerb-rashed wheel": "$120–$250 per wheel",
    "Interior wear / tear": "Varies — may be cosmetic, ask the seller",
    "Windscreen chip": "$90–$160 repair (replacement if cracked)",
    "Unknown / worth confirming": "Ask seller for clarification or receipts",
  };

  const [newIssueArea, setNewIssueArea] = useState("");
  const [newIssueType, setNewIssueType] = useState("");
  const [newIssueNote, setNewIssueNote] = useState("");

  function addImperfection() {
    if (!newIssueType) return;

    const costBand =
      COST_BANDS[newIssueType] ?? "Cost unknown — worth confirming";

    const record: Imperfection = {
      id: crypto.randomUUID(),
      area: newIssueArea || step.title,
      type: newIssueType,
      note: newIssueNote.trim() || undefined,
      costBand,
    };

    setImperfections((p) => [...p, record]);
    setNewIssueArea("");
    setNewIssueType("");
    setNewIssueNote("");
  }

  /* =========================================================
     Navigation — Back + Continue (with tap-lock)
  ========================================================== */

  function prevStep() {
    if (isAdvancing) return;

    if (stepIndex === 0) {
      setShowExitConfirm(true);
      return;
    }

    setStepIndex((i) => Math.max(0, i - 1));
  }

  function nextStep() {
    if (isAdvancing) return;
    setIsAdvancing(true);

    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);

      // small delay prevents accidental double-tap
      setTimeout(() => setIsAdvancing(false), 400);
      return;
    }

    // Final step → persist + move to checks
    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/checks",
      imperfections,
      fromOnlineScan: Boolean(onlineResult),
    });

    navigate(`/scan/in-person/checks/${scanId}`);
  }

  function exitJourney() {
    setShowExitConfirm(false);
    navigate("/scan/in-person/start");
  }

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div
      ref={containerRef}
      className="max-w-3xl mx-auto px-6 py-10 space-y-6 overflow-y-auto"
    >
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Guided photo inspection
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Capture photos for this inspection
      </h1>

      {priorityAreas.length > 0 && (
        <section className="rounded-2xl border border-indigo-400/25 bg-indigo-600/10 px-4 py-3 space-y-1">
          <p className="text-sm text-slate-200 font-semibold">
            Based on your online scan, pay extra attention to:
          </p>
          <ul className="text-sm text-slate-300 list-disc list-inside">
            {priorityAreas.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-400">
            These aren’t faults — they’re areas worth confirming in person.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-base font-semibold text-slate-100">
            {step.title}
          </h2>
          <span className="text-[11px] text-slate-400">
            Step {stepIndex + 1} of {steps.length}
          </span>
        </div>

        {step.image && (
          <div className="rounded-xl border border-white/10 bg-slate-800/40 p-3">
            <img
              src={step.image}
              alt="Example photo angle"
              className="w-full rounded-lg"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Example angle — match this framing as closely as you can
            </p>
          </div>
        )}

        <p className="text-sm text-slate-300">{step.guidance}</p>
      </section>

      <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 space-y-2">
        <h3 className="text-sm font-semibold text-amber-200">
          Did you notice anything unusual here?
        </h3>

        <select
          value={newIssueType}
          onChange={(e) => setNewIssueType(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-white/15 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">Select an observation…</option>
          {Object.keys(COST_BANDS).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
          <option value="Unknown / worth confirming">
            Something looked unusual — not sure
          </option>
        </select>

        <input
          placeholder="Optional note (e.g. rear door — small mark near handle)…"
          value={newIssueNote}
          onChange={(e) => setNewIssueNote(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-white/15 px-3 py-2 text-sm text-slate-200"
        />

        <button
          onClick={addImperfection}
          className="w-full rounded-lg bg-amber-400 text-black font-semibold px-3 py-2 text-sm"
        >
          Add to inspection notes
        </button>
      </section>

      {!!imperfections.length && (
        <section className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-100">
            Noted observations for this visit
          </h3>

          <ul className="text-sm text-slate-300 space-y-1">
            {imperfections.map((i) => (
              <li key={i.id}>
                • {i.area}: {i.type}
                {i.note ? ` — ${i.note}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Back + Continue Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          onClick={prevStep}
          className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-3 font-semibold"
        >
          Back
        </button>

        <button
          onClick={nextStep}
          disabled={isAdvancing}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold px-4 py-3 shadow"
        >
          Continue
        </button>
      </div>

      <p className="text-[11px] text-slate-400 text-center">
        CarVerity helps you document observations — it does not diagnose
        mechanical faults.
      </p>

      {/* Exit confirm modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-6">
          <div className="rounded-2xl border border-white/20 bg-slate-900 px-6 py-5 space-y-3 max-w-md w-full">
            <h3 className="text-sm font-semibold text-white">
              Leave the guided photo inspection?
            </h3>
            <p className="text-sm text-slate-300">
              You can return later — any saved notes will remain on this device.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-2"
              >
                Stay here
              </button>

              <button
                onClick={exitJourney}
                className="w-full rounded-xl bg-slate-200 text-black font-semibold px-4 py-2"
              >
                Exit to start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
