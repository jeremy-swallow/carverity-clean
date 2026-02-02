// src/pages/InPersonSummary.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Camera,
  Sparkles,
  RefreshCcw,
  ClipboardCheck,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  loadProgress,
  clearProgress,
  saveProgress,
  type ScanProgress,
} from "../utils/scanProgress";
import { saveScan, generateScanId, loadScanById } from "../utils/scanStorage";

type PricingVerdict = "missing" | "info" | "room" | "concern";

/* =======================================================
   Storage config
======================================================= */
const PHOTO_BUCKET = "scan-photos";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

function formatMoney(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreFromChecks(checks: Record<string, any>) {
  const values = Object.values(checks || {});
  if (!values.length) return 0;

  let score = 100;

  for (const a of values) {
    const v = a?.value;
    if (v === "ok") score -= 0;
    if (v === "unsure") score -= 6;
    if (v === "concern") score -= 12;
  }

  return clamp(Math.round(score), 0, 100);
}

function countConcerns(checks: Record<string, any>) {
  return Object.values(checks || {}).filter((a: any) => a?.value === "concern")
    .length;
}

function countUnsure(checks: Record<string, any>) {
  return Object.values(checks || {}).filter((a: any) => a?.value === "unsure")
    .length;
}

function getPricingVerdict(args: {
  askingPrice?: number | null;
  concerns: number;
  unsure: number;
  issuesRecorded: number;
}): PricingVerdict {
  const { askingPrice, concerns, unsure, issuesRecorded } = args;

  if (!askingPrice || askingPrice <= 0) return "missing";

  // Heuristic: more issues => price sensitivity increases
  const issueScore = concerns * 2 + unsure * 1 + issuesRecorded * 0.25;

  if (issueScore >= 12) return "concern";
  if (issueScore >= 6) return "room";
  return "info";
}

function pricingCopy(verdict: PricingVerdict) {
  if (verdict === "missing") {
    return {
      tone: "info" as const,
      title: "Add the asking price",
      body:
        "This helps CarVerity assess whether the asking price looks aligned with what you recorded — and what to verify before you commit.",
    };
  }
  if (verdict === "concern") {
    return {
      tone: "warn" as const,
      title: "Asking price looks optimistic for what you recorded",
      body:
        "You captured multiple risk signals. The report will focus on what they mean, what to clarify, and what would make walking away reasonable.",
    };
  }
  if (verdict === "room") {
    return {
      tone: "info" as const,
      title: "Price sensitivity is elevated",
      body:
        "You recorded a few meaningful signals. The report will convert them into clear follow-ups and a buyer-safe decision guide.",
    };
  }
  return {
    tone: "good" as const,
    title: "Nothing you recorded strongly contradicts the asking price",
    body:
      "That’s a good sign — but the report will still highlight the few checks that matter most before you decide.",
  };
}

function parseAskingPrice(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;

  const rounded = Math.round(n);
  if (rounded <= 0) return null;

  return clamp(rounded, 1, 5_000_000);
}

function buildTitleFromProgress(progress: ScanProgress) {
  const parts = [
    progress?.vehicleYear,
    progress?.vehicleMake,
    progress?.vehicleModel,
  ].filter(Boolean);

  if (parts.length) return parts.join(" ");
  return "In-person inspection";
}

function scoreBand(score: number) {
  if (score >= 85) return { label: "Low risk", tone: "good" as const };
  if (score >= 70) return { label: "Mixed", tone: "info" as const };
  if (score >= 55) return { label: "Higher risk", tone: "warn" as const };
  return { label: "High risk", tone: "danger" as const };
}

function toneClasses(tone: "good" | "info" | "warn" | "danger") {
  if (tone === "good") {
    return {
      pill: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
      bar: "bg-emerald-500",
      icon: "text-emerald-300",
    };
  }
  if (tone === "warn") {
    return {
      pill: "bg-amber-500/10 text-amber-200 border-amber-500/20",
      bar: "bg-amber-400",
      icon: "text-amber-300",
    };
  }
  if (tone === "danger") {
    return {
      pill: "bg-rose-500/10 text-rose-200 border-rose-500/20",
      bar: "bg-rose-400",
      icon: "text-rose-300",
    };
  }
  return {
    pill: "bg-sky-500/10 text-sky-200 border-sky-500/20",
    bar: "bg-sky-400",
    icon: "text-sky-300",
  };
}

/**
 * Drive completion must NOT be inferred from default check fills.
 * It should reflect whether the user actually went through the Drive step.
 */
function hasVisitedDriveStep(progress: ScanProgress | null) {
  const step = String(progress?.step ?? "");
  return (
    step.includes("/scan/in-person/checks/drive") ||
    step.includes("checks/drive") ||
    step === "checks_drive" ||
    step === "drive"
  );
}

function hasAnyDriveAnswers(checks: Record<string, any>) {
  const driveIds = ["steering", "noise-hesitation", "adas-systems"];
  return driveIds.some((id) =>
    Boolean(checks?.[id]?.value || checks?.[id]?.note)
  );
}

function getThumbnailFromPhotos(photos: any[]): string | null {
  // Photos are now stored as { storagePath }, not dataUrl.
  // Keep backwards compatibility only (older builds might still have dataUrl).
  if (!Array.isArray(photos) || photos.length === 0) return null;

  const first = photos[0];
  if (first?.dataUrl && typeof first.dataUrl === "string") return first.dataUrl;

  const any = photos.find(
    (p) => typeof p?.dataUrl === "string" && p.dataUrl.length > 0
  );
  return any?.dataUrl ?? null;
}

/**
 * Ensure checks have explicit stored defaults.
 * - UI shows "Looks fine" by default, so we persist "ok" for missing items.
 * - Never overwrites an existing user choice.
 *
 * IMPORTANT:
 * - We DO NOT default-fill Drive checks unless the Drive step was actually visited,
 *   otherwise Summary would incorrectly mark Drive as "done".
 */
function ensureDefaultChecks(
  progress: ScanProgress,
  includeDriveDefaults: boolean
) {
  const baseCheckIds = [
    // Around the car
    "body-panels-paint",
    "tyre-wear",
    "brakes-visible",

    // Inside the cabin
    "interior-smell",
    "interior-condition",
    "seatbelts-trim",
    "aircon",
  ];

  const driveCheckIds = [
    // During the drive
    "steering",
    "noise-hesitation",
    "adas-systems",
  ];

  const allCheckIds = includeDriveDefaults
    ? [...baseCheckIds, ...driveCheckIds]
    : baseCheckIds;

  const existingChecks =
    progress?.checks && typeof progress.checks === "object"
      ? progress.checks
      : {};

  let changed = false;
  const nextChecks: Record<string, any> = { ...(existingChecks ?? {}) };

  for (const id of allCheckIds) {
    const existing = nextChecks[id];

    // If missing entirely, add default ok
    if (!existing || typeof existing !== "object") {
      nextChecks[id] = { value: "ok" };
      changed = true;
      continue;
    }

    // If exists but no value, set default ok
    if (!existing.value) {
      nextChecks[id] = { ...existing, value: "ok" };
      changed = true;
    }
  }

  if (!changed) return { changed: false, next: progress };

  return {
    changed: true,
    next: {
      ...(progress ?? {}),
      checks: nextChecks,
    } as ScanProgress,
  };
}

async function hasUnlockForScan(scanId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const reference = `scan:${scanId}`;

  const { data, error } = await supabase
    .from("credit_ledger")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_type", "in_person_scan_completed")
    .eq("reference", reference)
    .limit(1);

  if (error) {
    console.error("[Summary] Unlock check failed:", error);
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

async function createSignedUrlSafe(
  bucket: string,
  path: string,
  ttlSeconds: number
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, ttlSeconds);

    if (error) {
      console.warn("[InPersonSummary] createSignedUrl failed:", error.message);
      return null;
    }

    return data?.signedUrl ?? null;
  } catch (e) {
    console.warn("[InPersonSummary] createSignedUrl exception:", e);
    return null;
  }
}

function extractImperfectionPhotoPaths(progress: ScanProgress): string[] {
  const imps: any[] = Array.isArray((progress as any)?.imperfections)
    ? ((progress as any).imperfections as any[])
    : [];

  const paths: string[] = [];

  for (const imp of imps) {
    // Support: imp.storagePath
    if (typeof imp?.storagePath === "string" && imp.storagePath.length > 0) {
      paths.push(imp.storagePath);
    }

    // Support: imp.photos[]
    if (Array.isArray(imp?.photos)) {
      for (const p of imp.photos) {
        if (typeof p?.storagePath === "string" && p.storagePath.length > 0) {
          paths.push(p.storagePath);
        }
      }
    }
  }

  return Array.from(new Set(paths));
}

/* =======================================================
   Deduping helpers (prevents duplicate report rows)
======================================================= */

function dedupeByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

function normaliseProgressForDisplay(progress: ScanProgress): ScanProgress {
  const next: any = { ...(progress ?? {}) };

  // Step photos
  if (Array.isArray(next.photos)) {
    next.photos = dedupeByKey(next.photos, (p: any) => {
      const sp = String(p?.storagePath ?? "").trim();
      if (sp) return `sp:${sp}`;
      const id = String(p?.id ?? "").trim();
      if (id) return `id:${id}`;
      return "";
    });
  }

  // Follow-up photos
  if (Array.isArray(next.followUpPhotos)) {
    next.followUpPhotos = dedupeByKey(next.followUpPhotos, (p: any) => {
      const sp = String(p?.storagePath ?? "").trim();
      if (sp) return `sp:${sp}`;
      const id = String(p?.id ?? "").trim();
      if (id) return `id:${id}`;
      return "";
    });
  }

  // Imperfections
  if (Array.isArray(next.imperfections)) {
    next.imperfections = dedupeByKey(next.imperfections, (imp: any) => {
      const id = String(imp?.id ?? "").trim();
      if (id) return `id:${id}`;

      const label = String(imp?.label ?? "").trim().toLowerCase();
      const location = String(imp?.location ?? "").trim().toLowerCase();
      const note = String(imp?.note ?? "").trim().toLowerCase();
      const sev = String(imp?.severity ?? "").trim().toLowerCase();

      const composite = [sev, label, location, note].filter(Boolean).join("|");
      if (composite) return `c:${composite}`;

      return "";
    });
  }

  return next as ScanProgress;
}

export default function InPersonSummary() {
  const navigate = useNavigate();
  const { scanId: routeScanId } = useParams<{ scanId?: string }>();

  const [saving, setSaving] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [askingPriceInput, setAskingPriceInput] = useState<string>("");
  const [askingPriceTouched, setAskingPriceTouched] = useState(false);

  // Reactive copy so Summary reflects saved defaults immediately
  const [progressState, setProgressState] = useState<ScanProgress>(() => {
    return loadProgress() ?? {};
  });

  // Signed URLs for display (results-safe)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [photoUrlsLoading, setPhotoUrlsLoading] = useState(false);

  // Ensure scanId always exists for this flow
  const activeScanId: string = useMemo(() => {
    const existing = progressState?.scanId || routeScanId;
    if (existing && typeof existing === "string") return existing;
    return generateScanId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeScanId, progressState?.scanId]);

  /**
   * IMPORTANT:
   * After refresh, progressState might not contain photos if the user is viewing
   * a saved scan entry. We rehydrate from scanStorage.progressSnapshot.
   */
  const progressForDisplay: ScanProgress = useMemo(() => {
    const local = progressState ?? {};
    const hasPhotos =
      Array.isArray((local as any)?.photos) && (local as any).photos.length > 0;
    const hasFollowUps =
      Array.isArray((local as any)?.followUpPhotos) &&
      (local as any).followUpPhotos.length > 0;

    let chosen: ScanProgress = local;

    if (!hasPhotos && !hasFollowUps && activeScanId) {
      const saved = loadScanById(activeScanId);
      const snap = saved?.progressSnapshot;

      if (snap && typeof snap === "object") {
        chosen = {
          ...snap,
          scanId: (snap as any).scanId ?? activeScanId,
        } as ScanProgress;
      }
    }

    return normaliseProgressForDisplay(chosen);
  }, [progressState, activeScanId]);

  const followUps = progressForDisplay?.followUpPhotos ?? [];
  const checks = progressForDisplay?.checks ?? {};
  const photos = progressForDisplay?.photos ?? [];
  const fromOnlineScan = Boolean(progressForDisplay?.fromOnlineScan);

  const saleType =
    progressForDisplay?.saleType === "dealership" ||
    progressForDisplay?.saleType === "private"
      ? progressForDisplay.saleType
      : undefined;

  const saleName =
    typeof progressForDisplay?.saleName === "string"
      ? progressForDisplay.saleName
      : "";
  const saleSuburb =
    typeof progressForDisplay?.saleSuburb === "string"
      ? progressForDisplay.saleSuburb
      : "";

  const askingPrice: number | null =
    typeof progressForDisplay?.askingPrice === "number"
      ? progressForDisplay.askingPrice
      : null;

  useEffect(() => {
    const latest = loadProgress() ?? {};

    const merged: ScanProgress = {
      ...(latest ?? {}),
      type: "in-person" as const,
      scanId: activeScanId,
      step: "summary",
    };

    const visitedDrive =
      hasVisitedDriveStep(latest) || hasAnyDriveAnswers(latest?.checks ?? {});
    const { changed, next } = ensureDefaultChecks(merged, visitedDrive);

    const finalProgress = changed ? next : merged;

    saveProgress(finalProgress);
    setProgressState(finalProgress);

    // Initialise asking price input from stored value (once)
    setAskingPriceInput((prev) => {
      if (prev && prev.trim().length > 0) return prev;
      if (askingPrice && askingPrice > 0) return String(Math.round(askingPrice));
      return "";
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScanId]);

  const parsedAskingPrice = useMemo(() => {
    return parseAskingPrice(askingPriceInput);
  }, [askingPriceInput]);

  // Persist asking price into progress as user types
useEffect(() => {
  const latest = loadProgress() ?? {};
  const current =
    typeof latest?.askingPrice === "number" ? latest.askingPrice : null;

  if (parsedAskingPrice === current) return;

  const next: ScanProgress = {
    ...(latest ?? {}),
    type: "in-person" as const,
    scanId: activeScanId,
    step: "summary",
    askingPrice: parsedAskingPrice,
  };

  saveProgress(next);
  setProgressState(next);
}, [parsedAskingPrice, activeScanId]);

  // Load signed URLs for all photo paths we can display
  const allPhotoPathsKey = useMemo(() => {
    const stepPaths = (photos ?? [])
      .map((p: any) => String(p?.storagePath ?? ""))
      .filter(Boolean);

    const followPaths = (followUps ?? [])
      .map((p: any) => String(p?.storagePath ?? ""))
      .filter(Boolean);

    const impPaths = extractImperfectionPhotoPaths(progressForDisplay);

    return [...stepPaths, ...followPaths, ...impPaths].sort().join("|");
  }, [photos, followUps, progressForDisplay]);

  useEffect(() => {
    let cancelled = false;

    async function loadSignedUrls() {
      const stepPaths = (photos ?? [])
        .map((p: any) => String(p?.storagePath ?? ""))
        .filter(Boolean);

      const followPaths = (followUps ?? [])
        .map((p: any) => String(p?.storagePath ?? ""))
        .filter(Boolean);

      const impPaths = extractImperfectionPhotoPaths(progressForDisplay);

      const all = Array.from(new Set([...stepPaths, ...followPaths, ...impPaths]));

      if (all.length === 0) return;

      setPhotoUrlsLoading(true);

      try {
        const next: Record<string, string> = { ...photoUrls };

        for (const path of all) {
          if (next[path]) continue;

          const url = await createSignedUrlSafe(
            PHOTO_BUCKET,
            path,
            SIGNED_URL_TTL
          );

          if (url) next[path] = url;
        }

        if (!cancelled) setPhotoUrls(next);
      } finally {
        if (!cancelled) setPhotoUrlsLoading(false);
      }
    }

    void loadSignedUrls();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPhotoPathsKey]);

  const concerns = useMemo(() => countConcerns(checks), [checks]);
  const unsure = useMemo(() => countUnsure(checks), [checks]);
  const score = useMemo(() => scoreFromChecks(checks), [checks]);

  const issuesRecorded = useMemo(() => concerns + unsure, [concerns, unsure]);

  const verdict = useMemo(() => {
    return getPricingVerdict({
      askingPrice: parsedAskingPrice,
      concerns,
      unsure,
      issuesRecorded,
    });
  }, [parsedAskingPrice, concerns, unsure, issuesRecorded]);

  const verdictCopy = useMemo(() => pricingCopy(verdict), [verdict]);

  const band = useMemo(() => scoreBand(score), [score]);
  const bandTone = toneClasses(band.tone);
  const verdictTone = toneClasses(verdictCopy.tone);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsLoggedIn(Boolean(data.session));
      setAuthReady(true);
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      init();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSaveAndContinue() {
    if (!activeScanId) {
      alert("Missing scan id — please restart the inspection.");
      navigate("/scan/in-person/start", { replace: true });
      return;
    }

    setSaving(true);

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        alert("Please sign in to continue.");
        navigate("/signin", { replace: true });
        return;
      }

      const latest = loadProgress() ?? {};

      const merged: ScanProgress = {
        ...(latest ?? {}),
        type: "in-person" as const,
        scanId: activeScanId,
        step: "summary",
        askingPrice: parsedAskingPrice,
      };

      const visitedDrive =
        hasVisitedDriveStep(latest) || hasAnyDriveAnswers(latest?.checks ?? {});
      const { changed, next } = ensureDefaultChecks(merged, visitedDrive);

      const progressForSave = changed ? next : merged;

      saveProgress(progressForSave);
      setProgressState(progressForSave);

      const title = buildTitleFromProgress(progressForSave);
      const thumbnail = getThumbnailFromPhotos(progressForSave?.photos ?? []);

      const checksForSave = progressForSave?.checks ?? {};
      const concernsForSave = countConcerns(checksForSave);
      const unsureForSave = countUnsure(checksForSave);
      const scoreForSave = scoreFromChecks(checksForSave);
      const issuesRecordedForSave = concernsForSave + unsureForSave;

      await saveScan({
        id: activeScanId,
        type: "in-person",
        title,
        createdAt: new Date().toISOString(),

        vehicle: {
          make: progressForSave?.vehicleMake,
          model: progressForSave?.vehicleModel,
          year:
            typeof progressForSave?.vehicleYear === "number"
              ? String(progressForSave.vehicleYear)
              : undefined,
          variant: progressForSave?.vehicleVariant || undefined,
        },

        sale:
          saleType || saleName || saleSuburb
            ? {
                type: saleType,
                name: saleName || undefined,
                suburb: saleSuburb || undefined,
              }
            : undefined,

        thumbnail,

        askingPrice: parsedAskingPrice,
        score: scoreForSave,
        concerns: concernsForSave,
        unsure: unsureForSave,

        imperfectionsCount: issuesRecordedForSave,

        photosCount: (progressForSave?.photos ?? []).length,
        fromOnlineScan,
        progressSnapshot: progressForSave, // ✅ critical: persist photo storagePath refs
      });

      const unlocked = await hasUnlockForScan(activeScanId);

      if (unlocked) {
        const nextProg: ScanProgress = {
          ...(loadProgress() ?? {}),
          type: "in-person" as const,
          scanId: activeScanId,
          step: "analyzing",
        };

        saveProgress(nextProg);
        setProgressState(nextProg);

        navigate(`/scan/in-person/analyzing/${activeScanId}`, { replace: true });
        return;
      }

      const nextProg: ScanProgress = {
        ...(loadProgress() ?? {}),
        type: "in-person" as const,
        scanId: activeScanId,
        step: "unlock",
      };

      saveProgress(nextProg);
      setProgressState(nextProg);

      navigate(`/scan/in-person/unlock/${activeScanId}`, { replace: true });
    } catch (e) {
      console.error("[InPersonSummary] save failed:", e);
      alert("Failed to save scan. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleStartOver() {
    if (!confirm("Start over? This will clear your current inspection.")) {
      return;
    }
    clearProgress();
    setProgressState({});
    navigate("/scan/in-person/start", { replace: true });
  }

  function handleDoDriveNow() {
    const nextProg: ScanProgress = {
      ...(loadProgress() ?? {}),
      type: "in-person" as const,
      scanId: activeScanId,
      step: "checks_drive",
    };

    saveProgress(nextProg);
    setProgressState(nextProg);

    navigate("/scan/in-person/checks/drive-intro");
  }

  const canContinue = Boolean(activeScanId);

  const showAskingPriceError =
    askingPriceTouched &&
    askingPriceInput.trim().length > 0 &&
    !parsedAskingPrice;

  const driveWasSkippedOrMissing = useMemo(() => {
    const visitedDrive =
      hasVisitedDriveStep(progressState) ||
      hasAnyDriveAnswers(progressState?.checks ?? {});
    return !visitedDrive;
  }, [progressState]);

  const displayStepPhotos = (photos ?? []).filter(
    (p: any) => typeof p?.storagePath === "string" && p.storagePath.length > 0
  );

  const displayFollowUpPhotos = (followUps ?? []).filter(
    (p: any) =>
      typeof (p as any)?.storagePath === "string" &&
      (p as any).storagePath.length > 0
  );

  const displayImperfectionPaths =
    extractImperfectionPhotoPaths(progressForDisplay);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          In-person inspection
        </p>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[240px]">
            <h1 className="text-3xl md:text-4xl font-semibold text-white">
              Summary
            </h1>
            <p className="text-slate-400 mt-3 max-w-2xl leading-relaxed">
              This is a clear snapshot of what you recorded. Next, CarVerity will
              convert it into a buyer-safe report with reasoning and practical
              next steps — without hype or pressure.
            </p>
          </div>

          <div
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
              "text-xs font-semibold",
              bandTone.pill,
            ].join(" ")}
          >
            <CheckCircle2 className={["h-4 w-4", bandTone.icon].join(" ")} />
            {band.label}
          </div>
        </div>
      </header>

      {driveWasSkippedOrMissing && (
        <div className="mb-8 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-300 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                Skipped test drive earlier — you can still do it now
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                If the situation changed (or you tapped skip by accident), you
                can run the quick drive checks before generating the report.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDoDriveNow}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 text-sm"
                >
                  Do drive checks now
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/scan/in-person/checks/inside")}
                  className="rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-2 text-sm text-slate-200"
                >
                  Go back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Score card */}
        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Overall score
              </p>
              <div className="mt-4 flex items-end gap-3">
                <div className="text-5xl font-semibold text-white tabular-nums">
                  {score}
                </div>
                <div className="pb-1">
                  <p className="text-sm text-slate-400">out of 100</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Snapshot
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This score reflects your recorded answers only.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={["h-full rounded-full", bandTone.bar].join(" ")}
                style={{ width: `${clamp(score, 0, 100)}%` }}
              />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Concerns
                </p>
                <p className="text-lg font-semibold text-white tabular-nums mt-1">
                  {concerns}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Unsure
                </p>
                <p className="text-lg font-semibold text-white tabular-nums mt-1">
                  {unsure}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Notes
                </p>
                <p className="text-lg font-semibold text-white tabular-nums mt-1">
                  {followUps.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="h-4 w-4 text-slate-300 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Evidence considered
                </p>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  This report is based on the information you recorded during
                  the inspection: your marked concerns, items you selected as
                  unsure, your notes, and any photos captured. Items you did not
                  record are treated as not assessed (not as positive or
                  negative).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Asking price + verdict */}
        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-[240px] flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Advertised asking price (AUD)
              </p>

              <div className="mt-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    $
                  </span>
                  <input
                    value={askingPriceInput}
                    onChange={(e) => setAskingPriceInput(e.target.value)}
                    onBlur={() => {
  setAskingPriceTouched(true);

  const latest = loadProgress() ?? {};
  const next: ScanProgress = {
    ...(latest ?? {}),
    type: "in-person" as const,
    scanId: activeScanId,
    step: "summary",
    askingPrice: parsedAskingPrice,
  };

  saveProgress(next);
  setProgressState(next);
}}
                    inputMode="numeric"
                    placeholder="e.g. 18,990"
                    className={[
                      "w-full rounded-xl border bg-slate-950/40 px-9 py-3 text-white",
                      "placeholder:text-slate-600 outline-none",
                      showAskingPriceError
                        ? "border-amber-400/50 focus:border-amber-400/70"
                        : "border-white/10 focus:border-emerald-400/40",
                    ].join(" ")}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    Used to assess price alignment with your recorded evidence.
                  </p>

                  <p className="text-xs text-slate-400">
                    Saved as:{" "}
                    <span className="text-slate-200 font-semibold tabular-nums">
                      {formatMoney(parsedAskingPrice)}
                    </span>
                  </p>
                </div>

                {showAskingPriceError && (
                  <p className="text-xs text-amber-200 mt-2">
                    Enter a valid price (numbers only).
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Current
                </p>
                <p className="text-lg font-semibold text-white tabular-nums mt-1">
                  {formatMoney(parsedAskingPrice)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <div className="flex items-start gap-3">
              {verdictCopy.tone === "warn" ? (
                <AlertTriangle
                  className={["h-4 w-4 mt-0.5", verdictTone.icon].join(" ")}
                />
              ) : verdictCopy.tone === "good" ? (
                <CheckCircle2
                  className={["h-4 w-4 mt-0.5", verdictTone.icon].join(" ")}
                />
              ) : (
                <Info
                  className={["h-4 w-4 mt-0.5", verdictTone.icon].join(" ")}
                />
              )}

              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  {verdictCopy.title}
                </p>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {verdictCopy.body}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-slate-500 inline-flex items-center gap-2">
                    <Camera className="h-3.5 w-3.5 text-slate-400" />
                    Photos captured:{" "}
                    <span className="text-slate-200 tabular-nums font-semibold">
                      {photos.length}
                    </span>
                  </span>

                  <span className="text-xs text-slate-500 inline-flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                    Issues recorded:{" "}
                    <span className="text-slate-200 tabular-nums font-semibold">
                      {issuesRecorded}
                    </span>
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-slate-200 font-semibold">
                      Buyer-safe logic:
                    </span>{" "}
                    CarVerity won’t “fill in gaps”. If you marked items as
                    unsure, the report treats them as questions to clarify — not
                    automatic negatives.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Photos preview (NEW) */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/30 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-300" />
                <p className="text-sm font-semibold text-white">
                  Photos captured
                </p>
              </div>
              <p className="text-xs text-slate-500 tabular-nums">
                {displayStepPhotos.length +
                  displayFollowUpPhotos.length +
                  displayImperfectionPaths.length}{" "}
                total
              </p>
            </div>

            {photoUrlsLoading && (
              <p className="text-xs text-slate-500 mt-3">Loading previews…</p>
            )}

            {displayStepPhotos.length === 0 &&
            displayFollowUpPhotos.length === 0 &&
            displayImperfectionPaths.length === 0 ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm text-slate-300">
                  No photos were captured for this scan.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  That’s okay — your report will still be generated from your
                  recorded answers and notes.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                {displayStepPhotos.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Inspection photos
                    </p>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {displayStepPhotos.map((p: any) => {
                        const url = photoUrls[p.storagePath];
                        return (
                          <div
                            key={p.id}
                            className="rounded-2xl border border-white/10 bg-slate-950/40 overflow-hidden"
                          >
                            {url ? (
                              <img
                                src={url}
                                alt="Inspection photo"
                                className="w-full h-28 object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-28 w-full flex items-center justify-center text-slate-400 text-xs">
                                Uploaded
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {displayFollowUpPhotos.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Follow-up photos
                    </p>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {displayFollowUpPhotos.map((p: any) => {
                        const url = photoUrls[p.storagePath];
                        return (
                          <div
                            key={p.id}
                            className="rounded-2xl border border-white/10 bg-slate-950/40 overflow-hidden"
                          >
                            {url ? (
                              <img
                                src={url}
                                alt="Follow-up photo"
                                className="w-full h-28 object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-28 w-full flex items-center justify-center text-slate-400 text-xs">
                                Uploaded
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {displayImperfectionPaths.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Imperfection photos
                    </p>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {displayImperfectionPaths.map((path) => {
                        const url = photoUrls[path];
                        return (
                          <div
                            key={path}
                            className="rounded-2xl border border-white/10 bg-slate-950/40 overflow-hidden"
                          >
                            {url ? (
                              <img
                                src={url}
                                alt="Imperfection photo"
                                className="w-full h-28 object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-28 w-full flex items-center justify-center text-slate-400 text-xs">
                                Uploaded
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                What you’ll get
              </p>
              <p className="text-sm text-slate-200 font-semibold mt-2">
                Clear reasoning
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                “Why this matters” explanations tied to what you recorded.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                What to do next
              </p>
              <p className="text-sm text-slate-200 font-semibold mt-2">
                Practical follow-ups
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                The few questions that reduce buyer regret the most.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Price alignment
              </p>
              <p className="text-sm text-slate-200 font-semibold mt-2">
                Sanity-check signal
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                A grounded read on whether the asking price fits what you
                recorded.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <section className="mt-10 rounded-2xl border border-white/10 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">
              Ready to generate your report?
            </p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              A credit is used when report generation begins. If you want to
              change anything, review checks first.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleStartOver}
              className="rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-2 text-sm text-slate-200 inline-flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4 text-slate-300" />
              Start over
            </button>

            <button
              onClick={() => {
                const nextProg: ScanProgress = {
                  ...(loadProgress() ?? {}),
                  type: "in-person" as const,
                  scanId: activeScanId,
                  step: "checks_intro",
                };
                saveProgress(nextProg);
                setProgressState(nextProg);
                navigate("/scan/in-person/checks/intro");
              }}
              className="rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-2 text-sm text-slate-200 inline-flex items-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4 text-slate-300" />
              Review checks
            </button>

            <button
              onClick={handleSaveAndContinue}
              disabled={!canContinue || saving || (authReady && !isLoggedIn)}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold transition inline-flex items-center gap-2",
                "bg-emerald-500 hover:bg-emerald-400 text-black",
                !canContinue || saving || (authReady && !isLoggedIn)
                  ? "opacity-60 cursor-not-allowed"
                  : "",
              ].join(" ")}
            >
              <ArrowRight className="h-4 w-4" />
              {saving ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>

        {authReady && !isLoggedIn && (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-200 font-semibold">
              Sign in required to continue
            </p>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              To generate and store your report, you’ll need to sign in.
            </p>
            <div className="mt-3">
              <button
                onClick={() => navigate("/signin", { replace: true })}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-semibold px-4 py-2 text-sm"
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Footer reassurance */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/30 p-5">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-slate-300 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              Buyer-safe guidance, not car-yard hype
            </p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              CarVerity is designed to reduce buyer regret. The report focuses
              on what your inspection means, what to clarify, and when to walk
              away — without scripts or pressure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
