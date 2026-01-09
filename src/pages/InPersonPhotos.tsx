import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadOnlineResults, type SavedResult } from "../utils/onlineResults";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

type Imperfection = {
  id: string;
  area: string;
  type: string;
  note?: string;
  costBand: string;
};

type StepPhoto = {
  id: string;
  dataUrl: string;
  stepId: string;
};

const MAX_PHOTOS = 15;
const SOFT_GUIDANCE_THRESHOLD = 12;

export default function InPersonPhotos() {
  const navigate = useNavigate();
  const existingProgress: any = loadProgress();

  const containerRef = useRef<HTMLDivElement | null>(null);

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

  const [photos, setPhotos] = useState<StepPhoto[]>(
    existingProgress?.photos ?? []
  );

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const totalPhotos = photos.length;
  const atSoftLimit = totalPhotos >= SOFT_GUIDANCE_THRESHOLD;
  const atHardLimit = totalPhotos >= MAX_PHOTOS;

  useEffect(() => {
    const stored = loadOnlineResults();
    if (stored) setOnlineResult(stored);

    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/photos",
      photos,
      imperfections,
      startedAt: existingProgress?.startedAt ?? new Date().toISOString(),
      fromOnlineScan: Boolean(stored),
    });
  }, [scanId, photos, imperfections]);

  /* =========================================================
     Priority hints derived from online scan
  ========================================================== */

  const priorityAreas = useMemo(() => {
    if (!onlineResult?.fullSummary && !onlineResult?.summary) return [];
    const text = (onlineResult.fullSummary || onlineResult.summary || "").toLowerCase();

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
     Guided photo step list
  ========================================================== */

  const steps = [
    {
      id: "exterior-front",
      title: "Front view",
      guidance:
        "Capture the full front of the vehicle. Keep it centred and ensure the bumper, bonnet, and roof are fully visible.",
      image: "/photo-guides/front.png",
    },
    {
      id: "exterior-side-left",
      title: "Left side profile",
      guidance:
        "Capture the full side profile, including wheels and door lines. Keep the camera level if possible.",
      image: "/photo-guides/side-left.png",
    },
    {
      id: "exterior-rear",
      title: "Rear view",
      guidance:
        "Capture the full rear of the vehicle. Keep it centred and ensure the bumper, boot, and roofline are fully visible.",
      image: "/photo-guides/rear.png",
    },
    {
      id: "exterior-side-right",
      title: "Right side profile",
      guidance:
        "Repeat on the opposite side so you have a matching pair of comparison photos.",
      image: "/photo-guides/side-right.png",
    },
    {
      id: "tyres",
      title: "Tyres & wheels",
      guidance:
        "Capture close-ups of tyre tread and wheel faces. If wear or marks stand out, include an extra close photo.",
    },
    {
      id: "interior",
      title: "Interior",
      guidance:
        "Photograph the driver seat, steering wheel, dashboard, and centre console. Switch ignition to ACC only if safe.",
    },
    {
      id: "logbook",
      title: "Service records (if available)",
      guidance:
        "Photograph stamped logbook pages or receipts. If dates or handwriting aren’t clear, take an additional close-up.",
    },
    {
      id: "vin",
      title: "VIN & compliance",
      guidance:
        "Capture the VIN plate and compliance sticker clearly. If hard to read, take one zoomed-in shot as well.",
    },
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  /* =========================================================
     CAMERA + GALLERY
  ========================================================== */

  function savePhotoFromFile(file: File) {
    if (atHardLimit) return;

    const reader = new FileReader();
    reader.onload = () => {
      const record: StepPhoto = {
        id: crypto.randomUUID(),
        dataUrl: reader.result as string,
        stepId: step.id,
      };

      const updated = [...photos, record];
      setPhotos(updated);

      saveProgress({
        ...(existingProgress ?? {}),
        type: "in-person",
        scanId,
        photos: updated,
        imperfections,
        step: "/scan/in-person/photos",
      });
    };
    reader.readAsDataURL(file);
  }

  function handleUploadFromGallery(e: React.ChangeEvent<HTMLInputElement>) {
    if (atHardLimit) {
      e.target.value = "";
      return;
    }

    const file = e.target.files?.[0];
    if (file) savePhotoFromFile(file);
    e.target.value = "";
  }

  function handleTakePhoto() {
    if (atHardLimit) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    (input as any).capture = "environment";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) savePhotoFromFile(file);
    };
    input.click();
  }

  const stepPhotos = photos.filter((p) => p.stepId === step.id);

  function removePhoto(id: string) {
    const updated = photos.filter((p) => p.id !== id);
    setPhotos(updated);

    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId,
      photos: updated,
      imperfections,
      step: "/scan/in-person/photos",
    });
  }

  /* =========================================================
     Imperfection logging (shown AFTER capture)
  ========================================================== */

  const COST_BANDS: Record<string, string> = {
    "Minor paint scuff": "$120–$300 typical repair",
    "Dent — no paint damage": "$150–$400 paintless repair",
    "Kerb-rashed wheel": "$120–$250 per wheel",
    "Interior wear / tear": "Varies — may be cosmetic, ask the seller",
    "Windscreen chip": "$90–$160 repair (replacement if cracked)",
    "Unknown / worth confirming": "Ask seller for clarification or receipts",
  };

  const [newIssueType, setNewIssueType] = useState("");
  const [newIssueNote, setNewIssueNote] = useState("");

  function addImperfection() {
    if (!newIssueType) return;

    const costBand = COST_BANDS[newIssueType] ?? "Cost unknown — worth confirming";

    const record: Imperfection = {
      id: crypto.randomUUID(),
      area: step.title,
      type: newIssueType,
      note: newIssueNote.trim() || undefined,
      costBand,
    };

    const updated = [...imperfections, record];
    setImperfections(updated);

    setNewIssueType("");
    setNewIssueNote("");

    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId,
      photos,
      imperfections: updated,
      step: "/scan/in-person/photos",
    });
  }

  /* =========================================================
     Navigation
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
      setTimeout(() => setIsAdvancing(false), 400);
      return;
    }

    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/checks",
      photos,
      imperfections,
      fromOnlineScan: Boolean(onlineResult),
    });

    navigate("/scan/in-person/checks");
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
            <img src={step.image} alt="Example framing" className="w-full rounded-lg" />
            <p className="text-[11px] text-slate-400 mt-1">
              Example framing — use this as a reference
            </p>
          </div>
        )}

        <p className="text-sm text-slate-300">{step.guidance}</p>
      </section>

      {/* CAMERA + GALLERY */}
      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 space-y-3">
        <h3 className="text-sm font-semibold text-emerald-200">
          {stepPhotos.length > 0 ? "Photos for this angle" : "Add a photo for this angle"}
        </h3>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-300">
            Total photos: <span className="font-semibold">{totalPhotos}</span> / {MAX_PHOTOS}
          </p>

          {!atHardLimit && atSoftLimit && (
            <p className="text-[11px] text-slate-400">
              You’ve added most of what’s needed — focus on anything unusual.
            </p>
          )}

          {atHardLimit && (
            <p className="text-[11px] text-amber-200 font-semibold">
              You’ve added enough photos for a clear inspection.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleTakePhoto}
            disabled={atHardLimit}
            className="w-full rounded-lg bg-emerald-400 text-black font-semibold px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            📷 Take photo with camera
          </button>

          <label className="w-full">
            <span
              className={[
                "block rounded-lg px-3 py-2 text-sm text-slate-200 text-center cursor-pointer",
                atHardLimit
                  ? "bg-slate-800/60 border border-white/10 opacity-60 cursor-not-allowed"
                  : "bg-slate-800 border border-white/20",
              ].join(" ")}
            >
              📁 Upload from gallery / files
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={atHardLimit}
              onChange={handleUploadFromGallery}
            />
          </label>
        </div>

        {stepPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {stepPhotos.map((p) => (
              <div key={p.id} className="relative group">
                <img
                  src={p.dataUrl}
                  alt="Inspection photo"
                  className="rounded-lg border border-white/20 object-cover w-full h-24"
                />
                <button
                  onClick={() => removePhoto(p.id)}
                  className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Imperfection logging — shown only after capture */}
      {stepPhotos.length > 0 && (
        <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 space-y-2">
          <h3 className="text-sm font-semibold text-amber-200">
            Anything stand out here?
          </h3>

          <p className="text-[11px] text-slate-400">
            After capturing this angle, note anything that caught your attention.
          </p>

          <select
            value={newIssueType}
            onChange={(e) => setNewIssueType(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-white/15 px-3 py-2 text-sm text-slate-200"
          >
            <option value="">Select an observation…</option>

            <optgroup label="Paint & panels">
              <option value="Minor paint scuff">Minor paint scuff</option>
              <option value="Dent — no paint damage">Dent — no paint damage</option>
            </optgroup>

            <optgroup label="Wheels & tyres">
              <option value="Kerb-rashed wheel">Kerb-rashed wheel</option>
            </optgroup>

            <optgroup label="Glass & trim">
              <option value="Windscreen chip">Windscreen chip</option>
            </optgroup>

            <optgroup label="Interior">
              <option value="Interior wear / tear">Interior wear / tear</option>
            </optgroup>

            <optgroup label="Other">
              <option value="Unknown / worth confirming">
                Something looked unusual — not sure
              </option>
            </optgroup>
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
            Add observation
          </button>
        </section>
      )}

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
        CarVerity helps you document observations — it does not diagnose mechanical faults.
      </p>

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-6">
          <div className="rounded-2xl border border-white/20 bg-slate-900 px-6 py-5 space-y-3 max-w-md w-full">
            <h3 className="text-sm font-semibold text-white">
              Leave the photo inspection?
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
