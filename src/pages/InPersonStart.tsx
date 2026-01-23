/* =========================================================
   In-person start
   • Requires auth
   • Does NOT deduct a credit here
   • Generates a stable scanId for this inspection session
   • Credit is deducted later when generating the report
========================================================= */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearProgress, saveProgress } from "../utils/scanProgress";
import { supabase } from "../supabaseClient";

const SCAN_ID_KEY = "carverity_in_person_scan_id";

function getOrCreateScanId(): string {
  const existing = sessionStorage.getItem(SCAN_ID_KEY);
  if (existing && existing.trim().length > 0) return existing;

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  sessionStorage.setItem(SCAN_ID_KEY, created);
  return created;
}

function clearScanId() {
  sessionStorage.removeItem(SCAN_ID_KEY);
}

export default function InPersonStart() {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanId = useMemo(() => getOrCreateScanId(), []);

  useEffect(() => {
    // Always start fresh — no auto-resume from a previous attempt
    clearProgress();
  }, []);

  async function startInspection() {
    if (starting) return;

    setStarting(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      clearScanId();
      navigate("/signin");
      return;
    }

    try {
      // Persist scanId immediately so the rest of the flow is stable
      saveProgress({
        scanId,
        type: "in-person",
        step: "/scan/in-person/start",
      });

      navigate("/scan/in-person/vehicle-details");
    } catch (err) {
      console.error("Start inspection failed:", err);
      setError("Something went wrong starting the inspection. Please try again.");
      setStarting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person inspection
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Start your in-person inspection
      </h1>

      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-3">
        <p className="text-sm text-slate-300">
          CarVerity guides you through a real-world inspection of the vehicle —
          so you can stay organised, capture what matters, and make a clearer
          decision.
        </p>

        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>You’ll capture a few key exterior photos first</li>
          <li>Then follow guided checks as you move around the car</li>
          <li>You can note anything that feels worth confirming</li>
        </ul>

        <p className="text-[11px] text-slate-400">
          No credit is used until you unlock the final report.
        </p>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={startInspection}
        disabled={starting}
        className={[
          "w-full rounded-xl px-4 py-3 font-semibold shadow transition",
          starting
            ? "bg-emerald-500/60 text-black/70 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-400 text-black",
        ].join(" ")}
      >
        {starting ? "Starting inspection…" : "Start inspection"}
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        Credit is only used when the report is generated.
      </p>
    </div>
  );
}
