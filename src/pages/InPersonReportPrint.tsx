import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";

export default function InPersonReportPrint() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const hasOnlineScan =
    localStorage.getItem("carverity_online_completed") === "1";
  const hasInPersonScan = true;
  const dualJourneyComplete = hasOnlineScan && hasInPersonScan;

  const imperfections = progress?.imperfections ?? [];
  const followUps = progress?.followUpPhotos ?? [];
  const checks = progress?.checks ?? {};
  const listingUrl = localStorage.getItem("carverity_listing_url") || "";

  /* =========================================================
     Derived sections
  ========================================================== */

  const sellerQuestions = useMemo(() => {
    const list: string[] = [];

    imperfections.forEach((i: any) => {
      if (i?.label) list.push(`Confirm details about: ${i.label}`);
    });

    followUps
      .filter((f: any) => !f.completed)
      .forEach((f: any) => list.push(`Ask to clarify: ${f.label}`));

    Object.entries(checks).forEach(([k, v]) => {
      if (typeof v === "string" && v.includes("worth confirming")) {
        list.push(`Discuss inspection finding: ${k}`);
      }
    });

    return list;
  }, [imperfections, followUps, checks]);

  const possibleCostAreas = useMemo(() => {
    const list: string[] = [];

    imperfections.forEach((i: any) => {
      const l = (i?.label ?? "").toLowerCase();

      if (l.includes("tyre")) list.push("Tyres may require replacement soon.");
      if (l.includes("scratch") || l.includes("paint"))
        list.push("Cosmetic paintwork may need touch-ups.");
      if (l.includes("dent"))
        list.push("Panel dents may require repair depending on severity.");
      if (l.includes("interior"))
        list.push("Interior wear may affect resale value.");
    });

    return list;
  }, [imperfections]);

  const generalImpressions = useMemo(() => {
    const list: string[] = [];

    Object.entries(checks).forEach(([k, v]) => {
      if (typeof v === "string" && v.includes("everything seemed normal")) {
        list.push(`No issues noticed for: ${k}`);
      }
    });

    return list;
  }, [checks]);

  /* =========================================================
     Print helpers
  ========================================================== */

  function triggerPrint() {
    window.print();
  }

  function backToSummary() {
    navigate("/scan/in-person/summary");
  }

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div className="print-body bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">
            CarVerity — In-person Inspection Report
          </h1>

          {listingUrl && (
            <p className="text-sm text-slate-300">
              Listing reference: <span className="underline">{listingUrl}</span>
            </p>
          )}

          {dualJourneyComplete && (
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2">
              <strong className="text-emerald-200 text-sm">
                ✅ Dual-scan complete — online + in-person insights combined
              </strong>
            </div>
          )}
        </header>

        <p className="text-sm text-slate-300">
          This report summarises observations recorded during your guided
          in-person visit. Nothing here is labelled as a defect — it highlights
          areas that appeared normal, may be worth confirming with the seller,
          or could influence costs or negotiation.
        </p>

        {imperfections.length > 0 && (
          <ReportSection title="Observed notes & areas photographed">
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-200">
              {imperfections.map((i: any) => (
                <li key={i.id}>
                  {i.area ?? "Observation"} — {i.type}
                  {i.note ? ` · ${i.note}` : ""}
                </li>
              ))}
            </ul>
          </ReportSection>
        )}

        {!!sellerQuestions.length && (
          <ReportSection title="Questions or confirmations to discuss with the seller">
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-200">
              {sellerQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </ReportSection>
        )}

        {!!possibleCostAreas.length && (
          <ReportSection title="Areas that may relate to future cost or negotiation (context only)">
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-200">
              {possibleCostAreas.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-400 mt-2">
              These are not fault statements — costs depend on condition and a
              professional inspection.
            </p>
          </ReportSection>
        )}

        {!!generalImpressions.length && (
          <ReportSection title="General condition impressions">
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-200">
              {generalImpressions.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </ReportSection>
        )}

        <ReportSection title="Test-drive & safety-feature awareness">
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-200">
            <li>
              Listen for knocks, rattles or grinding noises when braking,
              turning or accelerating.
            </li>
            <li>Ensure the car tracks straight and the steering feels stable.</li>
            <li>
              Watch for dashboard warning lights that stay on or appear while
              driving.
            </li>
            <li>
              If fitted, check ADAS features (lane-keep, adaptive cruise,
              blind-spot, parking sensors) behave predictably with no warnings.
            </li>
            <li>
              After driving, check for unusual smells, smoke or fluid drips
              under the car.
            </li>
          </ul>
        </ReportSection>

        <div className="rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3">
          <p className="text-xs text-slate-400">
            This is not a mechanical inspection or defect certificate. It is a
            guided record to support your decision-making and discussion with
            the seller.
          </p>
        </div>

        <div className="no-print flex gap-3 pt-4">
          <button
            onClick={triggerPrint}
            className="px-4 py-2 rounded-lg bg-emerald-400 text-black font-semibold"
          >
            Print / Save as PDF
          </button>

          <button
            onClick={backToSummary}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200"
          >
            Back to summary
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-body { background: white !important; color: #000; }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   Reusable section block
========================================================= */
function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/15 bg-slate-900/60 px-5 py-4 space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
