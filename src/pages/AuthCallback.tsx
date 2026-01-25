// src/pages/AuthCallback.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

function safeRedirectPath(raw: string | null): string {
  const fallback = "/start";
  if (!raw) return fallback;

  const v = raw.trim();
  // Only allow same-origin app routes
  if (!v.startsWith("/")) return fallback;
  if (v.startsWith("//")) return fallback;
  return v;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [status, setStatus] = useState<"working" | "success" | "error">(
    "working"
  );
  const [message, setMessage] = useState<string>("Signing you in…");

  // Priority order for redirect target:
  // 1) sessionStorage saved by SignIn before OAuth redirect
  // 2) explicit ?next= param (legacy)
  // 3) fallback
  const redirectTarget = useMemo(() => {
    const stored = safeRedirectPath(
      sessionStorage.getItem("carverity_redirect_after_auth")
    );

    const nextParam = safeRedirectPath(params.get("next"));

    // If we have a stored redirect, prefer it (OAuth flow)
    if (stored && stored !== "/start") return stored;

    // Otherwise, fall back to ?next=
    return nextParam || "/start";
  }, [params]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        /**
         * Supabase can return here with either:
         * - OAuth tokens in URL hash
         * - a "code" param
         * - or already-set session (depending on provider + browser)
         *
         * detectSessionInUrl=true in supabaseClient helps,
         * but we still do a session check loop to be safe.
         */

        // Small retry loop because session hydration can lag on first load
        const delays = [0, 150, 300, 600, 1000];

        for (const ms of delays) {
          if (cancelled) return;

          if (ms > 0) {
            await new Promise((r) => setTimeout(r, ms));
          }

          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.warn("[AuthCallback] getSession error:", error);
          }

          if (data.session) {
            if (cancelled) return;

            setStatus("success");
            setMessage("Signed in. Redirecting…");

            // Clear stored redirect so it doesn't affect future logins
            sessionStorage.removeItem("carverity_redirect_after_auth");

            // Replace so callback URL doesn't stay in history
            navigate(redirectTarget, { replace: true });
            return;
          }
        }

        // If we still don't have a session, treat as failure
        setStatus("error");
        setMessage("We couldn’t complete sign-in. Please try again.");

        // Give user a moment to read, then send to sign-in
        setTimeout(() => {
          if (cancelled) return;
          navigate("/signin", { replace: true });
        }, 1200);
      } catch (e) {
        console.error("[AuthCallback] unexpected error:", e);

        if (cancelled) return;
        setStatus("error");
        setMessage("Something went wrong during sign-in. Please try again.");

        setTimeout(() => {
          if (cancelled) return;
          navigate("/signin", { replace: true });
        }, 1200);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [navigate, redirectTarget]);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-white">
      <h1 className="text-2xl font-semibold mb-2">
        {status === "working"
          ? "Signing you in"
          : status === "success"
          ? "Signed in"
          : "Sign-in failed"}
      </h1>

      <p className="text-slate-400">{message}</p>

      {status === "error" && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-sm text-slate-300">
            If you’re using Outlook/Hotmail and email links don’t arrive, use
            Google sign-in or password instead.
          </p>
        </div>
      )}
    </div>
  );
}
