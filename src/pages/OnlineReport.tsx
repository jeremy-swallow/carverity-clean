import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { getCurrentUser } from "../supabaseAuth";

export default function OnlineReport() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const listingUrl = localStorage.getItem("carverity_listing_url") || "";
  const kilometres = localStorage.getItem("carverity_kms") || "";
  const owners = localStorage.getItem("carverity_owners") || "";

  async function handleSaveScan() {
    try {
      setSaving(true);

      const user = await getCurrentUser();
      if (!user) {
        const email = window.prompt(
          "Enter your email so we can save this scan to your account"
        );
        if (!email) return;

        await supabase.auth.signInWithOtp({ email });
        alert("Check your email to finish signing in, then save again.");
        setSaving(false);
        return;
      }

      const summaryParts: string[] = [];
      if (listingUrl) summaryParts.push(`Listing: ${listingUrl}`);
      if (kilometres) summaryParts.push(`KMs: ${kilometres}`);
      if (owners) summaryParts.push(`Owners: ${owners}`);

      const scan = {
        scan_id: crypto.randomUUID(),
        plan: "online",
        scan_type: "online",
        report: { summary: summaryParts.join(" · ") },
        negotiation: {},
        refinements: {},
      };

      const { error } = await supabase
        .from("scans")
        .insert({ ...scan, user_id: user.id });

      if (error) throw error;

      // Clear local progress after successful cloud save
      localStorage.removeItem("carverity_listing_url");
      localStorage.removeItem("carverity_kms");
      localStorage.removeItem("carverity_owners");

      navigate("/my-scans");
    } catch (err: any) {
      alert("There was a problem saving your scan: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
      <h1>Online scan report</h1>

      <p>
        This report highlights usage, ownership and condition clues based on the
        details you provided.
      </p>

      {listingUrl && <p>Listing: {listingUrl}</p>}
      {kilometres && <p>Kilometres: {kilometres}</p>}
      {owners && <p>Owners: {owners}</p>}

      <button
        onClick={handleSaveScan}
        disabled={saving}
        style={{
          padding: "14px 22px",
          borderRadius: 12,
          fontWeight: 600,
          background: "#7aa2ff",
          color: "#0b1020",
          cursor: "pointer",
          border: "none",
          marginTop: 24,
        }}
      >
        {saving ? "Saving…" : "Save to My Scans"}
      </button>
    </div>
  );
}
