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
  CircleHelp,
  ShieldCheck,
  FileSearch,
  CircleDot,
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
type UiTone = "good" | "info" | "warn" | "danger";

type DebriefCard = {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: UiTone;
};

type DebriefCopy = {
  tone: UiTone;
  eyebrow: string;
  title: string;
  body: string;
  reassurance: string;
};

type UnknownItem = {
  id: string;
  title: string;
  body: string;
  actionLabel?: string;
  action?: () => void;
};

type NextStepItem = {
  id: string;
  title: string;
  body: string;
  tone: UiTone;
};

/* =======================================================
   Storage config
======================================================= */
const PHOTO_BUCKET = "scan-photos";
const SIGNED_URL_TTL = 60 * 60; // 1 hour;

/* =======================================================
   Shared check ids
======================================================= */
const DRIVE_CHECK_IDS = [
  "steering",
  "noise-hesitation",
  "braking",
  "adas-systems",
] as const;

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
  const values = Object.values(checks || {}).filter(
    (a: any) =>
      a &&
      typeof a === "object" &&
      (a.value === "ok" || a.value === "unsure" || a.value === "concern")
  );

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

function countOk(checks: Record<string, any>) {
  return Object.values(checks || {}).filter((a: any) => a?.value === "ok")
    .length;
}

function countNotesOnly(checks: Record<string, any>) {
  return Object.values(checks || {}).filter((a: any) => {
    if (!a || typeof a !== "object") return false;
    const hasValidValue =
      a.value === "ok" || a.value === "unsure" || a.value === "concern";
    const hasNote = typeof a.note === "string" && a.note.trim().length > 0;
    return !hasValidValue && hasNote;
  }).length;
}

function getPricingVerdict(args: {
  askingPrice?: number | null;
  concerns: number;
  unsure: number;
  issuesRecorded: number;
}): PricingVerdict {
  const { askingPrice, concerns, unsure, issuesRecorded } = args;

  if (!askingPrice || askingPrice <= 0) return "missing";

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

function toneClasses(tone: UiTone) {
  if (tone === "good") {
    return {
      pill: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
      bar: "bg-emerald-500",
      icon: "text-emerald-300",
      card: "border-emerald-500/20 bg-emerald-500/8",
    };
  }
  if (tone === "warn") {
    return {
      pill: "bg-amber-500/10 text-amber-200 border-amber-500/20",
      bar: "bg-amber-400",
      icon: "text-amber-300",
      card: "border-amber-500/20 bg-amber-500/8",
    };
  }
  if (tone === "danger") {
    return {
      pill: "bg-rose-500/10 text-rose-200 border-rose-500/20",
      bar: "bg-rose-400",
      icon: "text-rose-300",
      card: "border-rose-500/20 bg-rose-500/8",
    };
  }
  return {
    pill: "bg-sky-500/10 text-sky-200 border-sky-500/20",
    bar: "bg-sky-400",
    icon: "text-sky-300",
    card: "border-sky-500/20 bg-sky-500/8",
  };
}

function scoreExplanation(args: {
  concerns: number;
  unsure: number;
  answeredChecks: number;
}) {
  const { concerns, unsure, answeredChecks } = args;

  if (answeredChecks === 0) {
    return {
      title: "No scored answers recorded yet",
      body:
        "This is not a clean bill of health. It simply means there is not enough recorded evidence yet for CarVerity to judge risk.",
    };
  }

  if (concerns === 0 && unsure === 0) {
    return {
      title: "Your recorded answers were mostly reassuring",
      body:
        "That does not prove the car is problem-free — it only means you did not record concerns or unknowns in the checks you completed.",
    };
  }

  if (concerns === 0 && unsure > 0) {
    return {
      title: "Unknowns are pulling the score down",
      body:
        "A lower score here does not automatically mean the car is bad. It often means there are still unanswered questions worth clarifying.",
    };
  }

  if (concerns > 0 && unsure === 0) {
    return {
      title: "Recorded concerns are driving this score",
      body:
        "This score is reacting to issues you actually noticed. It is a prompt to slow down, understand those signals, and decide whether they change the value or the risk.",
    };
  }

  return {
    title: "This score reflects a mix of concerns and unknowns",
    body:
      "It is not a verdict on the whole car. It is a grounded summary of what you recorded, plus what still needs clarification before you commit.",
  };
}

function buildDebriefCopy(args: {
  concerns: number;
  unsure: number;
  answeredChecks: number;
  okCount: number;
  notesOnly: number;
  driveWasSkippedOrMissing: boolean;
  hasPhotos: boolean;
  hasAskingPrice: boolean;
}): DebriefCopy {
  const {
    concerns,
    unsure,
    answeredChecks,
    okCount,
    notesOnly,
    driveWasSkippedOrMissing,
    hasPhotos,
    hasAskingPrice,
  } = args;

  const evidenceSignals = concerns + unsure + okCount + notesOnly;
  const unknownSignals =
    (driveWasSkippedOrMissing ? 1 : 0) +
    (!hasAskingPrice ? 1 : 0) +
    (!hasPhotos ? 1 : 0);

  if (answeredChecks === 0 && notesOnly === 0) {
    return {
      tone: "info",
      eyebrow: "Guided debrief",
      title: "Not enough has been recorded yet to feel confident",
      body:
        "This summary is intentionally cautious. CarVerity only works from what you actually captured, so skipped or missing items stay neutral instead of being treated as good news.",
      reassurance:
        "That is a safer result than pretending the car looked fine. You can still review checks, add the drive step, or continue and let the report explain where the uncertainty sits.",
    };
  }

  if (concerns >= 3 || (concerns >= 2 && unsure >= 2)) {
    return {
      tone: "warn",
      eyebrow: "Guided debrief",
      title: "A few recorded signals suggest slowing down here",
      body:
        "You recorded multiple issues or doubts during the inspection. That does not automatically rule the car out, but it does mean the next step should focus on clarity rather than confidence.",
      reassurance:
        "CarVerity will separate what you clearly observed from what still needs checking, so you are not pushed into a false yes or no.",
    };
  }

  if (concerns > 0 && unknownSignals > 0) {
    return {
      tone: "warn",
      eyebrow: "Guided debrief",
      title: "Some real concerns were recorded — and a few gaps still remain",
      body:
        "This is the kind of inspection where clarity matters most. You have recorded reasons to be cautious, but there are also some parts of the picture that are still unfinished or unverified.",
      reassurance:
        "The report will keep those two things separate: known issues on one side, unresolved unknowns on the other.",
    };
  }

  if (concerns === 0 && unsure > 0) {
    return {
      tone: "info",
      eyebrow: "Guided debrief",
      title: "Nothing major was flagged, but there are still some question marks",
      body:
        "Most of the caution here comes from uncertainty rather than confirmed problems. That is useful, because buyer regret often comes from vague doubts that never got clarified.",
      reassurance:
        "CarVerity will treat those unknowns as follow-ups to resolve, not as automatic negatives.",
    };
  }

  if (concerns === 0 && unsure === 0 && evidenceSignals > 0) {
    return {
      tone: "good",
      eyebrow: "Guided debrief",
      title: "What you recorded looks fairly reassuring so far",
      body:
        "Based on the answers you explicitly recorded, nothing stands out as a major warning sign. That is encouraging, but it is still only a summary of what you captured on the day.",
      reassurance:
        "Missing items are not being quietly counted as positive. The app is only giving credit to evidence you actually entered.",
    };
  }

  return {
    tone: "info",
    eyebrow: "Guided debrief",
    title: "You have a usable inspection snapshot — with some areas still to clarify",
    body:
      "This summary is designed to help you think clearly, not rush toward a verdict. It reflects the inspection you recorded, including any uncertainty that still needs follow-up.",
    reassurance:
      "The next step will turn this into a calmer buyer-safe interpretation of what is known, what is unclear, and what matters most.",
  };
}

function buildStandoutCards(args: {
  concerns: number;
  unsure: number;
  answeredChecks: number;
  okCount: number;
  notesOnly: number;
  driveWasSkippedOrMissing: boolean;
  photosCount: number;
}): DebriefCard[] {
  const {
    concerns,
    unsure,
    answeredChecks,
    okCount,
    notesOnly,
    driveWasSkippedOrMissing,
    photosCount,
  } = args;

  const cards: DebriefCard[] = [
    {
      id: "concerns",
      label: "Recorded concerns",
      value: String(concerns),
      helper:
        concerns > 0
          ? "These are the clearest reasons to slow down."
          : "No explicit concern selections were recorded.",
      tone: concerns > 0 ? "warn" : "good",
    },
    {
      id: "unsure",
      label: "Recorded unknowns",
      value: String(unsure),
      helper:
        unsure > 0
          ? "These are questions still worth clarifying."
          : "No explicit unsure selections were recorded.",
      tone: unsure > 0 ? "info" : "good",
    },
    {
      id: "answered",
      label: "Scored answers",
      value: String(answeredChecks),
      helper:
        answeredChecks > 0
          ? "Only explicit answers influence the score."
          : "No scored evidence has been captured yet.",
      tone: answeredChecks > 0 ? "info" : "warn",
    },
  ];

  cards.push({
    id: "supporting-evidence",
    label: "Support captured",
    value: `${okCount + notesOnly + photosCount}`,
    helper:
      okCount + notesOnly + photosCount > 0
        ? "Includes reassuring answers, notes and photos."
        : "Very little supporting evidence has been captured.",
    tone: okCount + notesOnly + photosCount > 0 ? "good" : "info",
  });

  cards.push({
    id: "drive-status",
    label: "Drive step",
    value: driveWasSkippedOrMissing ? "Not assessed" : "Recorded",
    helper: driveWasSkippedOrMissing
      ? "You can still complete the quick drive checks now."
      : "Drive impressions are part of this summary.",
    tone: driveWasSkippedOrMissing ? "warn" : "good",
  });

  return cards;
}

function buildNextSteps(args: {
  concerns: number;
  unsure: number;
  answeredChecks: number;
  driveWasSkippedOrMissing: boolean;
  hasAskingPrice: boolean;
  hasPhotos: boolean;
}): NextStepItem[] {
  const {
    concerns,
    unsure,
    answeredChecks,
    driveWasSkippedOrMissing,
    hasAskingPrice,
    hasPhotos,
  } = args;

  const items: NextStepItem[] = [];

  if (concerns > 0) {
    items.push({
      id: "concern-follow-up",
      title: "Focus first on the issues you clearly noticed",
      body:
        "The report will prioritise the few concern signals that are most likely to affect risk, confidence or value.",
      tone: "warn",
    });
  }

  if (unsure > 0) {
    items.push({
      id: "unsure-follow-up",
      title: "Turn uncertainty into specific follow-up questions",
      body:
        "Unknowns are often where regret hides. The report will turn them into practical things to verify before deciding.",
      tone: "info",
    });
  }

  if (answeredChecks === 0) {
    items.push({
      id: "low-evidence",
      title: "Low recorded evidence means lower confidence",
      body:
        "A thin inspection should stay cautious. CarVerity will avoid giving false reassurance when not much was actually entered.",
      tone: "warn",
    });
  }

  if (driveWasSkippedOrMissing) {
    items.push({
      id: "drive-gap",
      title: "The drive step is still a gap in the picture",
      body:
        "Steering, braking and hesitation can change how safe or settled the car feels. Completing that step now would strengthen the report.",
      tone: "warn",
    });
  }

  if (!hasAskingPrice) {
    items.push({
      id: "price-gap",
      title: "Price alignment is still incomplete",
      body:
        "Adding the asking price gives the report a better read on whether what you recorded feels proportionate to the advertised number.",
      tone: "info",
    });
  }

  if (!hasPhotos) {
    items.push({
      id: "photo-gap",
      title: "No visual evidence was captured",
      body:
        "That is not a blocker. The report can still work from your answers and notes, but photos can make later review easier.",
      tone: "info",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "balanced",
      title: "You have enough recorded detail to generate a grounded report",
      body:
        "The next step is less about collecting more and more about interpreting what you already captured in a calm, buyer-safe way.",
      tone: "good",
    });
  }

  return items.slice(0, 3);
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
  return DRIVE_CHECK_IDS.some((id) =>
    Boolean(checks?.[id]?.value || checks?.[id]?.note)
  );
}

function getThumbnailFromPhotos(photos: any[]): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null;

  const first = photos[0];
  if (first?.dataUrl && typeof first.dataUrl === "string") return first.dataUrl;

  const any = photos.find(
    (p) => typeof p?.dataUrl === "string" && p.dataUrl.length > 0
  );
  return any?.dataUrl ?? null;
}

/**
 * Clean checks without silently defaulting missing items to "ok".
 * This preserves only valid explicit selections and useful notes.
 */
function sanitiseChecks(progress: ScanProgress) {
  const existingChecks =
    progress?.checks && typeof progress.checks === "object"
      ? progress.checks
      : {};

  let changed = false;
  const nextChecks: Record<string, any> = {};

  for (const [id, existing] of Object.entries(existingChecks)) {
    if (!existing || typeof existing !== "object") {
      changed = true;
      continue;
    }

    const rawValue = (existing as any).value;
    const rawNote = (existing as any).note;
    const note =
      typeof rawNote === "string" && rawNote.trim().length > 0
        ? rawNote
        : undefined;

    if (
      rawValue === "ok" ||
      rawValue === "concern" ||
      rawValue === "unsure"
    ) {
      nextChecks[id] = note ? { value: rawValue, note } : { value: rawValue };

      if ((existing as any).note !== note) changed = true;
      continue;
    }

    if (note) {
      nextChecks[id] = { note };
      changed = true;
      continue;
    }

    changed = true;
  }

  const sameKeys =
    Object.keys(existingChecks).length === Object.keys(nextChecks).length;

  if (!changed && sameKeys) {
    return { changed: false, next: progress };
  }

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
    if (typeof imp?.storagePath === "string" && imp.storagePath.length > 0) {
      paths.push(imp.storagePath);
    }

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

  if (Array.isArray(next.photos)) {
    next.photos = dedupeByKey(next.photos, (p: any) => {
      const sp = String(p?.storagePath ?? "").trim();
      if (sp) return `sp:${sp}`;
      const id = String(p?.id ?? "").trim();
      if (id) return `id:${id}`;
      return "";
    });
  }

  if (Array.isArray(next.followUpPhotos)) {
    next.followUpPhotos = dedupeByKey(next.followUpPhotos, (p: any) => {
      const sp = String(p?.storagePath ?? "").trim();
      if (sp) return `sp:${sp}`;
      const id = String(p?.id ?? "").trim();
      if (id) return `id:${id}`;
      return "";
    });
  }

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

  const [progressState, setProgressState] = useState<ScanProgress>(() => {
    return loadProgress() ?? {};
  });

  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [photoUrlsLoading, setPhotoUrlsLoading] = useState(false);

  const activeScanId: string = useMemo(() => {
    const existing = progressState?.scanId || routeScanId;
    if (existing && typeof existing === "string") return existing;
    return generateScanId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeScanId, progressState?.scanId]);

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

    const { changed, next } = sanitiseChecks(merged);
    const finalProgress = changed ? next : merged;

    saveProgress(finalProgress);
    setProgressState(finalProgress);

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

      const all = Array.from(
        new Set([...stepPaths, ...followPaths, ...impPaths])
      );

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
  const okCount = useMemo(() => countOk(checks), [checks]);
  const notesOnly = useMemo(() => countNotesOnly(checks), [checks]);
  const score = useMemo(() => scoreFromChecks(checks), [checks]);

  const answeredChecks = useMemo(
    () =>
      Object.values(checks || {}).filter((a: any) =>
        Boolean(
          a &&
            typeof a === "object" &&
            (a.value === "ok" || a.value === "unsure" || a.value === "concern")
        )
      ).length,
    [checks]
  );

  const issuesRecorded = useMemo(() => concerns + unsure, [concerns, unsure]);

  const scoreCopy = useMemo(
    () =>
      scoreExplanation({
        concerns,
        unsure,
        answeredChecks,
      }),
    [concerns, unsure, answeredChecks]
  );

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

    void init();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void init();
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

      const { changed, next } = sanitiseChecks(merged);
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
        progressSnapshot: progressForSave,
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

        navigate(`/scan/in-person/analyzing/${activeScanId}`, {
          replace: true,
        });
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

  const totalDisplayPhotos =
    displayStepPhotos.length +
    displayFollowUpPhotos.length +
    displayImperfectionPaths.length;

  const hasPhotos = totalDisplayPhotos > 0;
  const hasAskingPrice = Boolean(parsedAskingPrice && parsedAskingPrice > 0);

  const debriefCopy = useMemo(
    () =>
      buildDebriefCopy({
        concerns,
        unsure,
        answeredChecks,
        okCount,
        notesOnly,
        driveWasSkippedOrMissing,
        hasPhotos,
        hasAskingPrice,
      }),
    [
      concerns,
      unsure,
      answeredChecks,
      okCount,
      notesOnly,
      driveWasSkippedOrMissing,
      hasPhotos,
      hasAskingPrice,
    ]
  );

  const debriefTone = toneClasses(debriefCopy.tone);

  const standoutCards = useMemo(
    () =>
      buildStandoutCards({
        concerns,
        unsure,
        answeredChecks,
        okCount,
        notesOnly,
        driveWasSkippedOrMissing,
        photosCount: totalDisplayPhotos,
      }),
    [
      concerns,
      unsure,
      answeredChecks,
      okCount,
      notesOnly,
      driveWasSkippedOrMissing,
      totalDisplayPhotos,
    ]
  );

  const unknownItems = useMemo(() => {
    const items: UnknownItem[] = [];

    if (driveWasSkippedOrMissing) {
      items.push({
        id: "drive",
        title: "Drive impressions are still missing",
        body:
          "Steering, braking, hesitation and driver-assist behaviour were not clearly recorded. That does not count as a positive result — it simply stays unassessed.",
        actionLabel: "Do drive checks now",
        action: handleDoDriveNow,
      });
    }

    if (!hasAskingPrice) {
      items.push({
        id: "price",
        title: "Price alignment cannot be judged properly yet",
        body:
          "Without the advertised price, the report can still explain risk — but it cannot properly judge whether the number feels fair for what you recorded.",
      });
    }

    if (!hasPhotos) {
      items.push({
        id: "photos",
        title: "No photo evidence was captured",
        body:
          "That is okay. The report can still use your answers and notes, but there will be less visual context to refer back to later.",
      });
    }

    if (answeredChecks === 0 && notesOnly === 0) {
      items.push({
        id: "answers",
        title: "Very little inspection evidence has been recorded",
        body:
          "A low-information inspection should stay cautious. CarVerity will avoid filling in the blanks or acting more confident than the evidence allows.",
      });
    }

    return items;
  }, [
    driveWasSkippedOrMissing,
    hasAskingPrice,
    hasPhotos,
    answeredChecks,
    notesOnly,
  ]);

  const nextStepItems = useMemo(
    () =>
      buildNextSteps({
        concerns,
        unsure,
        answeredChecks,
        driveWasSkippedOrMissing,
        hasAskingPrice,
        hasPhotos,
      }),
    [
      concerns,
      unsure,
      answeredChecks,
      driveWasSkippedOrMissing,
      hasAskingPrice,
      hasPhotos,
    ]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          In-person inspection
        </p>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[260px]">
            <h1 className="text-3xl md:text-4xl font-semibold text-white">
              Guided summary
            </h1>
            <p className="text-slate-400 mt-3 max-w-2xl leading-relaxed">
              This page is designed to help you slow down and make sense of what
              you actually recorded — not rush you toward a verdict.
            </p>
          </div>

          <div
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
              "text-xs font-semibold",
              bandTone.pill,
            ].join(" ")}
          >
            <ShieldCheck className={["h-4 w-4", bandTone.icon].join(" ")} />
            {band.label}
          </div>
        </div>
      </header>

      <section
        className={[
          "rounded-3xl border p-6 md:p-7",
          debriefTone.card,
        ].join(" ")}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-[260px] flex-1">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              {debriefCopy.eyebrow}
            </p>

            <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-white leading-tight">
              {debriefCopy.title}
            </h2>

            <p className="mt-4 text-sm md:text-[15px] text-slate-300 leading-relaxed max-w-3xl">
              {debriefCopy.body}
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
              <p className="text-sm text-slate-200 leading-relaxed">
                {debriefCopy.reassurance}
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto md:min-w-[220px] rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Recorded score
            </p>

            <div className="mt-3 flex items-end gap-3">
              <div className="text-5xl font-semibold text-white tabular-nums">
                {score}
              </div>
              <div className="pb-1">
                <p className="text-sm text-slate-400">out of 100</p>
              </div>
            </div>

            <div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={["h-full rounded-full", bandTone.bar].join(" ")}
                style={{ width: `${clamp(score, 0, 100)}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              This number only reacts to explicit answers you selected.
            </p>
          </div>
        </div>
      </section>

      {driveWasSkippedOrMissing && (
        <div className="mt-8 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-300 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                The test drive is still unassessed — you can add it now
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                If you skipped it earlier, changed circumstances, or tapped past
                it by accident, you can still record the quick drive checks
                before generating the report.
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

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-slate-300" />
          <h2 className="text-lg font-semibold text-white">What stood out</h2>
        </div>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          These are the main signals the app can safely infer from what you
          recorded — without filling in the blanks.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {standoutCards.map((card) => {
            const tone = toneClasses(card.tone);
            return (
              <div
                key={card.id}
                className={[
                  "rounded-2xl border p-4 bg-slate-900/45",
                  tone.card,
                ].join(" ")}
              >
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-white tabular-nums">
                  {card.value}
                </p>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {card.helper}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-slate-300" />
            <h2 className="text-lg font-semibold text-white">
              What CarVerity knows from this inspection
            </h2>
          </div>

          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            This side of the summary only reflects information you explicitly
            captured during the inspection.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/8 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-rose-300 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Recorded concerns
                  </p>
                  <p className="text-3xl font-semibold text-white tabular-nums mt-2">
                    {concerns}
                  </p>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    These are the clearest caution signals because you
                    explicitly marked them as concerns.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/8 p-5">
              <div className="flex items-start gap-3">
                <CircleHelp className="h-4 w-4 text-sky-300 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Recorded unknowns
                  </p>
                  <p className="text-3xl font-semibold text-white tabular-nums mt-2">
                    {unsure}
                  </p>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    These are not automatic negatives. They are areas that still
                    need clarification.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Reassuring recorded answers
                  </p>
                  <p className="text-3xl font-semibold text-white tabular-nums mt-2">
                    {okCount}
                  </p>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    These are the items you explicitly marked as okay. Nothing
                    else is silently assumed to be okay on your behalf.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="h-4 w-4 text-slate-300 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Notes and context captured
                  </p>
                  <p className="text-3xl font-semibold text-white tabular-nums mt-2">
                    {notesOnly}
                  </p>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    Notes help the report explain what felt off, even when you
                    did not select a scored answer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-sm font-semibold text-white">
              {scoreCopy.title}
            </p>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              {scoreCopy.body}
            </p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Unanswered items do not improve the score. This number is a guide
              to recorded risk and uncertainty — not a mechanical diagnosis and
              not proof the car is good or bad.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-300" />
            <h2 className="text-lg font-semibold text-white">
              Still not assessed
            </h2>
          </div>

          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            These are gaps in the picture — not red flags by default.
          </p>

          {unknownItems.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4">
              <p className="text-sm font-semibold text-white">
                No major obvious gaps stand out
              </p>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                From what this page can see, you have captured a reasonably
                complete set of inspection inputs for the report to work with.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {unknownItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    {item.body}
                  </p>

                  {item.action && item.actionLabel && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={item.action}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 text-sm"
                      >
                        {item.actionLabel}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-sm font-semibold text-white">
              Evidence rule
            </p>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              CarVerity only scores what you explicitly entered: your selections,
              notes and captured photos. Missing items reduce certainty, not
              quality.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
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
                      {totalDisplayPhotos}
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
                    CarVerity will not quietly convert missing evidence into
                    positive evidence. If something is unclear, it stays unclear.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/30 p-5">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-300" />
              <p className="text-sm font-semibold text-white">
                Photos captured
              </p>
            </div>

            <p className="text-xs text-slate-500 mt-2 tabular-nums">
              {totalDisplayPhotos} total
            </p>

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
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-slate-300" />
            <h2 className="text-lg font-semibold text-white">
              What happens next
            </h2>
          </div>

          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            The report’s job is to interpret this inspection calmly and keep the
            unknowns separate from the knowns.
          </p>

          <div className="mt-5 space-y-3">
            {nextStepItems.map((item) => {
              const tone = toneClasses(item.tone);
              return (
                <div
                  key={item.id}
                  className={[
                    "rounded-2xl border p-4 bg-slate-950/40",
                    tone.card,
                  ].join(" ")}
                >
                  <p className="text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-sm font-semibold text-white">
              What you’ll get
            </p>
            <ul className="mt-3 space-y-3 text-sm text-slate-400">
              <li className="leading-relaxed">
                Clear reasoning tied to what you recorded
              </li>
              <li className="leading-relaxed">
                Practical follow-ups that reduce buyer regret
              </li>
              <li className="leading-relaxed">
                A grounded price-alignment signal if the asking price is added
              </li>
            </ul>
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-2xl border border-white/10 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">
              Ready to generate your report?
            </p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              A credit is used when report generation begins. If you want to
              tighten anything up first, review the checks before continuing.
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

      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/30 p-5">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-slate-300 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              Buyer-safe guidance, not car-yard hype
            </p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              CarVerity is built to reduce buyer regret. The report focuses on
              what your inspection means, what still needs clarification, and
              when caution is justified — without scripts, pressure or fake
              certainty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}