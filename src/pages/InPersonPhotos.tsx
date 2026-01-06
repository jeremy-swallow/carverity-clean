// src/pages/InPersonPhotos.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";
import { saveProgress } from "../utils/scanProgress";

type Imperfection = {
  id: string;
  area: string;
  type: string;
  note?: string;
  costBand: string;
};

export default function InPersonPhotos() {
  const navigate = useNavigate();
  const [onlineResult, setOnlineResult] = useState<SavedResult | null>(null);
  const [imperfections, setImperfections] = useState<Imperfection[]>([]);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (stored) setOnlineResult(stored);

    saveProgress({
      type: "in-person",
      step: "/scan/in-person/photos",
      startedAt: new Date().toISOString(),
      fromOnlineScan: Boolean(stored),
    });
  }, []);

  /* =========================================================
     Priority areas from online scan
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
      Tyres: ["tyre", "tire", "tread", "worn tyre", "uneven wear"],
      Wheels: ["kerb rash", "curb rash", "wheel damage"],
      Windscreen: ["chip", "windscreen", "crack"],
      Interior: ["seat wear", "trim wear", "interior wear"],
      "Service book / records": ["service history", "logbook", "service book"],
      Compliance: ["import", "compliance", "build plate", "vin"],
    };

    const detected: string[] = [];

    for (const [area, keywords] of Object.entries(map)) {
      if (keywords.some((k) => text.includes(k))) detected.push(area);
    }

    return detected;
  }, [onlineResult]);

  /* =========================================================
     Guided shot list
  ========================================================== */

  const steps = [
    {
      id: "exterior-front",
      title: "Front & front-left angle",
      guidance:
        "Stand back so the whole front and left side are visible. Keep the car centred in the frame.",
    },
    {
      id: "exterior-side",
      title: "Full side profile",
      guidance:
        "Fit the entire side in the photo, including wheels, door lines and reflections.",
    },
    {
      id: "exterior-rear",
      title: "Rear & rear-right angle",
      guidance:
        "Capture the rear plus right-side angle to show paint consistency and body lines.",
    },
    {
      id: "tyres",
      title: "Tyres & wheel condition",
      guidance:
        "Take close-ups of each wheel and tyre tread. Look for uneven wear, cracks or exposed wire.",
    },
    {
      id: "interior",
      title: "Interior & dashboard area",
      guidance:
        "Photograph seats, steering wheel, dashboard and centre console. Switch ignition to ACC if safe.",
    },
    {
      id: "logbook",
      title: "Logbook / service records (if available)",
      guidance:
        "Photograph stamped pages or receipts. Take close-ups where mileage, dates or workshop names appear.",
    },
    {
      id: "vin",
      title: "VIN, build plate & compliance labels",
      guidance:
        "Photograph the VIN plate and any compliance or build labels in the engine bay or door jamb.",
    },
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  /* =========================================================
     Imperfection logging
  ========================================================== */

  const COST_BANDS: Record<string, string> = {
    "Minor paint scuff": "$120–$300 typical repair",
    "Dent — no paint damage": "$150–$400 paintless repair",
    "Kerb-rashed wheel": "$120–$250 per wheel",
    "Interior wear / tear": "Varies — usually cosmetic, ask seller to confirm",
    "Windscreen chip": "$90–$160 repair (replacement if cracked)",
    "Unknown / worth confirming": "Ask seller for clarification or receipts",
  };

  const [newIssueType, setNewIssueType] = useState("");
  const [newIssueNote, setNewIssueNote] = useState("");

  function addImperfection() {
    if (!newIssueType) return;

    const costBand =
      COST_BANDS[newIssueType] ??
      "Cost not clear — worth confirming with the seller";

    const record: Imperfection = {
      id: crypto.randomUUID(),
      area: step.title,
      type: newIssueType,
      note: newIssueNote.trim() || undefined,
      costBand,
    };

    setImperfections((p) => [...p, record]);
    setNewIssueType("");
    setNewIssueNote("");
  }

  function nextStep() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }

    // Move to inspection checks phase
    saveProgress({
      type: "in-person",
      step: "/scan/in-person/checks",
      imperfections,
      fromOnlineScan: Boolean(onlineResult),
    });

    navigate("/scan/in-person/checks");
  }

  /* =========================================================
     Render
  ========================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Guided photo inspection
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Capture photos for this inspection
      </h1>

      {/* Priority hints */}
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
            These aren’t faults — they’re simply areas worth confirming in
            person.
          </p>
        </section>
      )}

      {/* Shot step */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-base font-semibold text-slate-100">
            {step.title}
          </h2>

          <span className="text-[11px] text-slate-400">
            Step {stepIndex + 1} of {steps.length}
          </span>
        </div>

        <p className="text-sm text-slate-300">{step.guidance}</p>

        <div className="rounded-xl border border-white/10 bg-slate-800/40 px-4 py-2 text-sm text-slate-400">
          Use your phone’s normal camera — this step simply helps you remember
          what to capture.
        </div>
      </section>

      {/* Imperfection capture */}
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
            Something looked unusual — not sure yet
          </option>
        </select>

        <input
          placeholder="Optional note (e.g. rear door, light mark near handle)…"
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

      {/* Observation list */}
      {!!imperfections.length && (
        <section className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-100">
            Noted observations for this visit
          </h3>

          <ul className="text-sm text-slate-300 space-y-1">
            {imperfections.map((i) => (
              <li key={i.id}>
                • {i.area}: {i.type}
                {i.note ? ` — ${i.note}` : ""} ({i.costBand})
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        onClick={nextStep}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
      >
        Continue
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        CarVerity doesn’t diagnose mechanical faults — it helps you document
        observations and understand what may be worth confirming with the
        seller.
      </p>
    </div>
  );
}
