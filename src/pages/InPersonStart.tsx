/* =========================================================
   In-person start
   • Requires auth
   • Atomically deducts 1 credit via API
   • TRUE idempotency via stable reference (sessionStorage)
========================================================= */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearProgress } from "../utils/scanProgress";
import { supabase } from "../supabaseClient";

const START_REF_KEY = "carverity_in_person_start_ref";

function getOrCreateStartRef(): string {
  const existing = sessionStorage.getItem(START_REF_KEY);
  if (existing && existing.trim().length > 0) return existing;

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  sessionStorage.setItem(START_REF_KEY, created);
  return created;
}

function clearStartRef() {
  sessionStorage.removeItem(START_REF_KEY);
}

export default function InPersonStart() {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prepare a stable reference for this start attempt
  const startReference = useMemo(() => getOrCreateStartRef(), []);

  useEffect(() => {
    // Always start fresh — no auto-resume
    clearProgress();
  }, []);

  async function startInspection() {
    if (starting) return;

    setStarting(true);
    setError(null);

    // Ensure user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/sign-in");
      return;
    }

    try {
      const res = await fetch("/api/start-in-person-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reference: startReference }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "INSUFFICIENT_CREDITS") {
          clearStartRef();
          navigate("/pricing");
          return;
        }

        if (data?.error === "NOT_AUTHENTICATED") {
          clearStartRef();
          navigate("/sign-in");
          return;
        }

        throw new Error(data?.error || "START_FAILED");
      }

      // Success — we can clear the idempotency reference now
      clearStartRef();

      // Proceed into inspection flow
      navigate("/scan/in-person/vehicle-details");
    } catch (err) {
      console.error("Start inspection failed:", err);
      setError("Something went wrong starting the inspection. Please try again.");
      setStarting(false);
      // Do NOT clear the reference here — retry must be idempotent
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
          CarVerity will guide you through a calm, real-world inspection of the
          vehicle.
        </p>

        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>You’ll capture a few key exterior photos first</li>
          <li>Then follow guided checks as you move around the car</li>
          <li>You can note anything that feels worth confirming</li>
        </ul>

        <p className="text-[11px] text-slate-400">
          This inspection focuses on observations and confidence — not pricing
          or diagnosis.
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
        {starting ? "Starting inspection…" : "Start inspection (uses 1 credit)"}
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        One scan credit will be used when the inspection begins.
      </p>
    </div>
  );
}
