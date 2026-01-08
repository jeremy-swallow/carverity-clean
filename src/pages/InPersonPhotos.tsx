// src/pages/InPersonPhotos.tsx

import {
  useEffect,
  useMemo,
  useState,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
} from "react";
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

  // 🔐 Persistent scan identity for this in-person journey
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
  const [imperfections, setImperfections] = useState<Imperfection[]>(
    existingProgress?.imperfections ?? []
  );
  const [photos, setPhotos] = useState<string[]>(
    existingProgress?.photos ?? []
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (stored) setOnlineResult(stored);

    // Persist safe entry into this step
    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId,
      photos,
      imperfections,
      step: "/scan/in-person/photos",
      startedAt: existingProgress?.startedAt ?? new Date().toISOString(),
      fromOnlineScan: Boolean(stored),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId, photos, imperfections]);

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
     Guided photo steps
  ========================================================== */

  const steps = [
    {
      id: "exterior-front",
      title: "Front & front-left angle",
      guidance:
        "Stand back so the whole front and left side are visible. Avoid cutting off the bumper or roof.",
      image: "/photo-guides/front.png",
    },
    {
      id: "exterior-side-left",
      title: "Full side profile — left side",
      guidance:
        "Capture the entire side including wheels and door lines. Keep the camera level if possible.",
      image: "/photo-guides/side-left.png",
    },
    {
      id: "exterior-rear",
      title: "Rear & rear-right angle",
      guidance:
        "Photograph the rear plus right-side angle. Reflections help reveal dents or waviness.",
      image: "/photo-guides/rear.png",
    },
    {
      id: "exterior-side-right",
      title: "Full side profile — right side",
      guidance:
        "Repeat on the opposite side so you have a matching comparison photo.",
      image: "/photo-guides/side-right.png",
    },
    {
      id: "tyres",
      title: "Tyres & wheel condition",
      guidance:
        "Take close-ups of each tyre tread and wheel face. Photograph any wear or marks clearly.",
    },
    {
      id: "interior",
      title: "Interior & dashboard area",
      guidance:
        "Capture the driver seat, steering wheel and console. Switch ignition to ACC only if safe.",
    },
    {
      id: "logbook",
      title: "Logbook / service records (if available)",
      guidance:
        "Photograph stamped pages or receipts. Take close-ups if handwriting is unclear.",
    },
    {
      id: "vin",
      title: "VIN, build plate & compliance labels",
      guidance:
        "Ensure the VIN is readable. If faded or reflective, take a close-up also.",
    },
  ];

  const [stepIndex, setStepIndex] = useState(
    existingProgress?.photoStepIndex ?? 0
  );
  const step = steps[stepIndex];

  /* =========================================================
     Photo helpers — camera, upload, paste
  ========================================================== */

  function persistPhotos(next: string[]) {
    setPhotos(next);
    const current = loadProgress() ?? {};
    saveProgress({
      ...current,
      photos: next,
      photoStepIndex: stepIndex,
      step: "/scan/in-person/photos",
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const dataUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;

      const reader = new FileReader();
      const url: string = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      dataUrls.push(url);
    }

    if (dataUrls.length) {
      persistPhotos([...photos, ...dataUrls]);
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    void handleFiles(e.target.files);
    // Allow re-selecting the same file again later
    e.target.value = "";
  }

  function triggerFilePicker() {
    fileInputRef.current?.click();
  }

  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }

    if (files.length) {
      // Build a fake FileList-like object for handleFiles
      const fileList = {
        length: files.length,
        item: (index: number) => files[index],
        ...files.reduce((acc, file, index) => {
          (acc as any)[index] = file;
          return acc;
        }, {} as Record<number, File>),
      } as unknown as FileList;

      void handleFiles(fileList);
    }
  }

  function removePhoto(index: number) {
    const next = photos.filter((_, i) => i !== index);
    persistPhotos(next);
  }

  /* =========================================================
     Imperfection logging
  ========================================================== */

  const COST_BANDS: Record<string, string> = {
    "Minor paint scuff": "$120–$300 typical repair",
    "Dent — no paint damage": "$150–$400 paintless repair",
    "Kerb-rashed wheel": "$120–$250 per wheel",
    "Interior wear / tear": "Varies — may be cosmetic",
    "Windscreen chip": "$90–$160 repair",
    "Unknown / worth confirming": "Ask seller for clarification",
  };

  const [newIssueType, setNewIssueType] = useState("");
  const [newIssueNote, setNewIssueNote] = useState("");

  function addImperfection() {
    if (!newIssueType) return;

    const record: Imperfection = {
      id: crypto.randomUUID(),
      area: step.title,
      type: newIssueType,
      note: newIssueNote.trim() || undefined,
      costBand: COST_BANDS[newIssueType] ?? "Cost unknown — worth confirming",
    };

    const next = [...imperfections, record];
    setImperfections(next);

    const current = loadProgress() ?? {};
    saveProgress({
      ...current,
      imperfections: next,
    });

    setNewIssueType("");
    setNewIssueNote("");
  }

  /* =========================================================
     Navigation
  ========================================================== */

  function nextStep() {
    if (stepIndex < steps.length - 1) {
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      const current = loadProgress() ?? {};
      saveProgress({
        ...current,
        photoStepIndex: nextIndex,
      });
      return;
    }

    // Completed photo steps → move to checks
    const current = loadProgress() ?? {};
    saveProgress({
      ...current,
      step: "/scan/in-person/checks",
    });

    navigate("/scan/in-person/checks");
  }

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div
      className="max-w-3xl mx-auto px-6 py-10 space-y-6"
      onPaste={onPaste}
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

      {/* Current step guidance */}
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
              Example angle — match this framing as closely as you can.
            </p>
          </div>
        )}

        <p className="text-sm text-slate-300">{step.guidance}</p>
      </section>

      {/* Photo capture controls */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100">
          Add photos for this inspection
        </h3>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={onFileChange}
        />

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={triggerFilePicker}
            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 text-sm"
          >
            Take photo / upload
          </button>

          <button
            type="button"
            onClick={() => {
              // hint only; actual paste handled by onPaste
              // this keeps the UI self-explanatory
              alert(
                "You can paste images directly into this screen using Ctrl/Cmd + V after copying a screenshot or photo."
              );
            }}
            className="flex-1 rounded-xl border border-white/25 text-slate-200 px-4 py-2 text-sm"
          >
            How to paste an image
          </button>
        </div>

        {photos.length > 0 && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
              {photos.map((src, index) => (
                <div
                  key={`${index}-${src.slice(0, 16)}`}
                  className="relative group rounded-lg overflow-hidden border border-white/10"
                >
                  <img
                    src={src}
                    alt={`Inspection photo ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-black/70 text-white text-[10px] rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400">
              Photos stay on this device unless you choose to share or export
              them.
            </p>
          </>
        )}
      </section>

      {/* Imperfection logging */}
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
        </select>

        <input
          placeholder="Optional note (e.g. small mark near left rear door)…"
          value={newIssueNote}
          onChange={(e) => setNewIssueNote(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-white/15 px-3 py-2 text-sm text-slate-200"
        />

        <button
          type="button"
          onClick={addImperfection}
          className="w-full rounded-lg bg-amber-400 text-black font-semibold px-3 py-2 text-sm"
        >
          Add to inspection notes
        </button>
      </section>

      <button
        type="button"
        onClick={nextStep}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
      >
        Continue
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        CarVerity helps you document observations — it does not diagnose
        mechanical faults.
      </p>
    </div>
  );
}
