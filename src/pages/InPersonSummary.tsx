import { useEffect } from "react";
import { saveScan, generateScanId } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

const SCAN_SAVED_FLAG = "carverity_latest_in_person_scan_saved";

export default function InPersonSummary() {
  /* ---------------------------------------------------------
     Save in-person scan summary (once)
     Improved, contextual title
  --------------------------------------------------------- */
  useEffect(() => {
    const alreadySaved = localStorage.getItem(SCAN_SAVED_FLAG);
    if (alreadySaved) return;

    const scan: SavedScan = {
      id: generateScanId(),
      type: "in-person",
      title: "In-person check — on site",
      createdAt: new Date().toISOString(),
    };

    saveScan(scan);
    localStorage.setItem(SCAN_SAVED_FLAG, "true");
  }, []);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      {/* Header */}
      <section>
        <h1 style={{ fontSize: 36, marginBottom: 12 }}>
          In-person check complete
        </h1>

        <p style={{ color: "#cbd5f5", maxWidth: 680, lineHeight: 1.6 }}>
          You’ve completed an in-person inspection. This summary has been saved
          on this device so you can review it later.
        </p>
      </section>

      {/* Guidance */}
      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <strong style={{ display: "block", marginBottom: 8 }}>
          What to do next
        </strong>

        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            color: "#cbd5f5",
            lineHeight: 1.6,
          }}
        >
          <li>Compare what you observed with the seller’s claims</li>
          <li>Clarify any unclear history or condition details</li>
          <li>Consider a professional inspection if you’re unsure</li>
        </ul>
      </section>

      {/* Disclaimer */}
      <p style={{ color: "#6b7280", fontSize: 13 }}>
        This summary is saved locally on this device and does not replace a
        professional inspection or mechanical advice.
      </p>
    </div>
  );
}
