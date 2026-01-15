// src/pages/InPersonSummary.tsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadProgress,
  clearProgress,
  saveProgress,
  type ScanProgress,
} from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

function labelForCheck(id: string) {
  const map: Record<string, string> = {
    // Around car
    "body-panels": "Body panels & alignment",
    paint: "Paint condition",
    "glass-lights": "Glass & lights",
    tyres: "Tyres condition",
    "underbody-leaks": "Visible fluid leaks (if noticed)",

    // Cabin
    "interior-smell": "Smell or moisture",
    "interior-condition": "General interior condition",
    aircon: "Air-conditioning",

    // Drive
    steering: "Steering & handling",
    "noise-hesitation": "Noise or hesitation",
    "adas-systems": "Driver-assist safety systems (if fitted)",
  };

  return map[id] || id.replace(/[-_]/g, " ");
}

function formatAudCompact(n: number) {
  try {
    return n.toLocaleString("en-AU");
  } catch {
    return String(n);
  }
}

/**
 * Convert a user-entered string like:
 * "14990", "14,990", "$14,990", "14 990"
 * into a safe integer AUD number, or null if invalid.
 */
function parseAudInputToNumber(raw: string): number | null {
  const cleaned = (raw ?? "")
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .trim();

  if (!cleaned) return null;

  // Allow digits only (no decimals for asking price)
  if (!/^\d+$/.test(cleaned)) return null;

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;

  // Safety bounds (avoid insane values / accidental extra zeros)
  if (n < 0) return null;
  if (n > 2_000_000) return null;

  return Math.round(n);
}

export default function InPersonSummary() {
  const navigate = useNavigate();
  const progress = loadProgress() as ScanProgress | null;

  const activeScanId: string = progress?.scanId ?? generateScanId();

  const imperfections = progress?.imperfections ?? [];
  const checks: Record<string, CheckAnswer> = (progress?.checks as any) ?? {};
  const photos = progress?.photos ?? [];
  const followUps = progress?.followUpPhotos ?? [];

  const vehicle = {
    year: progress?.vehicleYear ?? "",
    make: progress?.vehicleMake ?? "",
    model: progress?.vehicleModel ?? "",
    variant: (progress as any)?.vehicleVariant ?? "",
    kms: (progress as any)?.vehicleKms ?? progress?.kilometres ?? "",
  };

  const [savedId, setSavedId] = useState<string | null>(null);

  // Asking price input state (string for UX, number stored in progress)
  const initialAskingPrice = useMemo(() => {
    const v = progress?.askingPrice;
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      return formatAudCompact(v);
    }
    return "";
  }, [progress?.askingPrice]);

  const [askingPriceText, setAskingPriceText] = useState<string>(
    initialAskingPrice
  );

  const parsedAskingPrice = useMemo(() => {
    return parseAudInputToNumber(askingPriceText);
  }, [askingPriceText]);

  const askingPriceError = useMemo(() => {
    if (!askingPriceText.trim()) return null; // optional
    return parsedAskingPrice === null
      ? "Enter a valid AUD amount (numbers only)."
      : null;
  }, [askingPriceText, parsedAskingPrice]);

  const checksAnsweredCount = useMemo(() => {
    return Object.values(checks).filter((v) => Boolean(v?.value)).length;
  }, [checks]);

  const notesCount = useMemo(() => {
    return Object.values(checks).filter((v) => (v?.note ?? "").trim().length > 0)
      .length;
  }, [checks]);

  const concerns = useMemo(() => {
    return Object.entries(checks)
      .filter(([, v]) => v?.value === "concern")
      .map(([id, v]) => ({
        id,
        label: labelForCheck(id),
        note: (v?.note ?? "").trim(),
      }));
  }, [checks]);

  const notesOnly = useMemo(() => {
    return Object.entries(checks)
      .filter(
        ([, v]) => (v?.note ?? "").trim().length > 0 && v?.value !== "concern"
      )
      .map(([id, v]) => ({
        id,
        label: labelForCheck(id),
        note: (v?.note ?? "").trim(),
        value: v?.value,
      }));
  }, [checks]);

  function persistAskingPrice(nextText: string) {
    setAskingPriceText(nextText);

    const nextParsed = parseAudInputToNumber(nextText);

    saveProgress({
      ...(progress ?? {}),
      scanId: activeScanId,
      askingPrice: nextParsed,
    });
  }

  function onAskingPriceBlur() {
    // On blur, if valid, reformat nicely with commas.
    if (parsedAskingPrice && parsedAskingPrice > 0) {
      const formatted = formatAudCompact(parsedAskingPrice);
      setAskingPriceText(formatted);

      saveProgress({
        ...(progress ?? {}),
        scanId: activeScanId,
        askingPrice: parsedAskingPrice,
      });
    }
  }

  function proceedToAnalysis() {
    // If they typed something invalid, don’t block the flow,
    // but also don’t store a broken number.
    const safeAsking =
      parsedAskingPrice && parsedAskingPrice > 0 ? parsedAskingPrice : null;

    saveProgress({
      ...(progress ?? {}),
      scanId: activeScanId,
      askingPrice: safeAsking,
      step: "/scan/in-person/analyzing",
    });

    navigate(`/scan/in-person/analyzing/${activeScanId}`);
  }

  function saveToLibrary() {
    const safeAsking =
      parsedAskingPrice && parsedAskingPrice > 0 ? parsedAskingPrice : null;

    // Keep progress in sync before saving
    saveProgress({
      ...(progress ?? {}),
      scanId: activeScanId,
      askingPrice: safeAsking,
    });

    saveScan({
      id: activeScanId,
      type: "in-person",
      title: "In-person inspection",
      createdAt: new Date().toISOString(),
      completed: false,
      vehicle,
      history: [
        {
          at: new Date().toISOString(),
          event: "Inspection summary saved",
        },
      ],
    } as any);

    setSavedId(activeScanId);
  }

  function viewMyScans() {
    clearProgress();
    navigate("/my-scans");
  }

  function startNewScan() {
    clearProgress();
    navigate("/start-scan");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan — Summary
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Inspection summary
      </h1>

      <p className="text-sm text-slate-400">
        Review what you captured before we analyse the inspection and generate
        your full report.
      </p>

      {/* VEHICLE */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-1">
        <p className="font-semibold text-slate-100">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.variant ? ` — ${vehicle.variant}` : ""}
        </p>
        <p className="text-sm text-slate-400">
          Odometer: {vehicle.kms || "—"} km
        </p>
      </section>

      {/* ASKING PRICE */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/60 px-5 py-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-100">
              Advertised asking price (AUD)
            </h2>
            <p className="text-xs text-slate-400">
              Optional — but enables buyer-safe adjustment guidance.
            </p>
          </div>

          {parsedAskingPrice && parsedAskingPrice > 0 ? (
            <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-200 tabular-nums">
              Saved: ${formatAudCompact(parsedAskingPrice)}
            </span>
          ) : (
            <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
              Not set
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              $
            </span>

            <input
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 14,990"
              value={askingPriceText}
              onChange={(e) => persistAskingPrice(e.target.value)}
              onBlur={onAskingPriceBlur}
              className={[
                "w-full rounded-xl bg-slate-950/60 border px-9 py-3 text-slate-100 placeholder:text-slate-500",
                askingPriceError
                  ? "border-rose-400/40 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  : "border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/25",
              ].join(" ")}
            />
          </div>

          {askingPriceError ? (
            <p className="text-xs text-rose-200">{askingPriceError}</p>
          ) : (
            <p className="text-xs text-slate-500">
              We’ll use this to compare your recorded findings against the price
              and suggest a buyer-safe adjustment range.
            </p>
          )}
        </div>
      </section>

      {/* EVIDENCE COUNTS */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/60 px-5 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Photos
            </p>
            <p className="text-lg font-semibold text-white tabular-nums">
              {photos.length}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Checks
            </p>
            <p className="text-lg font-semibold text-white tabular-nums">
              {checksAnsweredCount}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Notes
            </p>
            <p className="text-lg font-semibold text-white tabular-nums">
              {notesCount}
            </p>
          </div>
        </div>

        {followUps.length > 0 && (
          <p className="text-xs text-slate-400 mt-3">
            Follow-up photos captured:{" "}
            <span className="text-slate-200 tabular-nums">
              {followUps.length}
            </span>
          </p>
        )}
      </section>

      {/* OBSERVATIONS */}
      <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 space-y-3">
        <h2 className="text-sm font-semibold text-amber-200">
          Inspection observations
        </h2>

        {/* Imperfections */}
        {imperfections.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-amber-200/80">
              Visual observations
            </p>
            <ul className="text-sm text-slate-200 space-y-1">
              {imperfections.map((i: any) => (
                <li key={i.id}>
                  • {i.area || i.location || "Observation"}:{" "}
                  {i.type || i.label || "Noted"}
                  {i.note ? ` — ${i.note}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {concerns.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-amber-200/80">
              Things that stood out
            </p>
            <ul className="text-sm text-slate-200 space-y-2">
              {concerns.map((c) => (
                <li key={c.id} className="leading-relaxed">
                  • <span className="font-semibold">{c.label}</span>
                  {c.note ? (
                    <span className="text-slate-300"> — {c.note}</span>
                  ) : (
                    <span className="text-slate-400"> — (no note)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes that aren’t “concern” */}
        {notesOnly.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-amber-200/80">
              Notes you recorded
            </p>
            <ul className="text-sm text-slate-200 space-y-2">
              {notesOnly.map((n) => (
                <li key={n.id} className="leading-relaxed">
                  • <span className="font-semibold">{n.label}</span>
                  <span className="text-slate-300"> — {n.note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty state */}
        {imperfections.length === 0 &&
        concerns.length === 0 &&
        notesOnly.length === 0 ? (
          <p className="text-sm text-slate-300">
            No notable observations were recorded.
          </p>
        ) : (
          <p className="text-xs text-slate-400 pt-1">
            These notes will be reflected in your report and negotiation
            guidance.
          </p>
        )}
      </section>

      {/* PRIMARY ACTION */}
      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 space-y-3">
        <h2 className="text-sm font-semibold text-emerald-200">
          Generate full report
        </h2>

        <p className="text-sm text-slate-300">
          We’ll analyse your inspection and prepare your buyer-safe report. This
          step finalises the inspection.
        </p>

        <button
          onClick={proceedToAnalysis}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
        >
          Analyse inspection
        </button>

        {askingPriceText.trim().length > 0 && askingPriceError ? (
          <p className="text-xs text-rose-200">
            Asking price looks invalid — we’ll ignore it unless you correct it.
          </p>
        ) : null}
      </section>

      {/* SAVE (SECONDARY) */}
      {!savedId ? (
        <div className="space-y-2">
          <button
            onClick={saveToLibrary}
            className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-2"
          >
            Save inspection for later
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={viewMyScans}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-3"
          >
            View in My Scans
          </button>
          <button
            onClick={startNewScan}
            className="w-full mt-2 rounded-xl border border-white/25 text-slate-200 px-4 py-2"
          >
            Start a new inspection
          </button>
        </>
      )}
    </div>
  );
}
