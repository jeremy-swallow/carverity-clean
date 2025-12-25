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
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) {
        navigate("/");
        return;
      }

      const { data } = await supabase
        .from("scans")
        .select("*")
        .order("created_at", { ascending: false });

      setScans(data ?? []);
      setLoading(false);
    }

    load();
  }, [navigate]);

  return (
    <div className="page-wrap">
      <h1>My Scans</h1>

      <button onClick={signOut}>Sign out</button>

      {loading && <p>Loading…</p>}

      {!loading && scans.length === 0 && <p>No scans yet.</p>}

      {!loading &&
        scans.map((scan) => (
          <div key={scan.id}>
            <strong>{scan.scan_type}</strong> — {scan.created_at}
          </div>
        ))}
    </div>
  );
}
