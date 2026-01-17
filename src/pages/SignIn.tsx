// src/pages/SignIn.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../supabaseAuth";

export default function SignIn() {
  const navigate = useNavigate();

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);

    try {
      setSending(true);
      await signInWithGoogle();
      // Redirect happens automatically
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Google sign-in is not available right now.");
      setSending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500 block text-center mb-4">
        CarVerity · Sign in
      </span>

      <h1 className="text-3xl font-semibold text-white mb-3 text-center">
        Sign in to CarVerity
      </h1>

      <p className="text-slate-400 mb-6 text-center">
        Sign in is only used for purchases and credits.
        <br />
        Continue with Google to keep things fast and reliable.
      </p>

      {/* Trust strip */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <span className="text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300">
          Secure sign-in
        </span>
        <span className="text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300">
          No spam
        </span>
        <span className="text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300">
          Fastest option
        </span>
      </div>

      {/* Google sign-in */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              Continue with Google
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Recommended — fastest sign-in, no email deliverability issues.
            </p>
          </div>

          <span className="shrink-0 text-[11px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Recommended
          </span>
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={sending}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 transition"
        >
          {sending ? "Opening Google…" : "Continue with Google"}
        </button>

        <p className="text-xs text-slate-500 mt-4 leading-relaxed text-center">
          Don’t have a Google account? Google will let you create one during
          sign-in.
        </p>
      </div>

      <div className="mt-10 text-xs text-slate-500 leading-relaxed text-center">
        Your saved inspections are still stored on this device for now.
      </div>

      <button
        type="button"
        onClick={() => navigate("/start-scan")}
        className="w-full mt-6 rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 text-slate-200 font-semibold px-4 py-3 transition"
      >
        Back to start scan
      </button>
    </div>
  );
}
