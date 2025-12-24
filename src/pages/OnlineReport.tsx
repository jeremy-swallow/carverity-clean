import { useEffect } from "react";
import {
  saveScan,
  generateScanId,
  SavedScan,
} from "../utils/scanStorage";

type SavedReport = {
  concern: string;
  context: string;
  createdAt: string;
};

const STORAGE_KEY = "carverity_latest_online_report";
const SCAN_SAVED_FLAG = "carverity_latest_online_scan_saved";

export default function OnlineReport() {
  const concern =
    localStorage.getItem("carverity_primary_concern") ||
    "Not sure — just want peace of mind";

  const context =
    localStorage.getItem("carverity_scan_context") || "online";

  /* ---------------------------------------------------------
     Save detailed report (existing behaviour)
  --------------------------------------------------------- */
  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      const report: SavedReport = {
        concern,
        context,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(report));
    }
  }, [concern, context]);

  /* ---------------------------------------------------------
     Save scan summary (NEW)
     Ensures this only happens once
  --------------------------------------------------------- */
  useEffect(() => {
    const alreadySaved = localStorage.getItem(SCAN_SAVED_FLAG);
    if (alreadySaved) return;

    const scan: SavedScan = {
      id: generateScanId(),
      type: "online",
      title: "Online listing check",
      createdAt: new Date().toISOString(),
    };

    saveScan(scan);
    localStorage.setItem(SCAN_SAVED_FLAG, "true");
  }, []);

  function concernIntro() {
    switch (concern) {
      case "Mechanical issues":
        return "You mentioned mechanical reliability as your main concern, so I focused on signs that could indicate wear, neglect, or hidden issues.";
      case "Accident or damage history":
        return "You mentioned accident or damage history as your main concern, so I paid closer attention to panel alignment, paint consistency, and what the photos don’t show.";
      case "Price vs condition":
        return "You mentioned price versus condition as your main concern, so I focused on whether the listing presentation and details justify the asking price.";
      default:
        return "You mentioned wanting peace of mind, so I took a broad look at the listing to spot anything that might be worth checking more closely.";
    }
  }

  function keyFocusPoints() {
    switch (concern) {
      case "Mechanical issues":
        return [
          "Gaps or inconsistencies in service history",
          "Lack of detail around recent maintenance",
          "Photos that avoid engine bay or underbody views",
        ];
      case "Accident or damage history":
        return [
          "Photos that avoid certain angles or panels",
          "Inconsistent reflections or paint finish",
          "Limited close-ups of common impact areas",
        ];
      case "Price vs condition":
        return [
          "Presentation quality compared to similar listings",
          "Kilometres relative to price",
          "Missing details that justify the premium",
        ];
      default:
        return [
          "Overall consistency of the listing",
          "What’s shown versus what’s not",
          "Signals that suggest further verification",
        ];
    }
  }

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
          Your latest assessment
        </h1>

        <p style={{ color: "#cbd5f5", maxWidth: 680, lineHeight: 1.6 }}>
          I’ve reviewed the listing with your priorities in mind. This report is
          saved and available on this device.
        </p>
      </section>

      {/* Personalised intro */}
      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "rgba(255,255,255,0.04)",
          borderLeft: "4px solid #7aa2ff",
        }}
      >
        <strong style={{ fontSize: 18 }}>
          Focus based on your concern
        </strong>
        <p style={{ color: "#cbd5f5", marginTop: 8 }}>
          {concernIntro()}
        </p>
      </section>

      {/* Key focus points */}
      <section>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          What I paid closest attention to
        </h2>

        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            color: "#cbd5f5",
            lineHeight: 1.6,
          }}
        >
          {keyFocusPoints().map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      {/* Guidance */}
      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <strong style={{ display: "block", marginBottom: 6 }}>
          What this means for you
        </strong>
        <p style={{ color: "#cbd5f5", margin: 0 }}>
          This assessment is designed to help you slow down and verify the right
          details. If the car still interests you, the next step is confirming
          what isn’t visible from the listing alone.
        </p>
      </section>

      {/* Disclaimer */}
      <p style={{ color: "#6b7280", fontSize: 13 }}>
        This assessment is saved locally on this device and does not replace a
        physical inspection or professional advice.
      </p>
    </div>
  );
}
