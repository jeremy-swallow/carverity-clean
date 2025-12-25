import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { getCurrentUser } from "../supabaseAuth";

export default function OnlineReport() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [scanId, setScanId] = useState<string | null>(null);

  // 🔎 Detect scan_id in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("scan_id");
    if (id) {
      setScanId(id);
      fetchSavedScan(id);
    } else {
      setLoading(false);
    }
  }, []);

  // 🟡 Load existing saved scan from Supabase
  async function fetchSavedScan(id: string) {
    setLoading(true);

    const user = await getCurrentUser();
    if (!user) {
      navigate("/auth-link-expired");
      return;
    }

    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .eq("scan_id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Load scan error:", error);
    } else {
      setReport(data?.report || {});
    }

    setLoading(false);
  }

  // 💾 Save NEW scan
  async function saveScan() {
    const user = await getCurrentUser();
    if (!user) {
      alert("Your login session expired. Please sign in again.");
      navigate("/auth-link-expired");
      return;
    }

    const newId = crypto.randomUUID();

    const { error } = await supabase.from("scans").insert({
      user_id: user.id,
      scan_id: newId,
      plan: "online",
      scan_type: "online",
      report: report || {}
    });

    if (error) {
      console.error("Save error:", error);
      alert("There was a problem saving your scan.");
      return;
    }

    navigate("/my-scans");
  }

  return (
    <div>
      <h1>Online scan report</h1>

      {loading && <p>Loading…</p>}

      {!loading && (
        <>
          <pre>{JSON.stringify(report, null, 2)}</pre>

          {!scanId && (
            <button onClick={saveScan}>
              Save to My Scans
            </button>
          )}
        </>
      )}
    </div>
  );
}
