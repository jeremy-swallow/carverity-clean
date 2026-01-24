// src/pages/InPersonSaleContext.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, Store, User } from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

type SaleType = "dealership" | "private";

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export default function InPersonSaleContext() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const existingProgress: any = loadProgress() ?? {};

  const [scanId] = useState<string>(() => {
    if (existingProgress?.scanId) return existingProgress.scanId;

    const id = generateScanId();
    saveProgress({
      ...(existingProgress ?? {}),
      type: "in-person",
      scanId: id,
      step: "/scan/in-person/sale",
      startedAt: new Date().toISOString(),
    });
    return id;
  });

  const [saleType, setSaleType] = useState<SaleType | null>(() => {
    const raw = existingProgress?.saleType;
    return raw === "dealership" || raw === "private" ? raw : null;
  });

  const [saleName, setSaleName] = useState<string>(() => {
    return typeof existingProgress?.saleName === "string"
      ? existingProgress.saleName
      : "";
  });

  const [saleSuburb, setSaleSuburb] = useState<string>(() => {
    return typeof existingProgress?.saleSuburb === "string"
      ? existingProgress.saleSuburb
      : "";
  });

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, []);

  // Persist into progress as user interacts
  useEffect(() => {
    const latest: any = loadProgress() ?? {};

    saveProgress({
      ...(latest ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/sale",
      saleType: saleType ?? undefined,
      saleName,
      saleSuburb,
      startedAt: latest?.startedAt ?? new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId, saleType, saleName, saleSuburb]);

  const canContinue = useMemo(() => {
    // Optional step: always allow continue
    return true;
  }, []);

  function handleBack() {
    navigate("/scan/in-person/start");
  }

  function handleSkip() {
    const latest: any = loadProgress() ?? {};

    saveProgress({
      ...(latest ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/vehicle-details",
      saleType: undefined,
      saleName: "",
      saleSuburb: "",
      startedAt: latest?.startedAt ?? new Date().toISOString(),
    });

    navigate("/scan/in-person/vehicle-details");
  }

  function handleContinue() {
    const latest: any = loadProgress() ?? {};

    const nextType = saleType ?? undefined;
    const nextName = cleanText(saleName);
    const nextSuburb = cleanText(saleSuburb);

    saveProgress({
      ...(latest ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/vehicle-details",
      saleType: nextType,
      saleName: nextName,
      saleSuburb: nextSuburb,
      startedAt: latest?.startedAt ?? new Date().toISOString(),
    });

    navigate("/scan/in-person/vehicle-details");
  }

  const headline =
    saleType === "private"
      ? "Private sale setup"
      : saleType === "dealership"
      ? "Dealership setup"
      : "Where are you inspecting this car?";

  const helper =
    saleType === "private"
      ? "Optional — helps you shortlist and compare cars later."
      : saleType === "dealership"
      ? "Optional — helps you group scans by yard and shortlist cars."
      : "Optional — you can skip this and start scanning immediately.";

  const nameLabel =
    saleType === "private"
      ? "Seller label (optional)"
      : "Dealership / yard name (optional)";

  const namePlaceholder =
    saleType === "private" ? "e.g. Facebook Marketplace" : "e.g. John Hughes";

  return (
    <div ref={containerRef} className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-xs text-slate-500">In-person scan · Setup</div>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <span className="text-[11px] uppercase tracking-wide text-slate-400">
          In-person scan
        </span>

        <h1 className="text-2xl font-semibold text-white">{headline}</h1>

        <p className="text-sm text-slate-400 leading-relaxed">{helper}</p>
      </div>

      {/* Sale type chooser */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Sale type
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSaleType("dealership")}
            className={[
              "rounded-2xl border px-4 py-4 text-left transition",
              saleType === "dealership"
                ? "border-emerald-400/40 bg-emerald-500/10"
                : "border-white/10 bg-slate-950/40 hover:bg-slate-900",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <Store
                className={[
                  "h-5 w-5 mt-0.5",
                  saleType === "dealership"
                    ? "text-emerald-300"
                    : "text-slate-300",
                ].join(" ")}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  Dealership / car yard
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Helps you group scans by yard and shortlist cars you inspected.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSaleType("private")}
            className={[
              "rounded-2xl border px-4 py-4 text-left transition",
              saleType === "private"
                ? "border-emerald-400/40 bg-emerald-500/10"
                : "border-white/10 bg-slate-950/40 hover:bg-slate-900",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <User
                className={[
                  "h-5 w-5 mt-0.5",
                  saleType === "private"
                    ? "text-emerald-300"
                    : "text-slate-300",
                ].join(" ")}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Private sale</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Helps you keep track of who you spoke to and which cars you
                  shortlisted.
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-slate-200 font-semibold">Optional:</span> This
            information is only used to help you organise scans. You can skip it
            and still get a full report.
          </p>
        </div>
      </section>

      {/* Details (only if they picked a type OR started typing) */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/60 px-5 py-5 space-y-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Details (optional)
        </p>

        <div className="space-y-2">
          <label className="text-xs text-slate-400">{nameLabel}</label>
          <input
            value={saleName}
            onChange={(e) => setSaleName(e.target.value)}
            placeholder={namePlaceholder}
            className={[
              "w-full rounded-xl border bg-slate-950/40 px-4 py-3 text-white",
              "placeholder:text-slate-600 outline-none",
              "border-white/10 focus:border-emerald-400/40",
            ].join(" ")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-400">
            Suburb (optional)
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              value={saleSuburb}
              onChange={(e) => setSaleSuburb(e.target.value)}
              placeholder="e.g. Smithfield"
              className={[
                "w-full rounded-xl border bg-slate-950/40 pl-11 pr-4 py-3 text-white",
                "placeholder:text-slate-600 outline-none",
                "border-white/10 focus:border-emerald-400/40",
              ].join(" ")}
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSkip}
          className="flex-1 rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-3 text-slate-200"
        >
          Skip for now
        </button>

        <button
          onClick={handleContinue}
          disabled={!canContinue}
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
    </div>
  );
}
