// src/pages/SignIn.tsx

import { useState } from "react";
import { signInWithMagicLink } from "../supabaseAuth";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setSending(true);

      await signInWithMagicLink(email.trim(), `${window.location.origin}/my-scans`);

      setSent(true);
    } catch (err) {
      console.error("Magic link error:", err);
      setError("Failed to send sign-in link. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <h1 className="text-3xl font-semibold text-white mb-3">
        Sign in to CarVerity
      </h1>

      <p className="text-slate-400 mb-8">
        Enter your email and we’ll send you a secure sign-in link.
        <br />
        No passwords. No accounts to manage.
      </p>

      {sent ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/30 p-5">
          <p className="text-emerald-300 font-medium">
            Check your email
          </p>
          <p className="text-slate-300 text-sm mt-2">
            We’ve sent a secure sign-in link to <strong>{email}</strong>.
            Open it on this device to continue.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
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

          {error && (
            <p className="text-red-400 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 transition"
          >
            {sending ? "Sending link…" : "Send sign-in link"}
          </button>
        </form>
      )}
    </div>
  );
}
