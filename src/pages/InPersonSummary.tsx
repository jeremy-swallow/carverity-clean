// src/pages/InPersonSummary.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";
import { syncScanToCloud } from "../services/scanSyncService";

export default function InPersonSummary() {
  const navigate = useNavigate();

  // Journey flags
  const hasOnlineScan =
    localStorage.getItem("carverity_online_completed") === "1";
  const hasInPersonScan = true; // we are on the in-person completion screen
  const dualJourneyComplete = hasOnlineScan && hasInPersonScan;

  useEffect(() => {
    // The scan is complete — clear progress so Resume won't appear
    clearProgress();
  }, []);

  async function handleSaveAndFinish() {
    const listingUrl = localStorage.getItem("carverity_listing_url") || "";

    const scan: SavedScan = {
      id: generateScanId(),
      type: "in-person",
      title: "In-person inspection summary",
      createdAt: new Date().toISOString(),
      listingUrl,
      summary: listingUrl
        ? `In-person inspection completed • Listing: ${listingUrl}`
        : "In-person inspection completed",
      completed: true,
    };

    // Local save
    saveScan(scan);

    // Cloud sync (safe if logged out)
    await syncScanToCloud(scan, {
      plan: "free",
      report: {
        listingUrl,
        type: "in-person",
        notes: scan.summary,
      },
    });

    // Mark journey step complete
    localStorage.setItem("carverity_inperson_completed", "1");

    navigate("/my-scans");
  }

  function goOnlineScan() {
    navigate("/scan/online");
  }

  function startNewScan() {
    navigate("/start-scan");
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

      {/* Dual-journey badge */}
      {dualJourneyComplete && (
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background: "rgba(16,120,80,0.18)",
            border: "1px solid rgba(16,160,110,0.45)",
          }}
        >
          <strong style={{ color: "#c9ffe5", fontSize: 14 }}>
            ✅ Dual-scan complete — strongest confidence
          </strong>
          <p style={{ color: "#b5f5db", fontSize: 13, marginTop: 6 }}>
            You’ve completed both the in-person inspection and the online
            listing analysis. Together they provide the most balanced
            understanding of this vehicle.
          </p>
        </div>
      )}

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

      {/* Optional encouragement — ONLY when online scan not done */}
      {!hasOnlineScan && (
        <div
          style={{
            borderRadius: 16,
            padding: 18,
            background: "rgba(80,120,255,0.12)",
            border: "1px solid rgba(140,170,255,0.35)",
          }}
        >
          <strong style={{ fontSize: 14, color: "#dfe6ff" }}>
            🧭 Optional next step — online listing scan
          </strong>

          <p style={{ color: "#c8d2ff", fontSize: 13, marginTop: 6 }}>
            If this car also has an online listing, you can run a quick online
            scan to analyse the wording, omissions and seller-provided details.
            It’s optional — some buyers prefer to rely on the in-person
            inspection alone — but completing both stages can help build a more
            rounded picture.
          </p>

          <button
            onClick={goOnlineScan}
            style={{
              marginTop: 10,
              padding: "12px 18px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              background: "#7aa2ff",
              color: "#0b1020",
              border: "none",
            }}
          >
            Run an online listing scan
          </button>
        </div>
      )}

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
          This is not a mechanical inspection or official vehicle report — it’s
          a guided checklist to support your decision-making.
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
          onClick={startNewScan}
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
