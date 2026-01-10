import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

type StepPhoto = {
  id: string;
  dataUrl: string;
  stepId: string;
};

const MAX_PHOTOS = 15;

type PhotoStep = {
  id: string;
  title: string;
  guidance: string;
  image?: string;
  required?: boolean;
  requiredHint?: string;
};

export default function InPersonPhotos() {
  const navigate = useNavigate();
  const existingProgress: any = loadProgress();

  const containerRef = useRef<HTMLDivElement | null>(null);

  /* =========================================================
     Session continuity
  ========================================================== */

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

  const [photos, setPhotos] = useState<StepPhoto[]>(
    existingProgress?.photos ?? []
  );

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const atHardLimit = photos.length >= MAX_PHOTOS;

  useEffect(() => {
    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/photos",
      photos,
      startedAt: existingProgress?.startedAt ?? new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId, photos]);

  /* =========================================================
     Guided photo steps (inspection evidence)
     - First 4 are required baseline views for AI analysis
     - No photo counts shown to user
  ========================================================== */

  const steps: PhotoStep[] = [
    {
      id: "exterior-front",
      title: "Front of the vehicle",
      guidance:
        "Capture the full front of the vehicle. Keep it centred and include bumper, bonnet, headlights, and roofline.",
      image: "/photo-guides/front.png",
      required: true,
      requiredHint:
        "Add a clear front view to continue — this helps CarVerity assess overall exterior condition.",
    },
    {
      id: "exterior-side-left",
      title: "Left side of the vehicle",
      guidance:
        "Capture the full left side profile. Include wheels and door lines, and keep the camera level if possible.",
      image: "/photo-guides/side-left.png",
      required: true,
      requiredHint:
        "Add a clear left-side view to continue — this helps CarVerity assess body lines and alignment.",
    },
    {
      id: "exterior-rear",
      title: "Rear of the vehicle",
      guidance:
        "Capture the full rear of the vehicle. Keep it centred and include bumper, boot, tail-lights, and roofline.",
      image: "/photo-guides/rear.png",
      required: true,
      requiredHint:
        "Add a clear rear view to continue — this helps CarVerity assess panel fit and exterior condition.",
    },
    {
      id: "exterior-side-right",
      title: "Right side of the vehicle",
      guidance:
        "Capture the full right side profile so the system has a matching pair of side views.",
      image: "/photo-guides/side-right.png",
      required: true,
      requiredHint:
        "Add a clear right-side view to continue — this completes the baseline exterior set.",
    },

    // Optional evidence steps (only take what’s useful)
    {
      id: "tyres-wheels",
      title: "Tyres & wheels (if anything stands out)",
      guidance:
        "If wear or marks stand out, capture a clear close-up. Otherwise you can skip this step.",
    },
    {
      id: "interior",
      title: "Interior overview (optional)",
      guidance:
        "If you can, capture a general interior view (driver seat + dashboard area). Skip if not permitted or unnecessary.",
    },
    {
      id: "dashboard",
      title: "Dashboard (optional)",
      guidance:
        "If safe and permitted, capture the dashboard with ignition on. This can help document warning lights if any are present.",
    },
    {
      id: "engine-bay",
      title: "Engine bay overview (optional)",
      guidance:
        "Only if you’re comfortable and it’s permitted. Take a simple overview photo — do not touch anything.",
    },
    {
      id: "service-records",
      title: "Service records (optional)",
      guidance:
        "If available, capture a clear photo of stamped logbook pages or receipts. Skip if not available.",
    },
    {
      id: "vin",
      title: "VIN / compliance (optional)",
      guidance:
        "If easy to access, capture the VIN plate or compliance sticker clearly. Skip if it’s hard to reach or not permitted.",
    },
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  /* =========================================================
     Camera + gallery
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
      step: "/scan/in-person/photos",
    });
  }

  /* =========================================================
     Navigation
  ========================================================== */

  const mustHavePhotoForThisStep = Boolean(step.required);
  const hasAtLeastOneForStep = stepPhotos.length > 0;
  const canContinue = !mustHavePhotoForThisStep || hasAtLeastOneForStep;

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

    // Quietly enforce baseline evidence where required
    if (!canContinue) return;

    setIsAdvancing(true);

    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      setTimeout(() => setIsAdvancing(false), 350);
      return;
    }

    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/checks",
      photos,
    });

    navigate("/scan/in-person/checks");
  }

  function skipStep() {
    if (isAdvancing) return;

    // Never allow skipping required baseline steps
    if (step.required) return;

    setIsAdvancing(true);

    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      setTimeout(() => setIsAdvancing(false), 250);
      return;
    }

    setTimeout(() => setIsAdvancing(false), 250);
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
        In-person scan — Photos
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Capture inspection evidence
      </h1>

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
              alt="Example framing"
              className="w-full rounded-lg"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Example framing — use this as a reference
            </p>
          </div>
        )}

        <p className="text-sm text-slate-300">{step.guidance}</p>

        {step.required && (
          <p className="text-[11px] text-slate-400">
            Baseline view — helps CarVerity interpret overall exterior condition.
          </p>
        )}
      </section>

      {/* CAMERA + GALLERY */}
      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 space-y-3">
        <h3 className="text-sm font-semibold text-emerald-200">
          {stepPhotos.length > 0
            ? "Photos captured for this step"
            : "Add a photo for this step"}
        </h3>

        {atHardLimit && (
          <p className="text-[11px] text-slate-300">
            You’ve added enough photos for a clear inspection. If something
            important is missing, remove one and retake the key view.
          </p>
        )}

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

        {!canContinue && step.required && (
          <p className="text-[11px] text-amber-200 font-semibold">
            {step.requiredHint}
          </p>
        )}
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          onClick={prevStep}
          className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-3 font-semibold"
        >
          Back
        </button>

        {!step.required && (
          <button
            onClick={skipStep}
            disabled={isAdvancing}
            className="w-full rounded-xl border border-white/15 text-slate-200 px-4 py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Skip (optional)
          </button>
        )}

        <button
          onClick={nextStep}
          disabled={isAdvancing || !canContinue}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold px-4 py-3 shadow"
        >
          Continue
        </button>
      </div>

      <p className="text-[11px] text-slate-400 text-center">
        CarVerity helps you document observations — it does not diagnose
        mechanical faults.
      </p>

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-6">
          <div className="rounded-2xl border border-white/20 bg-slate-900 px-6 py-5 space-y-3 max-w-md w-full">
            <h3 className="text-sm font-semibold text-white">
              Leave the photo step?
            </h3>

            <p className="text-sm text-slate-300">
              You can return later — any captured photos will remain on this
              device.
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
