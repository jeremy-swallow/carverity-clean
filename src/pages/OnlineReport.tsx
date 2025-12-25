import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { getCurrentUser, signInWithMagicLink } from "../supabaseAuth";
import Toast from "../components/Toast";

export default function OnlineReport() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSaveScan() {
    try {
      setSaving(true);

      let user = await getCurrentUser();

      if (!user) {
        const email = window.prompt(
          "Enter your email to save your scan:"
        );

        if (!email) return;

        await signInWithMagicLink(
          email,
          `${window.location.origin}/my-scans`
        );

        Toast.info("Check your email to continue.");
        return;
      }

      const { error } = await supabase.from("scans").insert({
        created_at: new Date().toISOString(),
        scan_type: "online",
        report: {},
      });

      if (error) throw error;

      Toast.success("Saved to My Scans!");
      navigate("/my-scans");
    } catch (err: any) {
      console.error("Save scan error:", err?.message || err);
      Toast.error("There was a problem saving your scan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-wrap">
      <h1>Online scan report</h1>

      <button onClick={handleSaveScan} disabled={saving}>
        {saving ? "Saving…" : "Save to My Scans"}
      </button>
    </div>
  );
}
