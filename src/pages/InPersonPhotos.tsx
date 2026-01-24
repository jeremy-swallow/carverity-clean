import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";
import { supabase } from "../supabaseClient";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  X,
  ShieldCheck,
  Loader2,
} from "lucide-react";

type StepPhoto = {
  id: string;
  storagePath: string;
  stepId: string;
};

type PhotoStep = {
  id: string;
  title: string;
  guidance: string;
  image?: string;
  required?: boolean;
  requiredHint?: string;
  whyItMatters?: string;
};

const MAX_PHOTOS = 15;

// Supabase Storage bucket
const PHOTO_BUCKET = "scan-photos";

// ✅ IMPORTANT: this must match your real first checks route
const FIRST_CHECKS_ROUTE = "/scan/in-person/checks/intro";

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extFromFile(file: File): "jpg" | "jpeg" | "png" | "webp" {
  const t = (file.type || "").toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("jpeg")) return "jpeg";
  if (t.includes("jpg")) return "jpg";
  // fallback
  return "jpg";
}

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

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
     Photo steps — baseline v1
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
        "Add a clear front view to continue — this helps anchor the exterior baseline.",
      whyItMatters:
        "This helps the report stay aligned to what you actually inspected.",
    },
    {
      id: "exterior-side-left",
      title: "Left side of the vehicle",
      guidance:
        "Capture the full left side profile. Include wheels and door lines.",
      image: "/photo-guides/side-left.png",
      required: true,
      requiredHint:
        "Add a clear left-side view to continue — this helps check panel alignment and stance.",
      whyItMatters:
        "Side profile photos help catch obvious misalignment or uneven stance.",
    },
    {
      id: "exterior-rear",
      title: "Rear of the vehicle",
      guidance:
        "Capture the full rear of the vehicle including bumper, boot, and tail-lights.",
      image: "/photo-guides/rear.png",
      required: true,
      requiredHint:
        "Add a clear rear view to continue — this completes the baseline exterior set.",
      whyItMatters:
        "Rear framing helps document overall condition and panel fit.",
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
      whyItMatters:
        "This completes the baseline set so the report has consistent context.",
    },
    {
      id: "tyres-wheels",
      title: "Tyres & wheels (optional)",
      guidance:
        "Capture close-ups only if something stands out. Otherwise you can skip.",
      whyItMatters:
        "A quick tyre photo can support notes like uneven wear or damage.",
    },
    {
      id: "interior",
      title: "Interior overview (optional)",
      guidance:
        "If permitted, capture a general interior view (driver seat + dashboard).",
      whyItMatters:
        "Interior photos help support notes about wear, smell, and condition.",
    },
    {
      id: "dashboard",
      title: "Dashboard (optional)",
      guidance:
        "If safe, capture the dashboard with ignition on to document warning lights.",
      whyItMatters:
        "This can help you remember what lights were present at inspection time.",
    },
    {
      id: "engine-bay",
      title: "Engine bay overview (optional)",
      guidance:
        "Only if permitted. Take a simple overview without touching anything.",
      whyItMatters:
        "This is for documentation only — not diagnosis.",
    },
    {
      id: "service-records",
      title: "Service records (optional)",
      guidance: "Capture stamped logbook pages or receipts if available.",
      whyItMatters:
        "Proof beats promises. A quick photo can reduce uncertainty later.",
    },
    {
      id: "vin",
      title: "VIN / compliance (optional)",
      guidance: "Capture the VIN plate or compliance sticker if easy to access.",
      whyItMatters:
        "This helps you verify details later if needed.",
    },
  ];

  const step = steps[stepIndex];
  const stepPhotos = photos.filter((p) => p.stepId === step.id);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [stepIndex]);

  /* =========================================================
     Upload to Supabase Storage
  ========================================================== */

  async function uploadPhotoToStorage(file: File): Promise<StepPhoto> {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      throw new Error(userErr.message || "Could not verify user session.");
    }
    if (!user) {
      throw new Error("You must be signed in to upload photos.");
    }

    const photoId = makeId();
    const ext = extFromFile(file);

    const objectPath = `users/${user.id}/scans/${scanId}/steps/${step.id}/${photoId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(objectPath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      });

    if (uploadErr) {
      throw new Error(uploadErr.message || "Upload failed.");
    }

    return {
      id: photoId,
      storagePath: objectPath,
      stepId: step.id,
    };
  }

  async function handleAddFile(file: File) {
    if (atHardLimit) return;

    setUploadError(null);
    setUploading(true);

    try {
      const uploaded = await uploadPhotoToStorage(file);

      setPhotos((prev) => [...prev, uploaded]);
    } catch (e: any) {
      console.error("[InPersonPhotos] upload error:", e);
      setUploadError(e?.message || "Could not upload photo.");
    } finally {
      setUploading(false);
    }
  }

  function handleUploadFromGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void handleAddFile(file);
    }
    e.target.value = "";
  }

  function handleTakePhoto() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    (input as any).capture = "environment";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        void handleAddFile(file);
      }
    };
    input.click();
  }

  async function removePhoto(id: string) {
    const target = photos.find((p) => p.id === id);
    if (!target) return;

    setUploadError(null);

    // Optimistic UI remove first
    setPhotos((prev) => prev.filter((p) => p.id !== id));

    try {
      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .remove([target.storagePath]);

      if (error) {
        console.warn("[InPersonPhotos] remove storage error:", error.message);
      }
    } catch (e) {
      console.warn("[InPersonPhotos] remove exception:", e);
    }
  }

  /* =========================================================
     Navigation
  ========================================================== */

  const mustHavePhotoForThisStep = Boolean(step.required);
  const hasAtLeastOneForStep = stepPhotos.length > 0;
  const canContinue = !mustHavePhotoForThisStep || hasAtLeastOneForStep;

  const percent = Math.round(((stepIndex + 1) / steps.length) * 100);

  function prevStep() {
    if (stepIndex === 0) {
      setShowExitConfirm(true);
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function nextStep() {
    if (!canContinue) return;
    if (uploading) return;

    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }

    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId,
      step: FIRST_CHECKS_ROUTE,
      photos,
      startedAt: existingProgress?.startedAt ?? new Date().toISOString(),
    });

    navigate(FIRST_CHECKS_ROUTE);
  }

  function skipStep() {
    if (step.required) return;
    if (uploading) return;
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
    <div ref={containerRef} className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={prevStep}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-xs text-slate-500">
          Photos · Step {stepIndex + 1} of {steps.length}
        </div>
      </div>

      {/* Mini progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
          <span>Evidence</span>
          <span>{percent}%</span>
        </div>

        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] uppercase tracking-wide text-slate-400">
          In-person scan — Photos
        </span>

        <h1 className="text-2xl font-semibold text-white">
          Capture inspection evidence
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed">
          These photos are for your report context and memory — not for
          diagnosing faults.
        </p>
      </div>

      {/* Step card */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-100">{step.title}</h2>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              {step.guidance}
            </p>
          </div>

          {step.required ? (
            <span className="shrink-0 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Required
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-[11px] text-slate-300">
              <ImageIcon className="h-4 w-4 text-slate-300" />
              Optional
            </span>
          )}
        </div>

        {step.image && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <img
              src={step.image}
              alt="Example framing"
              className="rounded-xl border border-white/10 w-full"
            />
            <p className="text-[11px] text-slate-500 mt-2">
              Example framing (use as a guide)
            </p>
          </div>
        )}

        {step.whyItMatters && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-slate-300 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="text-slate-200 font-medium">
                  Why this matters:{" "}
                </span>
                {step.whyItMatters}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Capture controls */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/60 px-5 py-5 space-y-4">
        {atHardLimit && (
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-300 mt-0.5" />
              <p className="text-sm text-slate-200 leading-relaxed">
                Photo limit reached ({MAX_PHOTOS}). Remove one to add more.
              </p>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-200 leading-relaxed">
              {uploadError}
            </p>
          </div>
        )}

        {uploading && (
          <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading photo…
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleTakePhoto}
            disabled={atHardLimit || uploading}
            className={[
              "rounded-xl px-4 py-3 font-semibold transition inline-flex items-center justify-center gap-2",
              atHardLimit || uploading
                ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 text-black",
            ].join(" ")}
          >
            <Camera className="h-4 w-4" />
            Take photo
          </button>

          <label
            className={
              atHardLimit || uploading ? "opacity-60 cursor-not-allowed" : ""
            }
          >
            <span
              className={[
                "w-full rounded-xl px-4 py-3 font-semibold transition inline-flex items-center justify-center gap-2",
                "border border-white/15 bg-slate-950/30 hover:bg-slate-900 text-slate-200",
              ].join(" ")}
            >
              <Upload className="h-4 w-4" />
              Upload
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadFromGallery}
              disabled={atHardLimit || uploading}
            />
          </label>
        </div>

        {/* Step photos */}
        {stepPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {stepPhotos.map((p) => (
              <div
                key={p.id}
                className="relative rounded-2xl border border-white/10 bg-slate-950/40 overflow-hidden"
              >
                {/* We do NOT store base64 anymore.
                    We intentionally show a placeholder tile instead.
                    Photos will display in the Results page reliably. */}
                <div className="h-28 w-full flex items-center justify-center text-slate-400 text-xs">
                  Uploaded
                </div>

                <button
                  onClick={() => void removePhoto(p.id)}
                  className="absolute top-2 right-2 rounded-full bg-black/70 hover:bg-black/80 text-white p-2"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-sm text-slate-300">
              No photos added for this step yet.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add one clear photo and move on — don’t overthink it.
            </p>
          </div>
        )}

        {!canContinue && step.required && (
          <p className="text-xs text-amber-200 font-semibold">
            {step.requiredHint}
          </p>
        )}
      </section>

      {/* Nav buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={prevStep}
          className="flex-1 rounded-xl border border-white/25 px-4 py-3 text-slate-200"
        >
          Back
        </button>

        {!step.required && (
          <button
            onClick={skipStep}
            disabled={uploading}
            className="flex-1 rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-3 text-slate-200 disabled:opacity-60"
          >
            Skip
          </button>
        )}

        <button
          onClick={nextStep}
          disabled={!canContinue || uploading}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-4 py-3 font-semibold text-black inline-flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <p className="text-[11px] text-slate-500 text-center">
        CarVerity helps you document observations — it does not diagnose
        mechanical faults.
      </p>

      {/* Exit confirm */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-6">
          <div className="bg-slate-900 border border-white/20 rounded-2xl px-6 py-5 space-y-3 max-w-md w-full">
            <h3 className="font-semibold text-white">Leave the photo step?</h3>
            <p className="text-sm text-slate-300">
              You can return later — your photos will remain in your report.
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
