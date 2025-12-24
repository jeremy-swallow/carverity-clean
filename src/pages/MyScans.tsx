import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { getCurrentUser, signOut } from "../supabaseAuth";
import { useNavigate } from "react-router-dom";

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

  async function loadScans() {
    const user = await getCurrentUser();
    if (!user) {
      alert("Please sign in to view your scans.");
      return;
    }

    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setScans(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadScans();
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
      <h1>My Scans</h1>

      <button onClick={handleSignOut}>Sign out</button>

      {loading && <p>Loading scans…</p>}

      {!loading && scans.length === 0 && (
        <p>You haven't saved any scans yet.</p>
      )}

      <ul style={{ marginTop: 20 }}>
        {scans.map((scan) => (
          <li key={scan.id} style={{ marginBottom: 16 }}>
            <strong>{scan.plan} scan</strong> —{" "}
            {new Date(scan.created_at).toLocaleString()}
            <br />
            {scan.report?.summary || "No summary"}
          </li>
        ))}
      </ul>
    </div>
  );
}
