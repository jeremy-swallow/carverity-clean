// src/pages/Account.tsx

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

type Profile = {
  credits: number;
  email: string | null;
};

type LedgerRow = {
  id: string;
  event_type: string;
  credits_delta: number;
  balance_after: number;
  created_at: string;
};

export default function Account() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const showSuccess = searchParams.get("success") === "1";

  useEffect(() => {
    async function loadAccount() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/sign-in");
        return;
      }

      const [{ data: profileData, error: profileError }, { data: ledgerData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("credits, email")
            .eq("id", user.id)
            .single(),
          supabase
            .from("credit_ledger")
            .select(
              "id, event_type, credits_delta, balance_after, created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

      if (profileError) {
        console.error("Failed to load profile:", profileError);
        setProfile(null);
      } else {
        setProfile(profileData);
      }

      setLedger(ledgerData ?? []);
      setLoading(false);
    }

    loadAccount();
  }, [navigate, showSuccess]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-slate-300">
        Loading account…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-red-400">
        Failed to load account.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold mb-2">Your account</h1>
        <p className="text-slate-400">
          Manage your scan credits and view your activity.
        </p>
      </div>

      {showSuccess && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/30 px-4 py-3 text-emerald-300">
          ✅ Payment successful — credits have been added to your account.
        </div>
      )}

      {/* Credits balance */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">
            Available scan credits
          </p>
          <p className="text-4xl font-bold">{profile.credits}</p>
        </div>

        <button
          onClick={() => navigate("/pricing")}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-semibold"
        >
          Buy more credits
        </button>
      </div>

      {/* Explanation */}
      <div className="text-slate-400 text-sm">
        <p>
          Each in-person inspection report uses{" "}
          <strong>1 scan credit</strong>.
        </p>
        <p className="mt-1">
          Credits never expire and are tied to your account.
        </p>
      </div>

      {/* Credits history */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Credits history
        </h2>

        {ledger.length === 0 ? (
          <div className="text-slate-400 text-sm">
            No credit activity yet.
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Change</th>
                  <th className="px-4 py-3 text-left">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/10 text-slate-300"
                  >
                    <td className="px-4 py-3">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {row.event_type.replace("_", " ")}
                    </td>
                    <td
                      className={`px-4 py-3 ${
                        row.credits_delta > 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {row.credits_delta > 0 ? "+" : ""}
                      {row.credits_delta}
                    </td>
                    <td className="px-4 py-3">
                      {row.balance_after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
