import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const UNLOCK_KEY = "carverity_debug_unlock_full_scan";

/* ------------------------------
   UI Helpers
------------------------------ */

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_0_25px_rgba(0,0,0,0.25)] backdrop-blur-sm p-5">
      <h2 className="text-sm font-medium text-indigo-300 mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TextBlock({ value }: { value?: string | null }) {
  if (!value) return null;
  return (
    <pre className="whitespace-pre-wrap text-slate-100 text-[15px] leading-relaxed">
      {value.trim()}
    </pre>
  );
}

/* ------------------------------
   Preview copy generator
------------------------------ */

function buildPreviewTeaser(baseLine?: string | null): string {
  if (!baseLine) {
    return (
      "The full scan looks more closely at the cosmetic details, service log entry, " +
      "and anything in the listing that may be worth confirming in person. It also " +
      "includes practical inspection tips and gentle negotiation pointers tailored " +
      "to this vehicle."
    );
  }

  const text = baseLine.toLowerCase();

  if (text.includes("couple of details") || text.includes("worth checking")) {
    return (
      "The full scan expands on those details, with clearer guidance on what’s worth " +
      "confirming in person, plus inspection tips and negotiation pointers specific " +
      "to this listing."
    );
  }

  if (text.includes("positive") || text.includes("comfortable")) {
    return (
      "The full scan adds more context around the listing details, along with helpful " +
      "inspection reminders and notes to give you extra confidence when you see the car."
    );
  }

  return (
    "The full scan takes a closer look at the listing information and highlights the " +
    "areas that are worth paying attention to in person, along with practical tips " +
    "to help you make a confident decision."
  );
}

/* ------------------------------
   Component
------------------------------ */

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) return;

    setResult(stored);

    const persistedUnlock =
      stored.isUnlocked || localStorage.getItem(UNLOCK_KEY) === "1";

    setShowFull(Boolean(persistedUnlock));
  }, []);

  function unlockForTesting() {
    setShowFull(true);
    localStorage.setItem(UNLOCK_KEY, "1");
  }

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">No scan results found</h1>
        <p className="text-slate-400">
          Run a scan to generate your CarVerity report.
        </p>
      </div>
    );
  }

  const {
    vehicle = {},
    confidenceCode,
    fullSummary,
    summary,
  } = result;

  const confidenceText =
    summary?.split("\n")[0]?.trim() ||
    fullSummary?.split("\n")[0]?.trim() ||
    null;

  const previewTeaser = buildPreviewTeaser(confidenceText);

  const reportText = fullSummary || summary || "";

  const confidenceLabel = confidenceCode
    ? `${confidenceCode} — listing confidence`
    : "Not available";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">
          CarVerity online scan results
        </h1>
        <p className="text-slate-400">
          Independent guidance based on the details in this listing.
        </p>
      </div>

      {/* CONFIDENCE */}
      <SectionCard title="Listing confidence">
        <p className="text-lg font-medium text-white">{confidenceLabel}</p>
      </SectionCard>

      {/* CONFIDENCE MESSAGE */}
      <SectionCard title="Confidence assessment">
        <p className="text-slate-200 leading-relaxed">
          {confidenceText ||
            "This listing looks mostly positive so far. The full scan provides clearer guidance on what’s worth checking in person."}
        </p>
      </SectionCard>

      {/* PREVIEW */}
      {!showFull && (
        <SectionCard title="CarVerity analysis — preview">
          <p className="text-slate-200 leading-relaxed mb-3">
            {previewTeaser}
          </p>

          <div className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-slate-400">
            Full report content is locked
          </div>

          <button
            onClick={unlockForTesting}
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-600 transition"
          >
            Unlock full scan (testing)
          </button>

          <p className="text-[11px] text-slate-500 mt-1">
            In the live app this area unlocks after purchasing a scan.
          </p>
        </SectionCard>
      )}

      {/* FULL REPORT */}
      {showFull && (
        <SectionCard title="Full CarVerity report">
          <TextBlock value={reportText} />
        </SectionCard>
      )}

      {/* VEHICLE DETAILS */}
      <SectionCard title="Vehicle details">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div>
            <span className="text-slate-400 block">Make</span>
            <span className="text-white">{vehicle.make || "—"}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Model</span>
            <span className="text-white">{vehicle.model || "—"}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Year</span>
            <span className="text-white">{vehicle.year || "—"}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Kilometres</span>
            <span className="text-white">{vehicle.kilometres || "—"}</span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
