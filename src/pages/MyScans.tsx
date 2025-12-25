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
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // 1) If Supabase sent an error in the URL, send user to the fallback page
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get("error");

        if (errorParam) {
          // Preserve details (error_description etc.) for the fallback page
          navigate(`/auth/link-expired?${params.toString()}`, { replace: true });
          return;
        }

        // 2) Normal flow — user should be signed in at this point
        const user = await getCurrentUser();

        if (!user) {
          setError("You’re not signed in. Please save a scan again to get a new login link.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("scans")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setScans(data || []);
      } catch (err: any) {
        console.error("MyScans load error:", err);
        setError(err.message || "Something went wrong loading your scans.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [navigate]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
      <h1>My Scans</h1>

      <button
        onClick={handleSignOut}
        style={{
          padding: "8px 14px",
          borderRadius: 10,
          border: "1px solid #3c4560",
          background: "transparent",
          color: "#fff",
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        Sign out
      </button>

      {loading && <p>Loading scans…</p>}

      {!loading && error && (
        <p style={{ color: "#ff8080" }}>
          {error}
        </p>
      )}

      {!loading && !error && scans.length === 0 && (
        <p>You haven&apos;t saved any scans yet.</p>
      )}

      {!loading && !error && scans.length > 0 && (
        <ul style={{ marginTop: 20 }}>
          {scans.map((scan) => (
            <li key={scan.id} style={{ marginBottom: 16 }}>
              <strong>{scan.plan} scan</strong>{" "}
              ({new Date(scan.created_at).toLocaleString()})
              <br />
              {scan.report?.summary || "No summary"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
