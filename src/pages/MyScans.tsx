// src/pages/MyScans.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { getCurrentUser, signOut } from "../supabaseAuth";

interface Scan {
  id: string;
  scan_id: string;
  created_at: string;
  plan: string;
  scan_type: string;
  report: any;
}

export default function MyScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMissing, setUserMissing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();

      // ❗ Do NOT redirect — just mark user as not signed in
      if (!user) {
        setUserMissing(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load scans error:", error.message);
        setError("Failed to load scans");
      } else {
        setScans(data as Scan[]);
      }

      setLoading(false);
    }

    load();
  }, []);

  function openScan(scan: Scan) {
    if (scan.scan_type === "online") {
      sessionStorage.setItem("active_report", JSON.stringify(scan.report));
      navigate(`/scan/online/report?scan_id=${scan.scan_id}`);
    } else {
      alert("In-person scan viewer not implemented yet");
    }
  }

  async function doSignOut() {
    await signOut();
    navigate("/scan/online/start");
  }

  if (loading) return <p className="p-4">Loading…</p>;
  if (error) return <p className="p-4 text-red-400">{error}</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">My Scans</h1>

        {!userMissing && (
          <button onClick={doSignOut}>Sign out</button>
        )}
      </div>

      {userMissing && (
        <p className="opacity-80">
          You’re not signed in — no saved scans yet.
        </p>
      )}

      {!userMissing && scans.length === 0 && (
        <p>No scans saved yet.</p>
      )}

      {!userMissing && (
        <div className="space-y-3">
          {scans.map((scan) => (
            <button
              key={scan.id}
              onClick={() => openScan(scan)}
              className="w-full text-left p-3 rounded-lg border border-white/20 hover:bg-white/10"
            >
              <div className="font-semibold">
                {scan.scan_type === "online"
                  ? "Online scan"
                  : "In-person scan"}
              </div>
              <div className="text-sm opacity-70">
                {new Date(scan.created_at).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
