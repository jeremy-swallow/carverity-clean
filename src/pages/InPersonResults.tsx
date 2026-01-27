// src/pages/InPersonResults.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Eye,
  Camera,
  ClipboardCheck,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Mail,
  RotateCcw,
  Printer,
  Flag,
  Wrench,
  BadgeDollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadScanById } from "../utils/scanStorage";

/* =======================================================
   Storage config
======================================================= */
const PHOTO_BUCKET = "scan-photos";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

/* =======================================================
   Small rendering helpers (visual-only, type-safe)
======================================================= */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asCleanText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "";
}

function Paragraph({ value }: { value: unknown }) {
  const t = asCleanText(value);
  if (!t) return null;
  return (
    <p className="text-[15px] leading-relaxed text-slate-300 max-w-3xl whitespace-pre-line">
      {t}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-300">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function pickFirstUsefulText(evidence: unknown): string {
  if (typeof evidence === "string" && evidence.trim()) return evidence.trim();

  if (Array.isArray(evidence)) {
    const strings = evidence.map(asCleanText).filter(Boolean);
    if (strings.length > 0) return strings.join("\n");
  }

  if (isRecord(evidence)) {
    const preferredKeys = [
      "summary",
      "text",
      "notes",
      "bullets",
      "bulletPoints",
      "points",
      "items",
    ];

    for (const key of preferredKeys) {
      const v = evidence[key];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (Array.isArray(v)) {
        const strings = v.map(asCleanText).filter(Boolean);
        if (strings.length > 0) return strings.join("\n");
      }
    }
  }

  return "";
}

function extractEvidenceBullets(evidence: unknown): string[] {
  if (!evidence) return [];

  if (typeof evidence === "string") return [];

  if (Array.isArray(evidence)) {
    return evidence.map(asCleanText).filter(Boolean);
  }

  if (isRecord(evidence)) {
    const v = evidence["bullets"];
    if (Array.isArray(v)) return v.map(asCleanText).filter(Boolean);

    const fallbackKeys = ["bulletPoints", "points", "items"];
    for (const k of fallbackKeys) {
      const vv = evidence[k];
      if (Array.isArray(vv)) return vv.map(asCleanText).filter(Boolean);
    }
  }

  return [];
}

function uncertaintyLabel(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();

  if (isRecord(value)) {
    return (
      asCleanText(value.label) ||
      asCleanText(value.title) ||
      asCleanText(value.reason) ||
      asCleanText(value.description) ||
      "You marked something as unsure."
    );
  }

  return "You marked something as unsure.";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMoney(n: unknown): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
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

function vehicleTitleFromProgress(p: any): string {
  const year = p?.vehicleYear ?? p?.vehicle?.year ?? "";
  const make = p?.vehicleMake ?? p?.vehicle?.make ?? "";
  const model = p?.vehicleModel ?? p?.vehicle?.model ?? "";
  const parts = [year, make, model].filter(Boolean);
  return parts.length ? parts.join(" ") : "";
}

function severityLabel(sev: unknown): "Minor" | "Moderate" | "Major" {
  if (sev === "major") return "Major";
  if (sev === "moderate") return "Moderate";
  return "Minor";
}

function severityPillClass(sev: unknown) {
  if (sev === "major") {
    return "border-red-400/30 bg-red-500/10 text-red-200";
  }
  if (sev === "moderate") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-200";
  }
  return "border-white/15 bg-white/5 text-slate-200";
}

function titleFromId(id: string) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

/* =======================================================
   CHECK LABELS (fixes Results check labels)
   - Keeps wording consistent with the guided flows
======================================================= */
const CHECK_LABELS: Record<string, string> = {
  "body-panels-paint": "Body panels & paint",
  "headlights-condition": "Headlights condition",
  "windscreen-damage": "Windscreen damage",
  "tyre-wear": "Tyre wear & tread",
  "brakes-visible": "Brake discs (if visible)",

  "seatbelts-trim": "Seatbelts & airbag trim",

  "interior-smell": "Smell or moisture",
  "interior-condition": "General interior condition",
  aircon: "Air-conditioning",
  steering: "Steering & handling feel",
  "noise-hesitation": "Noise / hesitation under power",
  "adas-systems": "Driver-assist systems (if fitted)",

  // Legacy ids (if they still exist in old scans)
  "body-panels": "Body panels & alignment",
  paint: "Paint condition",
  "glass-lights": "Glass & lights",
  tyres: "Tyres condition",
  "underbody-leaks": "Visible fluid leaks (if noticed)",
};

function labelForCheckId(id: string) {
  return CHECK_LABELS[id] || titleFromId(id);
}

/* =======================================================
   Photo helpers (supports base64 + storage paths)
======================================================= */

type StoredPhoto = {
  id?: string;
  stepId?: string;
  dataUrl?: string; // legacy
  storagePath?: string; // NEW (confirmed in your JSON)
  path?: string; // possible alt key
  bucket?: string; // optional override
};

function isProbablyBase64OrRemoteImage(s: unknown): s is string {
  if (typeof s !== "string") return false;
  return (
    s.startsWith("data:image/") ||
    s.startsWith("blob:") ||
    s.startsWith("http://") ||
    s.startsWith("https://")
  );
}

function normaliseStoragePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let p = value.trim();
  if (!p) return null;

  if (p.startsWith("/")) p = p.slice(1);

  // Some callers accidentally store "scan-photos/..." or "public/..."
  if (p.startsWith(`${PHOTO_BUCKET}/`)) p = p.replace(`${PHOTO_BUCKET}/`, "");
  if (p.startsWith("public/")) p = p.replace("public/", "");

  return p || null;
}

function extractPhotoRefs(progress: any): {
  legacyUrls: string[];
  storagePaths: string[];
} {
  const legacyUrls: string[] = [];
  const storagePaths: string[] = [];

  const sources: unknown[] = [];

  // 1) Main step photos (during scan)
  if (Array.isArray(progress?.photos)) sources.push(...progress.photos);

  // 2) Follow-up photos (after scan)
  if (Array.isArray(progress?.followUpPhotos))
    sources.push(...progress.followUpPhotos);

  // 3) Imperfection photos (if your Imperfection objects ever include storagePath/dataUrl)
  if (Array.isArray(progress?.imperfections))
    sources.push(...progress.imperfections);

  if (sources.length === 0) {
    return { legacyUrls: [], storagePaths: [] };
  }

  for (const item of sources) {
    if (typeof item === "string") {
      const s = item.trim();
      if (!s) continue;

      if (isProbablyBase64OrRemoteImage(s)) legacyUrls.push(s);
      else {
        const norm = normaliseStoragePath(s);
        if (norm) storagePaths.push(norm);
      }
      continue;
    }

    if (isRecord(item)) {
      const maybe = item as StoredPhoto;

      const spRaw =
        (typeof maybe.storagePath === "string" && maybe.storagePath.trim()) ||
        (typeof maybe.path === "string" && maybe.path.trim()) ||
        "";

      const du =
        (typeof maybe.dataUrl === "string" && maybe.dataUrl.trim()) || "";

      if (spRaw) {
        const norm = normaliseStoragePath(spRaw);
        if (norm) storagePaths.push(norm);
      } else if (du && isProbablyBase64OrRemoteImage(du)) {
        legacyUrls.push(du);
      }
    }
  }

  const dedupe = (arr: string[]) => Array.from(new Set(arr));

  return {
    legacyUrls: dedupe(legacyUrls),
    storagePaths: dedupe(storagePaths),
  };
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
      console.warn("[Results] createSignedUrl failed:", error.message);
      return null;
    }

    return data?.signedUrl ?? null;
  } catch (e) {
    console.warn("[Results] createSignedUrl exception:", e);
    return null;
  }
}

/* =======================================================
   Premium UI helpers
======================================================= */

function ScorePill({
  label,
  icon,
  value,
  sub,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-slate-950/25 px-5 py-4">
      <div className="flex items-center gap-2 text-slate-400">
        <span className="text-slate-400">{icon}</span>
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold text-white tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{sub}</p>
    </div>
  );
}

function MiniCard({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-slate-900/45 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-slate-300">{icon}</div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-400 leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

/* =======================================================
   Imperfection sanitiser (fixes old duplicate data)
======================================================= */

type CleanImperfection = {
  id: string;
  label: string;
  location: string;
  note: string;
  severity: "minor" | "moderate" | "major";
};

function normaliseImperfectionLabel(label: string): string {
  const t = String(label ?? "").trim();
  if (!t) return "";
  // If it looks like a raw id (body-panels-paint), make it human
  if (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(t)) {
    return titleFromId(t);
  }
  return t;
}

function normaliseLocation(loc: string): string {
  const t = String(loc ?? "").trim();
  if (!t) return "";

  const lower = t.toLowerCase();

  if (lower.includes("around")) return "Around the car";
  if (lower.includes("inside")) return "Inside the cabin";
  if (lower.includes("drive")) return "During the drive";

  return t;
}

function severitySafe(sev: unknown): "minor" | "moderate" | "major" {
  if (sev === "major") return "major";
  if (sev === "moderate") return "moderate";
  return "minor";
}

/**
 * This makes old scans render correctly even if older logic created duplicates.
 * Strategy:
 * - Clean each entry
 * - Remove empty junk
 * - De-dupe by (label + note) primarily (location duplicates are almost always a bug)
 * - Prefer entries that have a "real" location label
 */
function sanitiseImperfections(raw: any[]): CleanImperfection[] {
  const list = Array.isArray(raw) ? raw : [];

  const cleaned = list
    .map((imp: any) => {
      const id = String(imp?.id ?? "").trim();
      const label = normaliseImperfectionLabel(String(imp?.label ?? "").trim());
      const location = normaliseLocation(String(imp?.location ?? "").trim());
      const note = String(imp?.note ?? "").trim();
      const severity = severitySafe(imp?.severity);

      // Ignore totally empty objects
      if (!id && !label && !location && !note) return null;

      // Ignore legacy "bad" items that are basically check ids with no label
      const looksLikeRawCheckId =
        !label && /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(id);

      if (looksLikeRawCheckId) return null;

      const stableId =
        id ||
        `imp:${severity}:${label}:${location}:${note}`.slice(0, 80) ||
        `imp:${Date.now()}`;

      return {
        id: stableId,
        label: label || "Imperfection",
        location,
        note,
        severity,
      } satisfies CleanImperfection;
    })
    .filter(Boolean) as CleanImperfection[];

  // De-dupe by (label + note) first — location duplicates are almost always wrong
  const byKey = new Map<string, CleanImperfection>();

  for (const imp of cleaned) {
    const key = `${imp.label.toLowerCase()}||${imp.note.toLowerCase()}`;

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, imp);
      continue;
    }

    // Prefer the one with a better location (non-empty)
    const existingHasLoc = Boolean(existing.location);
    const nextHasLoc = Boolean(imp.location);

    if (!existingHasLoc && nextHasLoc) {
      byKey.set(key, imp);
      continue;
    }

    // Prefer higher severity if conflict
    const weight = (s: string) =>
      s === "major" ? 0 : s === "moderate" ? 1 : 2;

    if (weight(imp.severity) < weight(existing.severity)) {
      byKey.set(key, imp);
      continue;
    }
  }

  const result = Array.from(byKey.values());

  // Sort by severity (major first)
  const weight = (s: string) => (s === "major" ? 0 : s === "moderate" ? 1 : 2);
  result.sort((a, b) => weight(a.severity) - weight(b.severity));

  return result;
}

/* =======================================================
   Page
======================================================= */
export default function InPersonResults() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();
  const scanIdSafe = scanId ? String(scanId) : "";

  const [checkingUnlock, setCheckingUnlock] = useState(true);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);

  const [showWhyScore, setShowWhyScore] = useState(true);
  const [showConfidenceExplainer, setShowConfidenceExplainer] = useState(false);

  /* -------------------------------------------------------
     Routing safety
  ------------------------------------------------------- */
  useEffect(() => {
    if (!scanIdSafe) {
      navigate("/scan/in-person/start", { replace: true });
    }
  }, [scanIdSafe, navigate]);

  /* -------------------------------------------------------
     ENFORCE PAYWALL (ledger reference check)
  ------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function checkUnlock() {
      if (!scanIdSafe) return;

      setCheckingUnlock(true);
      setUnlockError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.warn("[Results] getUser error:", userError.message);
        }

        if (!user) {
          if (!cancelled) navigate("/signin", { replace: true });
          return;
        }

        const reference = `scan:${scanIdSafe}`;

        const { data, error } = await supabase
          .from("credit_ledger")
          .select("id")
          .eq("user_id", user.id)
          .eq("event_type", "in_person_scan_completed")
          .eq("reference", reference)
          .limit(1);

        if (error) {
          console.error("[Results] Unlock check failed:", error);
          if (!cancelled) setUnlockError("Could not verify unlock status.");
          return;
        }

        const unlocked = Array.isArray(data) && data.length > 0;

        if (!unlocked) {
          if (!cancelled) {
            navigate(`/scan/in-person/unlock/${scanIdSafe}`, { replace: true });
          }
          return;
        }
      } catch (e: unknown) {
        console.error("[Results] Unlock check exception:", e);
        if (!cancelled) setUnlockError("Could not verify unlock status.");
      } finally {
        if (!cancelled) setCheckingUnlock(false);
      }
    }

    void checkUnlock();

    return () => {
      cancelled = true;
    };
  }, [scanIdSafe, navigate]);

  /* -------------------------------------------------------
     Load saved scan (preferred) + progress fallback
  ------------------------------------------------------- */
  const saved = useMemo(() => {
    if (!scanIdSafe) return null;
    try {
      return loadScanById(scanIdSafe);
    } catch (e) {
      console.warn("[Results] loadScanById failed:", e);
      return null;
    }
  }, [scanIdSafe]);

  const progressFallback = useMemo(() => {
    try {
      return loadProgress();
    } catch (e) {
      console.warn("[Results] loadProgress failed:", e);
      return null;
    }
  }, []);

  // IMPORTANT:
  // Some users have photos in local progress but older saved snapshots.
  // Merge them so the report never "loses" photos.
  const progress: any = useMemo(() => {
    const base = (saved?.progressSnapshot ?? {}) as any;
    const fallback = (progressFallback ?? {}) as any;

    const basePhotos = Array.isArray(base?.photos) ? base.photos : [];
    const fallbackPhotos = Array.isArray(fallback?.photos) ? fallback.photos : [];

    const mergedPhotos =
      basePhotos.length >= fallbackPhotos.length ? basePhotos : fallbackPhotos;

    const baseFollowUps = Array.isArray(base?.followUpPhotos)
      ? base.followUpPhotos
      : [];
    const fallbackFollowUps = Array.isArray(fallback?.followUpPhotos)
      ? fallback.followUpPhotos
      : [];

    const mergedFollowUps =
      baseFollowUps.length >= fallbackFollowUps.length
        ? baseFollowUps
        : fallbackFollowUps;

    return {
      ...fallback,
      ...base,
      photos: mergedPhotos,
      followUpPhotos: mergedFollowUps,
    };
  }, [saved, progressFallback]);

  /* -------------------------------------------------------
     Analysis (prefer persisted analysis)
  ------------------------------------------------------- */
  const analysis = useMemo(() => {
    try {
      if (saved?.analysis) return saved.analysis;
      return analyseInPersonInspection(progress);
    } catch (e) {
      console.error("[Results] analyseInPersonInspection failed:", e);
      return null;
    }
  }, [saved, progress]);

  useEffect(() => {
    if (!scanIdSafe) return;
    if (checkingUnlock) return;
    if (unlockError) return;

    const risks = (analysis as any)?.risks;
    const verdict = (analysis as any)?.verdict;

    const ok =
      Boolean(analysis) &&
      Array.isArray(risks) &&
      typeof verdict === "string" &&
      verdict.length > 0;

    if (!ok) {
      navigate(`/scan/in-person/analyzing/${scanIdSafe}`, { replace: true });
    }
  }, [analysis, scanIdSafe, navigate, checkingUnlock, unlockError]);

  /* -------------------------------------------------------
     Derived view data
  ------------------------------------------------------- */
  const risksSafe: any[] = Array.isArray((analysis as any)?.risks)
    ? ((analysis as any).risks as any[])
    : [];

  const { legacyUrls, storagePaths } = useMemo(() => {
    return extractPhotoRefs(progress);
  }, [progress]);

  const capturedPhotoCount = legacyUrls.length + storagePaths.length;

  const criticalRisks = risksSafe.filter((r) => r?.severity === "critical");
  const moderateRisks = risksSafe.filter((r) => r?.severity === "moderate");

  const uncertaintyFactors: unknown[] = Array.isArray(
    (analysis as any)?.uncertaintyFactors
  )
    ? ((analysis as any).uncertaintyFactors as unknown[])
    : [];

  const evidenceSummary = (analysis as any)?.evidenceSummary;
  const evidenceText = pickFirstUsefulText(evidenceSummary);
  const evidenceBullets = extractEvidenceBullets(evidenceSummary);

  const askingPrice =
    typeof progress?.askingPrice === "number" ? progress.askingPrice : null;

  const confidence = clamp(
    Number((analysis as any)?.confidenceScore ?? 0),
    0,
    100
  );
  const coverage = clamp(
    Number((analysis as any)?.completenessScore ?? 0),
    0,
    100
  );

  /* -------------------------------------------------------
     Detect whether drive checks were done
  ------------------------------------------------------- */
  const driveWasDone = useMemo(() => {
    const checks = progress?.checks ?? {};
    if (!checks || typeof checks !== "object") return false;

    const driveIds = ["steering", "noise-hesitation", "adas-systems"];

    return driveIds.some((id) => {
      const v = (checks as any)?.[id]?.value;
      const note = (checks as any)?.[id]?.note;
      return Boolean(v) || Boolean(note);
    });
  }, [progress]);

  /* -------------------------------------------------------
     Load signed URLs for photos
  ------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      if (!scanIdSafe) return;
      if (checkingUnlock) return;
      if (unlockError) return;

      // If no storage paths, we can still show legacy urls
      if (storagePaths.length === 0) {
        if (!cancelled) setPhotoUrls(legacyUrls);
        return;
      }

      setPhotoLoading(true);

      try {
        const signed: string[] = [];

        for (const path of storagePaths) {
          const url = await createSignedUrlSafe(
            PHOTO_BUCKET,
            path,
            SIGNED_URL_TTL
          );
          if (url) signed.push(url);
        }

        const combined = [...legacyUrls, ...signed];

        if (!cancelled) setPhotoUrls(combined);
      } catch (e) {
        console.warn("[Results] photo load failed:", e);
        if (!cancelled) setPhotoUrls(legacyUrls);
      } finally {
        if (!cancelled) setPhotoLoading(false);
      }
    }

    void loadPhotos();

    return () => {
      cancelled = true;
    };
  }, [scanIdSafe, checkingUnlock, unlockError, storagePaths, legacyUrls]);

  const photoResolvedCount = photoUrls.length;

  /* -------------------------------------------------------
     Explicit evidence lists
  ------------------------------------------------------- */
  const flaggedChecks = useMemo(() => {
    const checks = progress?.checks ?? {};
    if (!checks || typeof checks !== "object") return [];

    const items = Object.entries(checks)
      .map(([id, v]: any) => {
        const value = v?.value as string | undefined;
        const note = (v?.note ?? "").trim();

        if (value !== "concern" && value !== "unsure") return null;

        // ✅ FIX: use our consistent label map first
        const label = labelForCheckId(id);

        return {
          id,
          label,
          value,
          note,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      label: string;
      value: "concern" | "unsure";
      note: string;
    }>;

    items.sort((a, b) => {
      const rank = (x: "concern" | "unsure") => (x === "concern" ? 0 : 1);
      return rank(a.value) - rank(b.value);
    });

    return items;
  }, [progress]);

  const recordedImperfections = useMemo(() => {
    return sanitiseImperfections(progress?.imperfections ?? []);
  }, [progress]);

  /* -------------------------------------------------------
     Verdict meta (safe fallback)
  ------------------------------------------------------- */
  const verdictKey = (analysis as any)?.verdict as
    | "proceed"
    | "caution"
    | "walk-away"
    | undefined;

  const verdictMeta = useMemo(() => {
    const map = {
      proceed: {
        icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
        title: "Looks OK to continue",
        tone: "border-emerald-500/40 bg-emerald-500/10",
        posture:
          "Based on what you recorded, there are no major red flags. Still do the normal checks before you buy.",
        short: "Looks OK to continue",
      },
      caution: {
        icon: <AlertTriangle className="h-6 w-6 text-amber-400" />,
        title: "Continue only after a few checks",
        tone: "border-amber-500/40 bg-amber-500/10",
        posture:
          "You recorded at least one concern or unsure item. Get clear answers before you commit.",
        short: "Check a few things first",
      },
      "walk-away": {
        icon: <XCircle className="h-6 w-6 text-red-400" />,
        title: "Pause — walking away is reasonable",
        tone: "border-red-500/40 bg-red-500/10",
        posture:
          "What you recorded suggests higher risk. If the seller can’t explain or prove key items, it’s OK to walk away.",
        short: "Pause / walk away",
      },
    } as const;

    return map[verdictKey ?? "caution"];
  }, [verdictKey]);

  /* -------------------------------------------------------
     Next steps (guidance-led)
  ------------------------------------------------------- */
  const nextSteps = useMemo(() => {
    const steps: string[] = [];

    if (!driveWasDone) {
      steps.push(
        "If possible, do a short test drive. Even 5 minutes can reveal steering pull, vibration, or hesitation."
      );
    } else {
      steps.push(
        "You’ve already done a short drive — now focus on clarifying anything you marked as unsure or a concern."
      );
    }

    if (criticalRisks.length > 0) {
      steps.push(
        "Start with the biggest concerns first. Ask for proof (invoice, photos, written confirmation)."
      );
    }

    if (moderateRisks.length > 0) {
      steps.push(
        "Ask the seller to explain the items you recorded. Don’t guess — confirm."
      );
    }

    if (uncertaintyFactors.length > 0) {
      steps.push(
        "Anything marked “unsure” should be treated as unknown. Try to verify it before you buy."
      );
    }

    steps.push(
      "If you still like the car, open Price positioning & negotiation to see a realistic offer range and how to ask."
    );

    return steps.slice(0, 5);
  }, [
    driveWasDone,
    criticalRisks.length,
    moderateRisks.length,
    uncertaintyFactors.length,
  ]);

  const clarifyQuestions = useMemo(() => {
    const qs: string[] = [];

    for (const r of [...criticalRisks, ...moderateRisks]) {
      const label = (r?.label || "").trim();
      if (!label) continue;

      qs.push(
        `Can you show proof for “${label}” (invoice, inspection note, photos, or written confirmation)?`
      );
    }

    if (qs.length === 0 && uncertaintyFactors.length > 0) {
      qs.push(
        "Can you confirm the things I couldn’t check today (service history, repairs, warnings, faults) in writing?"
      );
    }

    if (qs.length === 0) {
      qs.push("Can you show the latest service invoice and any repair history?");
      qs.push("Are there any known faults or warning lights?");
    }

    return qs.slice(0, 4);
  }, [criticalRisks, moderateRisks, uncertaintyFactors.length]);

  const whyThisVerdict =
    (analysis as any)?.whyThisVerdict || (analysis as any)?.verdictReason || "";

  const topSignals = useMemo(() => {
    const signals: Array<{
      label: string;
      tone: "critical" | "moderate" | "unknown";
    }> = [];

    for (const r of criticalRisks.slice(0, 2)) {
      if (r?.label) signals.push({ label: r.label, tone: "critical" });
    }
    for (const r of moderateRisks.slice(0, 2)) {
      if (r?.label) signals.push({ label: r.label, tone: "moderate" });
    }

    if (signals.length < 3 && uncertaintyFactors.length > 0) {
      signals.push({
        label: "Some items were marked as unsure",
        tone: "unknown",
      });
    }

    return signals.slice(0, 4);
  }, [criticalRisks, moderateRisks, uncertaintyFactors.length]);

  const scoreBlurb = useMemo(() => {
    if (coverage < 40) {
      return "You didn’t record much, so this result is cautious. It can still help — but check more before you decide.";
    }
    if (confidence < 45) {
      return "Some things need checking. Use the questions below to get clearer answers.";
    }
    return "This is based only on what you recorded. It doesn’t assume anything you didn’t check.";
  }, [coverage, confidence]);

  /* -------------------------------------------------------
     Premium: clean-scan value (so report never feels empty)
  ------------------------------------------------------- */
  const cleanScanValueCards = useMemo(() => {
    const cards: Array<{ title: string; body: string; icon: React.ReactNode }> =
      [];

    cards.push({
      title: "You captured a buyer-proof record",
      body: "This report documents what was checked today. That alone reduces “unknowns” — and helps you avoid paying full sticker price without evidence.",
      icon: <ShieldCheck className="h-5 w-5 text-slate-300" />,
    });

    cards.push({
      title: "You can still negotiate on a clean car",
      body: "Dealers often price expecting negotiation. If the car looks clean, you negotiate on readiness to buy + market norms (not faults).",
      icon: <Sparkles className="h-5 w-5 text-slate-300" />,
    });

    cards.push({
      title: "You now have a clear next step",
      body: "If you’re close to buying, a pre-purchase inspection is the final risk-reducer. If you’re not close yet, compare this report against other cars.",
      icon: <Wrench className="h-5 w-5 text-slate-300" />,
    });

    return cards;
  }, []);

  /* -------------------------------------------------------
     Professional evidence copy
  ------------------------------------------------------- */
  const evidenceHeadline = useMemo(() => {
    const concernCount = risksSafe.filter((r) => r?.severity !== "info").length;
    const imperfectionCount = recordedImperfections.length;

    const parts: string[] = [];

    if (concernCount > 0)
      parts.push(`${concernCount} flagged item${concernCount === 1 ? "" : "s"}`);
    if (imperfectionCount > 0)
      parts.push(
        `${imperfectionCount} imperfection${imperfectionCount === 1 ? "" : "s"}`
      );
    if (capturedPhotoCount > 0)
      parts.push(
        `${capturedPhotoCount} photo${capturedPhotoCount === 1 ? "" : "s"}`
      );

    if (parts.length === 0) {
      return "This report is based on the information recorded during your inspection.";
    }

    return `This report was generated from ${parts.join(
      ", "
    )} recorded during your inspection.`;
  }, [risksSafe, recordedImperfections.length, capturedPhotoCount]);

  const evidenceNotes = useMemo(() => {
    const lines: string[] = [];

    lines.push(
      "Only items you recorded are used. If something wasn’t checked, it’s treated as not recorded — not as good or bad."
    );

    if (uncertaintyFactors.length > 0) {
      lines.push(
        "Items marked as unsure are treated as unknown and included in the overall risk posture."
      );
    }

    lines.push(
      "This is not a mechanical certification. If you’re close to buying, consider an independent pre-purchase inspection."
    );

    return lines;
  }, [uncertaintyFactors.length]);

  /* -------------------------------------------------------
     Email report (opens user's own email client)
  ------------------------------------------------------- */
  const emailHref = useMemo(() => {
    const subjectParts = ["CarVerity report", vehicleTitleFromProgress(progress)];
    const subject = subjectParts.filter(Boolean).join(" — ");

    const lines: string[] = [];
    lines.push("Hi,");
    lines.push("");
    lines.push("Here is my CarVerity in-person inspection summary.");
    lines.push("");
    lines.push(`Vehicle: ${vehicleTitleFromProgress(progress) || "—"}`);
    lines.push(`Scan ID: ${scanIdSafe}`);
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push(`Asking price: ${formatMoney(askingPrice)}`);
    lines.push("");
    lines.push("Summary:");
    lines.push(`• Result: ${verdictMeta.short}`);
    lines.push(`• Confidence: ${confidence}%`);
    lines.push(`• Coverage: ${coverage}%`);
    lines.push(
      `• Concerns recorded: ${
        risksSafe.filter((r) => r?.severity !== "info").length
      }`
    );
    lines.push(`• Unsure items: ${uncertaintyFactors.length}`);
    lines.push(`• Photos captured: ${capturedPhotoCount}`);
    lines.push("");
    lines.push("Tip: You can print/save the PDF and attach it to this email.");
    lines.push("");
    lines.push("— Sent from CarVerity");

    const body = lines.join("\n");
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body
    )}`;
  }, [
    progress,
    scanIdSafe,
    askingPrice,
    verdictMeta.short,
    confidence,
    coverage,
    risksSafe,
    uncertaintyFactors.length,
    capturedPhotoCount,
  ]);

  function startNewScan() {
    navigate("/scan/in-person/start");
  }

  /* =======================================================
     UI
  ======================================================= */
  const showLoading = !scanIdSafe || checkingUnlock;
  const showError = Boolean(unlockError);
  const canRenderReport =
    Boolean(scanIdSafe) && !checkingUnlock && !unlockError && Boolean(analysis);

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-14">
      {showLoading && (
        <div className="max-w-3xl mx-auto px-0 py-6">
          <p className="text-sm text-slate-400">Verifying unlock…</p>
        </div>
      )}

      {showError && (
        <div className="max-w-3xl mx-auto px-0 py-6 space-y-4">
          <p className="text-sm text-red-300">{unlockError}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-200 hover:bg-white text-black font-semibold px-4 py-2 text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {!showLoading && !showError && !canRenderReport && (
        <div className="max-w-3xl mx-auto px-0 py-6 space-y-3">
          <p className="text-sm text-slate-400">Rebuilding your report…</p>
          <button
            onClick={() =>
              navigate(`/scan/in-person/analyzing/${scanIdSafe}`, {
                replace: true,
              })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-slate-200 hover:bg-white text-black font-semibold px-4 py-2 text-sm"
          >
            Retry analysis
          </button>
        </div>
      )}

      {canRenderReport && (
        <>
          {/* HEADER */}
          <header className="space-y-4">
            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              CarVerity · Your report
            </span>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-slate-400">
              <span>Scan ID: {scanIdSafe}</span>
              <span>Date: {new Date().toLocaleDateString()}</span>
              <span>Asking price: {formatMoney(askingPrice)}</span>
            </div>
          </header>

          {/* VERDICT */}
          <section
            className={`rounded-2xl border px-8 py-8 space-y-6 ${verdictMeta.tone}`}
          >
            <div className="flex items-start gap-4">
              {verdictMeta.icon}
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-white leading-tight">
                  {verdictMeta.title}
                </h1>

                <p className="text-[15px] leading-relaxed text-slate-200 max-w-3xl">
                  {verdictMeta.posture}
                </p>

                <Paragraph value={whyThisVerdict} />
              </div>
            </div>

            {/* BIG PRIMARY CTA: PRICE POSITIONING */}
            <div className="pt-2">
              <button
                onClick={() =>
                  navigate(`/scan/in-person/price-positioning/${scanIdSafe}`)
                }
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-5 flex items-center justify-between gap-4 shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-black/10 border border-black/10 flex items-center justify-center">
                    <BadgeDollarSign className="h-5 w-5 text-black" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-semibold">
                      Price positioning & negotiation
                    </p>
                    <p className="text-sm text-black/70 leading-relaxed">
                      Your offer range + how to ask (even if the car looks
                      clean).
                    </p>
                  </div>
                </div>

                <ArrowRight className="h-5 w-5 text-black/70 shrink-0" />
              </button>

              <p className="mt-2 text-xs text-slate-400">
                This is the most valuable part of the report if you’re buying
                from a dealer.
              </p>
            </div>

            {/* KEY SIGNALS */}
            {topSignals.length > 0 && (
              <div className="rounded-2xl border border-white/12 bg-slate-950/30 px-5 py-4">
                <div className="flex items-center gap-2 text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-slate-300" />
                  <p className="text-sm font-semibold">
                    What stood out (from your inspection)
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {topSignals.map((s, i) => {
                    const pill =
                      s.tone === "critical"
                        ? "border-red-400/30 bg-red-500/10 text-red-200"
                        : s.tone === "moderate"
                        ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                        : "border-white/15 bg-white/5 text-slate-200";

                    return (
                      <span
                        key={i}
                        className={[
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                          pill,
                        ].join(" ")}
                      >
                        {s.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PREMIUM SCORE GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <ScorePill
                label="Confidence"
                icon={<BarChart3 className="h-4 w-4" />}
                value={`${confidence}%`}
                sub="How strongly the result is supported by what you recorded."
              />
              <ScorePill
                label="Coverage"
                icon={<Eye className="h-4 w-4" />}
                value={`${coverage}%`}
                sub="How much of the inspection flow you completed."
              />
              <ScorePill
                label="Concerns"
                icon={<AlertTriangle className="h-4 w-4" />}
                value={`${risksSafe.filter((r) => r?.severity !== "info").length}`}
                sub="Items you marked as stood out or needing attention."
              />
              <ScorePill
                label="Unsure"
                icon={<HelpCircle className="h-4 w-4" />}
                value={`${uncertaintyFactors.length}`}
                sub="Unknowns that should be confirmed before buying."
              />
            </div>

            <p className="text-xs text-slate-400">{scoreBlurb}</p>

            {/* PREMIUM ACCORDION: WHY THIS SCORE */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowWhyScore((v) => !v)}
                className="w-full rounded-2xl border border-white/12 bg-slate-950/25 hover:bg-slate-900/40 px-6 py-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl border border-white/12 bg-white/5 flex items-center justify-center">
                    <Info className="h-5 w-5 text-slate-200" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-semibold text-white">
                      Why this score?
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      A clear explanation of how CarVerity arrived at this
                      result.
                    </p>
                  </div>
                </div>

                {showWhyScore ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {showWhyScore && (
                <div className="mt-3 rounded-2xl border border-white/12 bg-slate-900/45 px-6 py-6 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <MiniCard
                      title="Confidence is not a guess"
                      body="Confidence increases when you record clear observations. It drops when there are unknowns or unanswered items."
                      icon={<ShieldCheck className="h-5 w-5 text-slate-300" />}
                    />
                    <MiniCard
                      title="Coverage drives reliability"
                      body="Higher coverage means the result is based on more checks. Low coverage makes the outcome more cautious."
                      icon={<Eye className="h-5 w-5 text-slate-300" />}
                    />
                    <MiniCard
                      title="Concerns & unsure items matter"
                      body="Concerns raise risk. Unsure items are treated as unknowns — they should be clarified before committing."
                      icon={<AlertTriangle className="h-5 w-5 text-slate-300" />}
                    />
                  </div>

                  {evidenceText ? (
                    <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        What you recorded (summary)
                      </div>
                      <div className="mt-2">
                        <Paragraph value={evidenceText} />
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Snapshot
                    </div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-slate-300">
                      <div>
                        <div className="text-slate-500 text-xs">Photos</div>
                        <div className="text-white font-semibold">
                          {capturedPhotoCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Flagged items</div>
                        <div className="text-white font-semibold">
                          {risksSafe.filter((r) => r?.severity !== "info").length}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Unsure</div>
                        <div className="text-white font-semibold">
                          {uncertaintyFactors.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Coverage</div>
                        <div className="text-white font-semibold">{coverage}%</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    CarVerity does not assume anything you didn’t check. If it
                    wasn’t recorded, it’s treated as unknown — not good or bad.
                  </p>
                </div>
              )}
            </div>

            {/* PREMIUM ACCORDION: CONFIDENCE EXPLAINED */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setShowConfidenceExplainer((v) => !v)}
                className="w-full rounded-2xl border border-white/12 bg-slate-950/25 hover:bg-slate-900/40 px-6 py-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl border border-white/12 bg-white/5 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-slate-200" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-semibold text-white">
                      Confidence explained
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      What it means, what affects it, and how to improve it.
                    </p>
                  </div>
                </div>

                {showConfidenceExplainer ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {showConfidenceExplainer && (
                <div className="mt-3 rounded-2xl border border-white/12 bg-slate-900/45 px-6 py-6 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <MiniCard
                      title="What confidence means"
                      body="Confidence is how strongly this result is supported by what you actually recorded. It is not a promise the car is “good”."
                      icon={<ShieldCheck className="h-5 w-5 text-slate-300" />}
                    />
                    <MiniCard
                      title="What affects it"
                      body="It goes up with more checks, clearer notes, and photos. It goes down when there are unknowns, missing steps, or unsure items."
                      icon={<Eye className="h-5 w-5 text-slate-300" />}
                    />
                    <MiniCard
                      title="How to improve it"
                      body="Confirm unsure items, add short notes, and capture proof photos (dash lights, tyres, service stickers, damage close-ups)."
                      icon={<Camera className="h-5 w-5 text-slate-300" />}
                    />
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-4 space-y-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Practical tips (fast)
                    </div>

                    <ul className="space-y-2 text-[15px] text-slate-300">
                      <li className="flex gap-2">
                        <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-slate-200">
                          1
                        </span>
                        <span>
                          <span className="text-white font-semibold">
                            Turn “unsure” into “confirmed”
                          </span>{" "}
                          by asking for proof (invoice, photo, written
                          confirmation).
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-slate-200">
                          2
                        </span>
                        <span>
                          <span className="text-white font-semibold">
                            Add one sentence notes
                          </span>{" "}
                          on anything you flagged (what you saw, heard, or felt).
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-slate-200">
                          3
                        </span>
                        <span>
                          <span className="text-white font-semibold">
                            Capture proof photos
                          </span>{" "}
                          that someone else can understand later.
                        </span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Confidence is about evidence quality — not optimism. A lower
                    confidence score is still useful because it tells you what
                    to clarify before you commit.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* CLEAN SCAN VALUE (PREMIUM, NEVER EMPTY) */}
          {flaggedChecks.length === 0 &&
            recordedImperfections.length === 0 &&
            uncertaintyFactors.length === 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-slate-300">
                  <Sparkles className="h-5 w-5 text-slate-400" />
                  <h2 className="text-lg font-semibold">
                    Why this is still valuable (even on a clean scan)
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {cleanScanValueCards.map((c) => (
                    <MiniCard
                      key={c.title}
                      title={c.title}
                      body={c.body}
                      icon={c.icon}
                    />
                  ))}
                </div>
              </section>
            )}

          {/* WHAT YOU FLAGGED */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-300">
              <Flag className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold">What you flagged</h2>
            </div>

            <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-6">
              {/* Checks */}
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Checks (concerns + unsure)
                </div>

                {flaggedChecks.length > 0 ? (
                  <div className="space-y-3">
                    {flaggedChecks.map((c) => {
                      const tone =
                        c.value === "concern"
                          ? "border-red-400/25 bg-red-500/10"
                          : "border-amber-400/25 bg-amber-500/10";

                      const tag =
                        c.value === "concern" ? "Stood out" : "Couldn’t confirm";

                      return (
                        <div
                          key={c.id}
                          className={`rounded-2xl border px-5 py-4 ${tone}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-base font-semibold text-white">
                                {c.label}
                              </p>
                              {c.note ? (
                                <p className="mt-2 text-[15px] text-slate-200 leading-relaxed">
                                  {c.note}
                                </p>
                              ) : (
                                <p className="mt-2 text-[14px] text-slate-300">
                                  No notes added.
                                </p>
                              )}
                            </div>

                            <span className="shrink-0 inline-flex items-center rounded-full border border-white/15 bg-slate-950/30 px-3 py-1 text-xs text-slate-200">
                              {tag}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    You didn’t flag any check items as “stood out” or “unsure”.
                  </p>
                )}
              </div>

              {/* Imperfections */}
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Imperfections
                </div>

                {recordedImperfections.length > 0 ? (
                  <div className="space-y-3">
                    {recordedImperfections.map((imp) => (
                      <div
                        key={imp.id}
                        className="rounded-2xl border border-white/10 bg-slate-950/30 px-5 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-white">
                              {imp.label}
                            </p>

                            <div className="mt-1 text-sm text-slate-400">
                              {imp.location
                                ? `Location: ${imp.location}`
                                : "Location: —"}
                            </div>

                            {imp.note ? (
                              <p className="mt-2 text-[15px] text-slate-300 leading-relaxed">
                                {imp.note}
                              </p>
                            ) : (
                              <p className="mt-2 text-[14px] text-slate-400">
                                No notes added.
                              </p>
                            )}
                          </div>

                          <span
                            className={[
                              "shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-xs",
                              severityPillClass(imp.severity),
                            ].join(" ")}
                          >
                            {severityLabel(imp.severity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    No imperfections were recorded.
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-500 max-w-3xl">
                This section is the exact list of what you recorded — nothing is
                inferred.
              </p>
            </div>
          </section>

          {/* WHAT TO DO NEXT */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-300">
              <ClipboardCheck className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold">What to do next</h2>
            </div>

            <div className="rounded-2xl border border-white/12 bg-slate-900/60 px-6 py-6 space-y-4">
              <p className="text-sm text-slate-400">
                This is a simple plan based only on what you recorded today.
              </p>

              <BulletList items={nextSteps} />

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/scan/in-person/decision")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-2 text-sm text-slate-200"
                >
                  Open decision guide
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          {/* QUESTIONS TO ASK */}
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-200">
              Questions to ask the seller
            </h2>

            <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-4">
              <p className="text-sm text-slate-400">
                Keep it simple. You’re just trying to get clear answers.
              </p>

              <BulletList items={clarifyQuestions} />
            </div>
          </section>

          {/* BIG CONCERNS */}
          {criticalRisks.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-200">
                Biggest concerns
              </h2>

              <div className="space-y-4">
                {criticalRisks.map((r: any) => (
                  <div
                    key={String(r?.id ?? r?.label ?? Math.random())}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-5"
                  >
                    <p className="text-base font-semibold text-white">
                      {r?.label ?? "Concern"}
                    </p>
                    <p className="mt-2 text-[15px] text-slate-300 leading-relaxed">
                      {r?.explanation ?? ""}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* OTHER ITEMS */}
          {moderateRisks.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-200">
                Things worth checking
              </h2>

              <div className="space-y-4">
                {moderateRisks.map((r: any) => (
                  <div
                    key={String(r?.id ?? r?.label ?? Math.random())}
                    className="rounded-2xl border border-white/10 bg-slate-900/50 px-6 py-5"
                  >
                    <p className="text-base font-medium text-slate-100">
                      {r?.label ?? "Item"}
                    </p>
                    <p className="mt-2 text-[15px] text-slate-300 leading-relaxed">
                      {r?.explanation ?? ""}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* UNSURE */}
          {uncertaintyFactors.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-200">
                Things you weren’t sure about
              </h2>

              <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6">
                <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-300">
                  {uncertaintyFactors.map((u, i) => (
                    <li key={i}>{uncertaintyLabel(u)}</li>
                  ))}
                </ul>

                <p className="text-xs text-slate-500 mt-4">
                  “Unsure” just means you couldn’t confirm it today. If it
                  matters, try to verify it before buying.
                </p>
              </div>
            </section>
          )}

          {/* EVIDENCE CONSIDERED */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-300">
              <Wrench className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold">Evidence considered</h2>
            </div>

            <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-5">
              <p className="text-[15px] leading-relaxed text-slate-300 max-w-3xl">
                {evidenceHeadline}
              </p>

              {evidenceBullets.length > 0 && (
                <div className="pt-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">
                    Recorded notes
                  </div>
                  <BulletList items={evidenceBullets} />
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Notes on interpretation
                </div>
                <div className="mt-2">
                  <BulletList items={evidenceNotes} />
                </div>
              </div>
            </div>
          </section>

          {/* PHOTOS */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-300">
              <Camera className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold">Photos</h2>
            </div>

            {photoLoading ? (
              <p className="text-sm text-slate-400">Loading photos…</p>
            ) : photoResolvedCount > 0 ? (
              <>
                <div className="text-xs text-slate-500">
                  Showing {photoResolvedCount} of {capturedPhotoCount} captured
                  photo{capturedPhotoCount === 1 ? "" : "s"}.
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photoUrls.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Inspection photo ${i + 1}`}
                      className="rounded-xl border border-white/10 object-cover aspect-square"
                      loading="lazy"
                    />
                  ))}
                </div>
              </>
            ) : capturedPhotoCount > 0 ? (
              <p className="text-sm text-slate-400">
                You captured {capturedPhotoCount} photo
                {capturedPhotoCount === 1 ? "" : "s"} during this inspection.
                <br />
                Photos exist, but they could not be loaded right now. Please
                check your connection and refresh.
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                You didn’t take any photos during this inspection.
              </p>
            )}
          </section>

          {/* FINISH */}
          <section className="space-y-5 pt-2">
            <div className="rounded-2xl border border-white/12 bg-slate-900/60 px-6 py-6">
              <p className="text-base font-semibold text-white">
                Finished — save or share this report
              </p>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-3xl">
                If you want to share this with someone (partner, family,
                mechanic), the easiest way is to save it as a PDF, then email it
                from your own email app.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => navigate(`/scan/in-person/print/${scanIdSafe}`)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 hover:bg-white text-black font-semibold px-4 py-3 text-sm"
                >
                  <Printer className="h-4 w-4" />
                  Print / Save as PDF
                </button>

                <a
                  href={emailHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-3 text-sm text-slate-200"
                >
                  <Mail className="h-4 w-4" />
                  Email this report
                </a>

                <button
                  onClick={startNewScan}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 text-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  Start a new scan
                </button>
              </div>
            </div>
          </section>

          {/* PRIMARY BUTTONS */}
          <section className="space-y-4 pt-2">
            <button
              onClick={() => navigate("/scan/in-person/decision")}
              className="w-full rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 text-slate-200 font-semibold px-6 py-4 text-base"
            >
              Decision & next steps
            </button>

            <button
              onClick={() => navigate(`/scan/in-person/print/${scanIdSafe}`)}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 flex items-center justify-center gap-2 text-sm"
            >
              <Printer className="h-4 w-4" />
              Print / save report
            </button>

            <button
              onClick={startNewScan}
              className="w-full rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 text-slate-200 px-6 py-3 flex items-center justify-center gap-2 text-sm"
            >
              Start a new scan
            </button>
          </section>
        </>
      )}
    </div>
  );
}
