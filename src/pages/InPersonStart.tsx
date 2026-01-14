/* =========================================================
   In-person start
   • Requires auth
   • Disables start when credits = 0
   • Atomically deducts 1 credit via API
   • Prevents double start
========================================================= */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearProgress } from "../utils/scanProgress";
import { supabase } from "../supabaseClient";

export default function InPersonStart() {
  const navigate = useNavigate();

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  useEffect(() => {
    // Always start fresh — no auto-resume
    clearProgress();
  }, []);

  /* -------------------------------------------------------
     Load credits (Supabase = source of truth)
  ------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    async function loadCredits() {
      setLoadingCredits(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setCredits(null);
        setLoadingCredits(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to load credits:", error);
        setCredits(null);
      } else {
        setCredits(data?.credits ?? 0);
      }

      setLoadingCredits(false);
    }

    loadCredits();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadCredits();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* -------------------------------------------------------
     Start inspection
  ------------------------------------------------------- */
  async function startInspection() {
    if (starting) return;

    setError(null);
    setStarting(true);

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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "INSUFFICIENT_CREDITS") {
          navigate("/pricing");
          return;
        }

        throw new Error(data?.error || "START_FAILED");
      }

      // Success → proceed into inspection flow
      navigate("/scan/in-person/vehicle-details");
    } catch (err) {
      console.error("Start inspection failed:", err);
      setError(
        "Something went wrong starting the inspection. Please try again."
      );
      setStarting(false);
    }
  }

  const outOfCredits =
    !loadingCredits && typeof credits === "number" && credits <= 0;

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

      {outOfCredits && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-900/30 px-4 py-3 text-amber-300 text-sm">
          You’re out of scan credits. Purchase more to start a new inspection.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={startInspection}
        disabled={starting || loadingCredits || outOfCredits}
        className={[
          "w-full rounded-xl px-4 py-3 font-semibold shadow transition",
          starting || loadingCredits || outOfCredits
            ? "bg-emerald-500/40 text-black/60 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-400 text-black",
        ].join(" ")}
      >
        {loadingCredits
          ? "Checking credits…"
          : outOfCredits
          ? "No credits available"
          : starting
          ? "Starting inspection…"
          : "Start inspection (uses 1 credit)"}
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        One scan credit will be used when the inspection begins.
      </p>
    </div>
  );
}
