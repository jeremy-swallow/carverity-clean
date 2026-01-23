// src/pages/AuthLinkExpired.tsx

import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { signInWithMagicLink } from "../supabaseAuth";

const CANONICAL_APP_ORIGIN = "https://carverity.com.au";

export default function AuthLinkExpired() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  async function resendLink() {
    setError(null);

    if (!cleanEmail) {
      setError("Missing email address.");
      return;
    }

    try {
      setSending(true);

      await signInWithMagicLink(cleanEmail, `${CANONICAL_APP_ORIGIN}/my-scans`);

      setSent(true);
    } catch (e) {
      console.error("Resend link failed:", e);
      setError("Could not resend the link. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-white">
      <h1 className="text-3xl font-semibold mb-3">Sign-in link expired</h1>

      <p className="text-slate-400 mb-8">
        Magic links are single-use and can expire.
        <br />
        If you’re on Outlook/Hotmail and links never arrive, use password sign-in
        instead.
      </p>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
        {cleanEmail ? (
          <>
            <p className="text-slate-300 text-sm">
              We can send a new sign-in link to{" "}
              <strong className="text-white">{cleanEmail}</strong>.
            </p>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {sent ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/30 p-4">
                <p className="text-emerald-300 font-medium">
                  New link sent
                </p>
                <p className="text-slate-300 text-sm mt-1">
                  Check your email and open the link on this device.
                </p>
              </div>
            ) : (
              <button
                onClick={resendLink}
                disabled={sending}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 transition"
              >
                {sending ? "Sending…" : "Resend sign-in link"}
              </button>
            )}

            <button
              onClick={() => navigate("/signin")}
              className="w-full rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 text-slate-200 font-semibold px-4 py-3 transition"
            >
              Go to sign-in options
            </button>
          </>
        ) : (
          <>
            <p className="text-slate-300 text-sm">
              Please return to sign-in and request a new link.
            </p>
            <button
              onClick={() => navigate("/signin")}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-semibold px-4 py-3 transition"
            >
              Back to sign-in
            </button>
          </>
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={() => navigate("/")}
          className="text-slate-300 underline text-sm"
        >
          ← Return to home
        </button>
      </div>
    </div>
  );
}
