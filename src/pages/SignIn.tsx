// src/pages/SignIn.tsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { signInWithGoogle } from "../supabaseAuth";
import { supabase } from "../supabaseClient";

type Mode = "signin" | "signup" | "reset";

function isValidEmail(email: string) {
  const v = email.trim().toLowerCase();
  // simple + safe validation (Supabase will also validate)
  return v.includes("@") && v.includes(".");
}

export default function SignIn() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!isValidEmail(email)) return false;
    if (mode === "reset") return true;
    return password.trim().length >= 6;
  }, [email, password, mode]);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  async function handleGoogle() {
    clearMessages();

    try {
      setSending(true);
      await signInWithGoogle();
      // Redirect happens automatically after OAuth
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Google sign-in is not available right now.");
      setSending(false);
    }
  }

  async function handleEmailAuth() {
    clearMessages();

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (mode !== "reset" && password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSending(true);

      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signInError) {
          // Common: "Invalid login credentials"
          setError(signInError.message || "Unable to sign in.");
          setSending(false);
          return;
        }

        // Signed in
        navigate("/");
        return;
      }

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            // Important: ensures email links (if needed) go back to your domain
            emailRedirectTo: `${window.location.origin}/account`,
          },
        });

        if (signUpError) {
          setError(signUpError.message || "Unable to create account.");
          setSending(false);
          return;
        }

        setSuccess(
          "Account created. If your email provider requires confirmation, check your inbox."
        );
        setSending(false);
        return;
      }

      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo: `${window.location.origin}/account`,
          }
        );

        if (resetError) {
          setError(resetError.message || "Unable to send reset email.");
          setSending(false);
          return;
        }

        setSuccess(
          "Password reset email sent. Check your inbox (and junk/spam)."
        );
        setSending(false);
        return;
      }
    } catch (err) {
      console.error("Email auth error:", err);
      setError("Something went wrong. Please try again.");
      setSending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500 block text-center mb-4">
        CarVerity · Sign in
      </span>

      <h1 className="text-3xl font-semibold text-white mb-3 text-center">
        Sign in to CarVerity
      </h1>

      <p className="text-slate-400 mb-6 text-center">
        Sign in is used for purchases and credits.
        <br />
        Choose the option that suits you.
      </p>

      {/* Trust strip */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <span className="text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300 inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
          Secure sign-in
        </span>
        <span className="text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300">
          No spam
        </span>
        <span className="text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300">
          Buyer-safe
        </span>
      </div>

      {/* GOOGLE */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              Continue with Google
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Quick sign-in, no password to remember.
            </p>
          </div>
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
      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] text-slate-500">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* EMAIL/PASSWORD */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              Email & password
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Works with Gmail, Outlook, Hotmail, and more.
            </p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setMode("signin");
            }}
            className={[
              "rounded-xl px-3 py-2 text-xs font-semibold transition border",
              mode === "signin"
                ? "bg-slate-950/60 border-white/15 text-white"
                : "bg-transparent border-white/10 text-slate-300 hover:bg-slate-950/40",
            ].join(" ")}
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={() => {
              clearMessages();
              setMode("signup");
            }}
            className={[
              "rounded-xl px-3 py-2 text-xs font-semibold transition border",
              mode === "signup"
                ? "bg-slate-950/60 border-white/15 text-white"
                : "bg-transparent border-white/10 text-slate-300 hover:bg-slate-950/40",
            ].join(" ")}
          >
            Create
          </button>

          <button
            type="button"
            onClick={() => {
              clearMessages();
              setMode("reset");
            }}
            className={[
              "rounded-xl px-3 py-2 text-xs font-semibold transition border",
              mode === "reset"
                ? "bg-slate-950/60 border-white/15 text-white"
                : "bg-transparent border-white/10 text-slate-300 hover:bg-slate-950/40",
            ].join(" ")}
          >
            Reset
          </button>
        </div>

        {/* Email */}
        <label className="block text-xs text-slate-400 mb-1">Email</label>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 mb-3">
          <Mail className="h-4 w-4 text-slate-400" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-transparent outline-none text-slate-100 text-sm"
            autoComplete="email"
            inputMode="email"
          />
        </div>

        {/* Password (not for reset) */}
        {mode !== "reset" && (
          <>
            <label className="block text-xs text-slate-400 mb-1">
              Password
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 mb-3">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent outline-none text-slate-100 text-sm"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
              />
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Use at least 6 characters.
            </p>
          </>
        )}

        {/* Messages */}
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        {success && <p className="text-emerald-300 text-sm mb-3">{success}</p>}

        <button
          type="button"
          onClick={handleEmailAuth}
          disabled={sending || !canSubmit}
          className="w-full rounded-xl bg-white text-black font-semibold px-4 py-3 transition hover:bg-slate-200 disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {mode === "signin" && (
            <>
              Sign in <ArrowRight className="h-4 w-4" />
            </>
          )}
          {mode === "signup" && (
            <>
              Create account <ArrowRight className="h-4 w-4" />
            </>
          )}
          {mode === "reset" && (
            <>
              Send reset email <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="mt-4 text-[11px] text-slate-500 leading-relaxed text-center">
          Tip: If you’re not receiving emails, check junk/spam. Outlook/Hotmail
          can take a minute.
        </div>
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
