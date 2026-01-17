// src/pages/SignIn.tsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithGoogle,
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
} from "../supabaseAuth";

const CANONICAL_APP_ORIGIN = "https://carverity.com.au";

type Mode = "magic" | "password";

export default function SignIn() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("magic");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const cleanEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setSending(true);

      await signInWithMagicLink(cleanEmail, `${CANONICAL_APP_ORIGIN}/my-scans`);

      setSent(true);
    } catch (err) {
      console.error("Magic link error:", err);
      setError(
        "We couldn’t send the sign-in link. If you’re using Outlook/Hotmail, use Google or password instead."
      );
    } finally {
      setSending(false);
    }
  }

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      setSending(true);

      await signInWithPassword(cleanEmail, password);

      navigate("/account");
    } catch (err: any) {
      console.error("Password sign-in error:", err);

      const msg = String(err?.message || "");

      if (msg.toLowerCase().includes("invalid login credentials")) {
        setError(
          "That email/password combination didn’t work. If you don’t have a password yet, create one below."
        );
      } else {
        setError("Could not sign in with password. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

  async function handleCreatePasswordAccount() {
    setError(null);

    if (!cleanEmail) {
      setError("Please enter your email address first.");
      return;
    }
    if (!password.trim()) {
      setError("Please choose a password first.");
      return;
    }
    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSending(true);

      await signUpWithPassword(cleanEmail, password);

      // NOTE: With Supabase, signUp may or may not immediately create a session
      // depending on your email confirmation settings.
      // We send the user to Account because it's the "logged-in home" for credits.
      navigate("/account");
    } catch (err: any) {
      console.error("Password sign-up error:", err);

      const msg = String(err?.message || "");
      if (msg.toLowerCase().includes("user already registered")) {
        setError(
          "This email already has an account. Use “Sign in with password” instead."
        );
      } else {
        setError("Could not create your account. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

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
      <h1 className="text-3xl font-semibold text-white mb-3">
        Sign in to CarVerity
      </h1>

      <p className="text-slate-400 mb-6">
        Choose a secure sign-in method below.
        <br />
        Google is the most reliable option for most people.
      </p>

      {/* Trust strip */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300">
          Secure sign-in
        </span>
        <span className="text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300">
          No spam
        </span>
        <span className="text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300">
          Works best with Google
        </span>
      </div>

      {/* Google (recommended) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Continue with Google</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Recommended — fastest sign-in, no email deliverability issues.
            </p>
          </div>

          <span className="shrink-0 text-[11px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Recommended
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={sending}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 transition"
        >
          {sending ? "Opening Google…" : "Continue with Google"}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Or use email
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("magic");
            setSent(false);
            setError(null);
          }}
          className={[
            "rounded-xl px-4 py-3 text-sm font-semibold transition",
            mode === "magic"
              ? "bg-slate-200 text-black"
              : "bg-slate-900/50 text-slate-200 hover:bg-slate-900",
          ].join(" ")}
        >
          Magic link
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("password");
            setSent(false);
            setError(null);
          }}
          className={[
            "rounded-xl px-4 py-3 text-sm font-semibold transition",
            mode === "password"
              ? "bg-slate-200 text-black"
              : "bg-slate-900/50 text-slate-200 hover:bg-slate-900",
          ].join(" ")}
        >
          Password
        </button>
      </div>

      {/* Magic link mode */}
      {mode === "magic" && (
        <>
          {sent ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-900/30 p-5">
              <p className="text-emerald-300 font-medium">Check your email</p>
              <p className="text-slate-300 text-sm mt-2">
                We sent a secure sign-in link to <strong>{cleanEmail}</strong>.
                <br />
                Open it on this device to continue.
              </p>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-200 text-sm"
                >
                  Send again
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("password");
                    setSent(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-200 text-sm"
                >
                  Use password instead
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                Note: Outlook/Hotmail sometimes blocks sign-in links entirely.
                If you don’t receive it, use Google or password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-3 transition"
              >
                {sending ? "Sending link…" : "Send sign-in link"}
              </button>

              <p className="text-xs text-slate-500 leading-relaxed">
                Magic links are single-use and device-specific.
              </p>
            </form>
          )}
        </>
      )}

      {/* Password mode */}
      {mode === "password" && (
        <form onSubmit={handlePasswordSignIn} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Your password"
              required
            />
            <p className="text-xs text-slate-500 mt-2">
              If this is your first time, choose a password then tap “Create
              account”.
            </p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 transition"
          >
            {sending ? "Signing in…" : "Sign in"}
          </button>

          <button
            type="button"
            disabled={sending}
            onClick={handleCreatePasswordAccount}
            className="w-full rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-3 transition"
          >
            {sending ? "Creating account…" : "Create account"}
          </button>

          <p className="text-xs text-slate-500 leading-relaxed">
            Password sign-in is a reliable backup if your email provider blocks
            magic links.
          </p>
        </form>
      )}

      <div className="mt-8 text-xs text-slate-500 leading-relaxed">
        Signing in is for credits and purchases. Your saved inspections are still
        stored on this device for now.
      </div>
    </div>
  );
}
