import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

type LedgerRow = {
  id: string;
  event_type: string;
  credits_delta: number;
  balance_after: number;
  created_at: string;
};

export default function CreditsHistory() {
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/signin");
        return;
      }

      const { data, error } = await supabase
        .from("credit_ledger")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setRows(data);
      setLoading(false);
    }

    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-slate-300">
        Loading credits history…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold mb-6">Credits history</h1>

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
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-white/10 text-slate-300"
              >
                <td className="px-4 py-3">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 capitalize">
                  {r.event_type.replace("_", " ")}
                </td>
                <td
                  className={`px-4 py-3 ${
                    r.credits_delta > 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {r.credits_delta > 0 ? "+" : ""}
                  {r.credits_delta}
                </td>
                <td className="px-4 py-3">{r.balance_after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
