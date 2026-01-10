import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

type StepPhoto = {
  id: string;
  dataUrl: string;
  stepId: string;
};

type PhotoStep = {
  id: string;
  title: string;
  guidance: string;
  image?: string;
  required?: boolean;
  requiredHint?: string;
};

const MAX_PHOTOS = 15;

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

  const [stepIndex, setStepIndex] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const atHardLimit = photos.length >= MAX_PHOTOS;

  useEffect(() => {
    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/photos",
      photos,
      startedAt:
        existingProgress?.startedAt ?? new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId, photos]);

  /* =========================================================
     Photo steps — AI baseline v1
  ========================================================== */

  const steps: PhotoStep[] = [
    {
      id: "exterior-front",
      title: "Front of the vehicle",
      guidance:
        "Capture the full front of the vehicle. Include bumper, bonnet, headlights, and roofline.",
      image: "/photo-guides/front.png",
      required: true,
      requiredHint:
        "Add a clear front view to continue — this helps assess overall exterior condition.",
    },
    {
      id: "exterior-side-left",
      title: "Left side of the vehicle",
      guidance:
        "Capture the full left side profile. Include wheels and door lines.",
      image: "/photo-guides/side-left.png",
      required: true,
      requiredHint:
        "Add a clear left-side view to continue — this helps assess body alignment.",
    },
    {
      id: "exterior-rear",
      title: "Rear of the vehicle",
      guidance:
        "Capture the full rear of the vehicle including bumper, boot, and tail-lights.",
      image: "/photo-guides/rear.png",
      required: true,
      requiredHint:
        "Add a clear rear view to continue — this helps assess panel fit.",
    },
    {
      id: "exterior-side-right",
      title: "Right side of the vehicle",
      guidance:
        "Capture the full right side profile to complete the exterior baseline.",
      image: "/photo-guides/side-right.png",
      required: true,
      requiredHint:
        "Add a clear right-side view to complete the baseline exterior set.",
    },
    {
      id: "tyres-wheels",
      title: "Tyres & wheels (optional)",
      guidance:
        "Capture close-ups only if something stands out. Otherwise you can skip.",
    },
    {
      id: "interior",
      title: "Interior overview (optional)",
      guidance:
        "If permitted, capture a general interior view (driver seat + dashboard).",
    },
    {
      id: "dashboard",
      title: "Dashboard (optional)",
      guidance:
        "If safe, capture the dashboard with ignition on to document warning lights.",
    },
    {
      id: "engine-bay",
      title: "Engine bay overview (optional)",
      guidance:
        "Only if permitted. Take a simple overview without touching anything.",
    },
    {
      id: "service-records",
      title: "Service records (optional)",
      guidance:
        "Capture stamped logbook pages or receipts if available.",
    },
    {
      id: "vin",
      title: "VIN / compliance (optional)",
      guidance:
        "Capture the VIN plate or compliance sticker if easy to access.",
    },
  ];

  const step = steps[stepIndex];
  const stepPhotos = photos.filter((p) => p.stepId === step.id);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [stepIndex]);

  /* =========================================================
     Photo handling
  ========================================================== */

  function savePhotoFromFile(file: File) {
    if (atHardLimit) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotos((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          dataUrl: reader.result as string,
          stepId: step.id,
        },
      ]);
    };
    reader.readAsDataURL(file);
  }

  function handleUploadFromGallery(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (file) savePhotoFromFile(file);
    e.target.value = "";
  }

  function handleTakePhoto() {
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

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  /* =========================================================
     Navigation
  ========================================================== */

  const mustHavePhotoForThisStep = Boolean(step.required);
  const hasAtLeastOneForStep = stepPhotos.length > 0;
  const canContinue =
    !mustHavePhotoForThisStep || hasAtLeastOneForStep;

  function prevStep() {
    if (stepIndex === 0) {
      setShowExitConfirm(true);
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function nextStep() {
    if (!canContinue) return;

    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
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
    if (step.required) return;
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
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
      className="max-w-3xl mx-auto px-6 py-10 space-y-6"
    >
      <span className="text-[11px] uppercase text-slate-400">
        In-person scan — Photos
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Capture inspection evidence
      </h1>

      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-slate-100">
            {step.title}
          </h2>
          <span className="text-[11px] text-slate-400">
            Step {stepIndex + 1} of {steps.length}
          </span>
        </div>

        {step.image && (
          <img
            src={step.image}
            alt="Example framing"
            className="rounded-lg border border-white/10"
          />
        )}

        <p className="text-sm text-slate-300">
          {step.guidance}
        </p>

        {step.required && (
          <p className="text-[11px] text-slate-400">
            Baseline view — required for analysis.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={handleTakePhoto}
            className="flex-1 rounded-lg bg-emerald-400 text-black font-semibold px-3 py-2"
          >
            📷 Take photo
          </button>

          <label className="flex-1">
            <span className="block rounded-lg bg-slate-800 border border-white/20 px-3 py-2 text-center text-slate-200 cursor-pointer">
              📁 Upload
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadFromGallery}
            />
          </label>
        </div>

        {stepPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {stepPhotos.map((p) => (
              <div key={p.id} className="relative">
                <img
                  src={p.dataUrl}
                  className="h-24 w-full object-cover rounded-lg border border-white/20"
                />
                <button
                  onClick={() => removePhoto(p.id)}
                  className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-2 py-1 rounded"
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

      <div className="flex gap-2">
        <button
          onClick={prevStep}
          className="flex-1 rounded-xl border border-white/25 px-4 py-3 text-slate-200"
        >
          Back
        </button>

        {!step.required && (
          <button
            onClick={skipStep}
            className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-slate-200"
          >
            Skip
          </button>
        )}

        <button
          onClick={nextStep}
          disabled={!canContinue}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-4 py-3 font-semibold text-black"
        >
          Continue
        </button>
      </div>

      <p className="text-[11px] text-slate-400 text-center">
        CarVerity helps you document observations — it does not
        diagnose mechanical faults.
      </p>

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-6">
          <div className="bg-slate-900 border border-white/20 rounded-2xl px-6 py-5 space-y-3 max-w-md w-full">
            <h3 className="font-semibold text-white">
              Leave the photo step?
            </h3>
            <p className="text-sm text-slate-300">
              You can return later — your photos will remain on
              this device.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 rounded-xl border border-white/25 px-4 py-2 text-slate-200"
              >
                Stay
              </button>
              <button
                onClick={exitJourney}
                className="flex-1 rounded-xl bg-slate-200 text-black font-semibold px-4 py-2"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
