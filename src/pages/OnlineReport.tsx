import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { getCurrentUser, signInWithMagicLink } from "../supabaseAuth";

export default function OnlineReport() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  function generateScanId() {
    return crypto.randomUUID();
  }

  async function handleSaveScan() {
    try {
      setSaving(true);

      // Ensure user is logged in
      const user = await getCurrentUser();

      if (!user) {
        const email = window.prompt("Enter your email to save your scan:");
        if (!email) return;

        await signInWithMagicLink(
          email,
          `${window.location.origin}/my-scans`
        );

        alert("Check your email to continue.");
        return;
      }

      const scan_id = generateScanId();

      const { error } = await supabase.from("scans").insert({
        scan_id,
        user_id: user.id,
        scan_type: "online",
        plan: "free",
        report: {
          source: "online-report-v1"
        }
      });

      if (error) throw error;

      alert("Saved to My Scans!");
      navigate("/my-scans");

    } catch (err: any) {
      console.error("Save scan error:", err?.message || err);
      alert("There was a problem saving your scan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-wrap">
      <h1>Online scan report</h1>

      <button onClick={handleSaveScan} disabled={saving}>
        {saving ? "Saving..." : "Save to My Scans"}
      </button>
    </div>
  );
}
