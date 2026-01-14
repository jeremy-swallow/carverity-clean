// src/pages/Account.tsx

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

type Profile = {
  credits: number;
  email: string | null;
};

export default function Account() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const showSuccess = searchParams.get("success") === "1";

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/sign-in");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("credits, email")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to load profile:", error);
      } else {
        setProfile(data);
      }

      setLoading(false);
    }

    loadProfile();
  }, [navigate]);

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
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold mb-2">Your account</h1>

      <p className="text-slate-400 mb-8">
        Manage your scan credits and purchases.
      </p>

      {showSuccess && (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-900/30 px-4 py-3 text-emerald-300">
          ✅ Payment successful — credits have been added to your account.
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Available scan credits</p>
            <p className="text-4xl font-bold">
              {profile.credits}
            </p>
          </div>

          <button
            onClick={() => navigate("/pricing")}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-semibold"
          >
            Buy more credits
          </button>
        </div>
      </div>

      <div className="mt-8 text-slate-400 text-sm leading-relaxed">
        <p>
          Each in-person inspection report uses <strong>1 scan credit</strong>.
        </p>
        <p className="mt-2">
          Credits never expire and remain tied to your account.
        </p>
      </div>
    </div>
  );
}
