import { useEffect } from "react";
import { saveScan, generateScanId } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

const IN_PERSON_SAVED_FLAG = "carverity_in_person_saved";

export default function InPersonSummary() {
  useEffect(() => {
    const alreadySaved = localStorage.getItem(IN_PERSON_SAVED_FLAG);
    if (alreadySaved) return;

    const scan: SavedScan = {
      id: generateScanId(),
      type: "in-person",
      title: "In-person check — on site",
      createdAt: new Date().toISOString(),
      context: "in-person",
      summary:
        "This in-person inspection focused on visible condition, warning signs, and details that are difficult to verify from a listing alone.",
    };

    saveScan(scan);
    localStorage.setItem(IN_PERSON_SAVED_FLAG, "true");
  }, []);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <h1>In-person inspection complete</h1>

      <p style={{ color: "#cbd5f5", lineHeight: 1.6 }}>
        This inspection has been saved on this device so you can review it later.
      </p>

      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <strong>What this means</strong>
        <p style={{ color: "#cbd5f5", marginTop: 8 }}>
          Use this inspection to confirm details with the seller and decide
          whether further checks or a professional inspection are worthwhile.
        </p>
      </section>

      <p style={{ fontSize: 13, color: "#6b7280" }}>
        Saved locally on this device.
      </p>
    </div>
  );
}
