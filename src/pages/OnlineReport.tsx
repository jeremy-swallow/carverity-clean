import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

export default function OnlineReport() {
  const navigate = useNavigate();

  useEffect(() => {
    // The scan is now complete — clear any active progress
    clearProgress();
  }, []);

  function handleSaveScan() {
    const listingUrl = localStorage.getItem("carverity_listing_url") || "";
    const kilometres = localStorage.getItem("carverity_kilometres") || "";
    const owners = localStorage.getItem("carverity_owners") || "";

    const summaryParts: string[] = [];

    if (listingUrl) {
      summaryParts.push(`Listing: ${listingUrl}`);
    }
    if (kilometres) {
      summaryParts.push(`Kilometres: ${kilometres}`);
    }
    if (owners) {
      summaryParts.push(`Owners: ${owners}`);
    }

    const summaryDetails =
      summaryParts.length > 0
        ? summaryParts.join(" | ")
        : "This report highlights usage, ownership and condition clues based on the details you provided.";

    const scan: SavedScan = {
      id: generateScanId(),
      type: "online",
      title: "Online scan report",
      createdAt: new Date().toISOString(),
      summary: summaryDetails,
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
        Online scan · Step 5 of 5
      </span>

      <h1 style={{ fontSize: 26, fontWeight: 800 }}>
        Your online scan insights
      </h1>

      <p style={{ color: "#cbd5f5", fontSize: 15 }}>
        Based on the listing link, kilometres and ownership details you
        provided, here are some signals and considerations that may help you
        decide whether this car is worth pursuing.
      </p>

      {/* Key highlights section */}
      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <HighlightCard
          title="Usage signals"
          body="Kilometres vs age can indicate how heavily the vehicle has been used. Large kilometre totals may suggest higher wear on components."
        />

        <HighlightCard
          title="Ownership patterns"
          body="Multiple owners in a short period can sometimes be worth asking more questions about — especially if the sale history feels frequent."
        />

        <HighlightCard
          title="Next step to consider"
          body="If the vehicle still seems promising, inspecting it in person or requesting service records can help build a clearer picture."
        />
      </div>

      {/* Callout */}
      <div
        style={{
          marginTop: 6,
          padding: 18,
          borderRadius: 14,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <p style={{ color: "#cbd5f5", fontSize: 14 }}>
          This report is designed to help you think about possible risk and
          condition clues — it is not a mechanical inspection or official
          vehicle history check.
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
          onClick={handleSaveScan}
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

function HighlightCard({ title, body }: { title: string; body: string }) {
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
