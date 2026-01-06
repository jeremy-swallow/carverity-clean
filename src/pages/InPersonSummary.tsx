// src/pages/InPersonSummary.tsx
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";
import { syncScanToCloud } from "../services/scanSyncService";

export default function InPersonSummary() {
  const navigate = useNavigate();

  // Detect whether this scan has an associated listing
  const listingUrl = useMemo(
    () => localStorage.getItem("carverity_listing_url") || "",
    []
  );

  useEffect(() => {
    // The scan is complete — clear progress so Resume won't appear
    clearProgress();
  }, []);

  async function handleSaveAndFinish() {
    const scan: SavedScan = {
      id: generateScanId(),
      type: "in-person",
      title: "In-person inspection summary",
      createdAt: new Date().toISOString(),
      listingUrl,
      summary: listingUrl
        ? `In-person inspection completed • Linked listing: ${listingUrl}`
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

    navigate("/my-scans");
  }

  function startOnlineScan() {
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
          body="Confirm service records, ask about recent maintenance and consider a
          mechanical inspection if the car still feels like a good option."
        />

        <SummaryCard
          title="Tip for comparing cars"
          body="Saving multiple scans in My Scans makes it easier to compare vehicles
          later instead of relying on memory."
        />
      </div>

      {/* ⚖️ Guidance disclaimer */}
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
          This isn’t a mechanical inspection — it’s a guided checklist to help
          you make a more informed decision.
        </p>
      </div>

      {/* 💡 Optional dual-journey encouragement (only if NO listing is linked) */}
      {!listingUrl && (
        <div
          style={{
            marginTop: 4,
            padding: 20,
            borderRadius: 16,
            background:
              "linear-gradient(135deg, rgba(88,105,255,0.25), rgba(30,41,82,0.6))",
            border: "1px solid rgba(120,140,255,0.35)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <strong style={{ fontSize: 15 }}>
            Want an extra layer of guidance?
          </strong>

          <p style={{ color: "#cfd9ff", fontSize: 14 }}>
            If this car also has an online listing, you can run a CarVerity
            listing scan to analyse the wording, seller details and service
            information. It’s optional — but useful when you want the bigger
            picture.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={startOnlineScan}
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                background: "#7aa2ff",
                color: "#0b1020",
                border: "none",
              }}
            >
              Run an online listing scan
            </button>

            <button
              onClick={handleSaveAndFinish}
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                fontSize: 15,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#cbd5f5",
              }}
            >
              Skip — save this scan only
            </button>
          </div>
        </div>
      )}

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
