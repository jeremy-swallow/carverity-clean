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
        "We couldn’t send the sign-in link. If you’re using Outlook/Hotmail, use password sign-in instead."
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

      // Common Supabase auth error message for wrong password:
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

      <p className="text-slate-400 mb-8">
        Use a secure sign-in method below.
        <br />
        If your email provider is blocking links, password or Google is the most
        reliable option.
      </p>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={sending}
        className="w-full rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-3 transition mb-4"
      >
        Continue with Google
      </button>

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
              ? "bg-emerald-600 text-black"
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
              ? "bg-emerald-600 text-black"
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
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 transition"
              >
                {sending ? "Sending link…" : "Send sign-in link"}
              </button>
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
              Tip: If you don’t want passwords, use Google or magic link.
            </p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 transition"
          >
            {sending ? "Signing in…" : "Sign in with password"}
          </button>

          <button
            type="button"
            disabled={sending}
            onClick={handleCreatePasswordAccount}
            className="w-full rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-3 transition"
          >
            Create password account
          </button>
        </form>
      )}

      <div className="mt-8 text-xs text-slate-500 leading-relaxed">
        By signing in, you’ll be able to manage credits and access your saved
        reports on this device.
      </div>
    </div>
  );
}
