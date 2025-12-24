import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

export default function InPersonSummary() {
  const navigate = useNavigate();

  useEffect(() => {
    // The scan is complete — clear progress so Resume won't appear
    clearProgress();
  }, []);

  function handleSaveAndFinish() {
    const listingUrl = localStorage.getItem("carverity_listing_url") || "";

    const scan: SavedScan = {
      id: generateScanId(),
      type: "in-person",
      title: "In-person inspection summary",
      createdAt: new Date().toISOString(),
      summary:
        listingUrl
          ? `In-person inspection completed • Listing: ${listingUrl}`
          : "In-person inspection completed",
    };

    saveScan(scan);
    navigate("/my-scans");
  }

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* Step context */}
      <span
        style={{
          fontSize: 13,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "#9aa3c7",
        }}
      >
        In-person scan · Step 4 of 4 — Completed
      </span>

      <h1 style={{ fontSize: 26, fontWeight: 800 }}>
        Your in-person inspection summary
      </h1>

      <p style={{ color: "#cbd5f5", fontSize: 15 }}>
        You’ve completed the guided in-person check. Use this summary as a
        record of your visit and a reminder of anything you may want to discuss
        further with the seller.
      </p>

      {/* Highlights */}
      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <SummaryCard
          title="What this scan helps with"
          body="Capturing visual impressions, noting potential condition clues and
          building awareness of things worth double-checking."
        />

        <SummaryCard
          title="Good next steps"
          body="Ask questions about service history, request maintenance records or
          consider a mechanical inspection if the car still feels like a good option."
        />

        <SummaryCard
          title="Tip for comparing cars"
          body="Saving multiple scans in My Scans makes it easier to compare vehicles
          later instead of relying on memory."
        />
      </div>

      {/* Save notice */}
      <div
        style={{
          marginTop: 6,
          padding: 18,
          borderRadius: 14,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <p style={{ color: "#9aa3c7", fontSize: 13 }}>
          This is not a mechanical inspection or official vehicle report —
          it’s a guided checklist to support your decision-making.
        </p>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 6,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={handleSaveAndFinish}
          style={{
            padding: "14px 22px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            background: "#7aa2ff",
            color: "#0b1020",
            border: "none",
          }}
        >
          Save to My Scans
        </button>

        <button
          onClick={() => navigate("/start-scan")}
          style={{
            padding: "14px 22px",
            borderRadius: 12,
            fontSize: 16,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#cbd5f5",
          }}
        >
          Start another scan
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 14,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.15)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <strong style={{ fontSize: 16 }}>{title}</strong>
      <p style={{ color: "#cbd5f5", fontSize: 14 }}>{body}</p>
    </div>
  );
}
