// src/pages/OnlineReport.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { getCurrentUser } from "../supabaseAuth";

export default function OnlineReport() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [userMissing, setUserMissing] = useState(false);

  // 🔎 Detect scan_id in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("scan_id");

    // If coming from My Scans ➜ load saved scan
    if (id) {
      setScanId(id);
      fetchSavedScan(id);
    } else {
      // If fresh scan ➜ load from sessionStorage
      const stored = sessionStorage.getItem("active_report");
      if (stored) {
        setReport(JSON.parse(stored));
      }
      setLoading(false);
    }
  }, []);

  // 🟢 Load saved scan WITHOUT forcing login
  async function fetchSavedScan(id: string) {
    setLoading(true);

    // Try to read user (optional only)
    const user = await getCurrentUser();
    if (!user) {
      // No session? ➜ still try loading by scan_id only
      setUserMissing(true);
    }

    const query = supabase.from("scans").select("*").eq("scan_id", id).single();

    const { data, error } = await query;

    if (error) {
      console.error("Load scan error:", error);
    } else {
      setReport(data?.report || {});
    }

    setLoading(false);
  }

  // 💾 Save NEW scan (only if user exists)
  async function saveScan() {
    const user = await getCurrentUser();

    if (!user) {
      alert("To save scans across devices, please sign in first (coming soon).");
      return;
    }

    const newId = crypto.randomUUID();

    const { error } = await supabase.from("scans").insert({
      user_id: user.id,
      scan_id: newId,
      plan: "online",
      scan_type: "online",
      report: report || {},
    });

    if (error) {
      console.error("Save error:", error);
      alert("There was a problem saving your scan.");
      return;
    }

    navigate(`/my-scans`);
  }

  return (
    <div>
      <h1>Online scan report</h1>

      {loading && <p>Loading…</p>}

      {!loading && (
        <>
          <pre>{JSON.stringify(report, null, 2)}</pre>

          {/* Only show save button for fresh scans */}
          {!scanId && (
            <button onClick={saveScan}>
              Save to My Scans
            </button>
          )}

          {/* Friendly message when viewing a scan without login */}
          {scanId && userMissing && (
            <p style={{ opacity: 0.7, marginTop: "1rem" }}>
              You’re viewing this scan without a sign-in session.
              Saving and history will be available when accounts are added.
            </p>
          )}
        </>
      )}
    </div>
  );
}
