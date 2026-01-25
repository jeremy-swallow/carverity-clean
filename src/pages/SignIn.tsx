// src/pages/SignIn.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../supabaseAuth";
import { supabase } from "../supabaseClient";

type EmailMode = "signin" | "signup" | "reset";

function safeRedirectPath(raw: string | null): string {
  const fallback = "/start";
  if (!raw) return fallback;

  const v = raw.trim();
  // Only allow same-origin app routes
  if (!v.startsWith("/")) return fallback;
  if (v.startsWith("//")) return fallback;
  return v;
}

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return safeRedirectPath(params.get("redirect"));
  }, [location.search]);

  function goAfterAuth() {
    navigate(redirectPath, { replace: true });
  }

  // OAuth
  const [sendingGoogle, setSendingGoogle] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Email/password
  const [mode, setMode] = useState<EmailMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // If already signed in, bounce them back to where they intended to go
  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session) {
        goAfterAuth();
      }
    }

    check();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectPath]);

  async function handleGoogle() {
    setOauthError(null);

    try {
      setSendingGoogle(true);

      // Save redirect for AuthCallback (OAuth returns there, not here)
      sessionStorage.setItem("carverity_redirect_after_auth", redirectPath);

      await signInWithGoogle();
      // Redirect happens automatically
    } catch (err) {
      console.error("Google sign-in error:", err);
      setOauthError("Google sign-in is not available right now.");
      setSendingGoogle(false);
    }
  }

  function resetEmailMessages() {
    setEmailError(null);
    setEmailSuccess(null);
    setResendMsg(null);
  }

  async function handleEmailAuth() {
    resetEmailMessages();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setEmailError("Please enter your email.");
      return;
    }

    if (mode !== "reset" && password.trim().length < 6) {
      setEmailError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSendingEmail(true);

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setEmailError("Invalid login credentials.");
          return;
        }

        setEmailSuccess("Signed in successfully.");
        goAfterAuth();
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) {
          if (error.message?.toLowerCase().includes("already registered")) {
            setEmailError(
              "That email already has an account. Try Sign in instead."
            );
            return;
          }

          setEmailError("Could not create account. Please try again.");
          return;
        }

        setEmailSuccess(
          "Account created. Please confirm the email we just sent you."
        );
        return;
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

        if (error) {
          setEmailError("Could not send reset email. Please try again.");
          return;
        }

        setEmailSuccess("Reset email sent. Check your inbox.");
        return;
      }
    } catch (err) {
      console.error("Email auth error:", err);
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  }

  // “Resend confirmation” workaround:
  // Supabase does not expose a direct "resend confirmation" call on the client.
  // We send a reset email to the same address, which still helps users find the email flow.
  async function handleResendEmail() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setResendMsg("Enter your email above first.");
      return;
    }

    try {
      setResending(true);
      setResendMsg(null);

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (error) {
        console.error("Resend email error:", error.message);
        setResendMsg("Could not resend email. Try again in a moment.");
        return;
      }

      setResendMsg("Email sent again. Check Inbox and Junk/Spam.");
    } catch (err) {
      console.error("Resend email error:", err);
      setResendMsg("Could not resend email. Try again in a moment.");
    } finally {
      setResending(false);
    }
  }

  const showJunkNote =
    emailSuccess &&
    (mode === "signup" || mode === "reset") &&
    emailSuccess.toLowerCase().includes("email");

  const showResendBlock = mode === "signup" && Boolean(emailSuccess);

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500 block text-center mb-4">
        CarVerity · Account
      </span>

      <h1 className="text-3xl font-semibold text-white mb-3 text-center">
        Sign in to CarVerity
      </h1>

      <p className="text-slate-400 mb-7 text-center">
        Sign in is only used for purchases and credits.
        <br />
        Google is the fastest setup.
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
          Cancel anytime
        </span>
      </div>

      {/* OAuth (premium primary) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="mb-3">
          <p className="text-sm font-semibold text-white">Quick sign-in</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Recommended — no confirmation emails required.
          </p>
        </div>

        {oauthError && (
          <p className="text-red-400 text-sm mb-3">{oauthError}</p>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={sendingGoogle}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 transition"
        >
          {sendingGoogle ? "Opening Google…" : "Continue with Google"}
        </button>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-xs text-slate-300 leading-relaxed">
            Apple sign-in is coming soon.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-7">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          or
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Email & password (secondary) */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-white">Email & password</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Works with Gmail, Outlook, Hotmail, and more.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              resetEmailMessages();
            }}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold border transition ${
              mode === "signin"
                ? "bg-white text-black border-white/10"
                : "bg-transparent text-slate-300 border-white/10 hover:bg-white/5"
            }`}
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              resetEmailMessages();
            }}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold border transition ${
              mode === "signup"
                ? "bg-white text-black border-white/10"
                : "bg-transparent text-slate-300 border-white/10 hover:bg-white/5"
            }`}
          >
            Sign up
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("reset");
              resetEmailMessages();
            }}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold border transition ${
              mode === "reset"
                ? "bg-white text-black border-white/10"
                : "bg-transparent text-slate-300 border-white/10 hover:bg-white/5"
            }`}
          >
            Reset
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-[0.18em] text-slate-500 block mb-1">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/60"
            />
          </div>

          {mode !== "reset" && (
            <div>
              <label className="text-[11px] uppercase tracking-[0.18em] text-slate-500 block mb-1">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="At least 6 characters"
                className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/60"
              />
            </div>
          )}
        </div>

        {/* Messages */}
        {emailError && (
          <p className="text-red-400 text-sm mt-3">{emailError}</p>
        )}

        {emailSuccess && (
          <p className="text-emerald-400 text-sm mt-3">{emailSuccess}</p>
        )}

        {showJunkNote && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-xs text-slate-300 leading-relaxed">
              If you don’t see the email within a minute, check your{" "}
              <span className="text-white font-semibold">Junk / Spam</span>{" "}
              folder (Outlook often puts first-time emails there).
            </p>
          </div>
        )}

        {/* Action button */}
        <button
          type="button"
          onClick={handleEmailAuth}
          disabled={sendingEmail}
          className="w-full mt-4 rounded-xl border border-white/10 bg-white text-black font-semibold px-4 py-3 transition hover:bg-slate-200 disabled:opacity-60"
        >
          {sendingEmail
            ? "Please wait…"
            : mode === "signin"
            ? "Sign in"
            : mode === "signup"
            ? "Sign up"
            : "Send reset email"}
        </button>

        {/* Resend confirmation block (after Sign up) */}
        {showResendBlock && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Didn’t receive the confirmation email?
              <br />
              Check <span className="text-white font-semibold">Junk / Spam</span>{" "}
              first, then resend.
            </p>

            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resending}
              className="w-full mt-3 rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-2.5 transition"
            >
              {resending ? "Resending…" : "Resend confirmation email"}
            </button>

            {resendMsg && (
              <p className="text-xs text-slate-400 mt-2">{resendMsg}</p>
            )}
          </div>
        )}

        <p className="text-[11px] text-slate-500 leading-relaxed text-center mt-3">
          Tip: If you already created an account, use{" "}
          <span className="text-slate-300 font-semibold">Sign in</span>. If you
          can’t access it, use{" "}
          <span className="text-slate-300 font-semibold">Reset</span>.
        </p>
      </div>

      <div className="mt-10 text-xs text-slate-500 leading-relaxed text-center">
        Your saved inspections are still stored on this device for now.
      </div>

      <button
        type="button"
        onClick={() => navigate("/start")}
        className="w-full mt-6 rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 text-slate-200 font-semibold px-4 py-3 transition"
      >
        Back to start scan
      </button>
    </div>
  );
}
