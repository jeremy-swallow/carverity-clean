import { useNavigate } from "react-router-dom";
import { saveScan, generateScanId } from "../utils/scanStorage";
import { clearProgress } from "../utils/scanProgress";
import type { SavedScan } from "../utils/scanStorage";

export default function OnlineReport() {
  const navigate = useNavigate();

  const listingUrl =
    localStorage.getItem("carverity_listing_url") || "";
  const kilometres =
    localStorage.getItem("carverity_kilometres") || "";
  const owners = localStorage.getItem("carverity_owners") || "";

  function handleSaveScan() {
    const summaryParts: string[] = [];

    if (listingUrl) summaryParts.push(`Listing: ${listingUrl}`);
    if (kilometres) summaryParts.push(`Kilometres: ${kilometres}`);
    if (owners) summaryParts.push(`Owners: ${owners}`);

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

    // Scan is finished — don’t offer resume any more
    clearProgress();

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
        gap: 24,
      }}
    >
      <span
        style={{
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color: "#9aa3c7",
        }}
      >
        Online scan · Final step
      </span>

      <h1 style={{ fontSize: 24, fontWeight: 800 }}>
        Your scan report is ready
      </h1>

      <p style={{ color: "#cbd5f5", fontSize: 15 }}>
        This summary highlights usage patterns, ownership history clues and
        potential risk indicators based on the details you’ve entered.
      </p>

      <div
        style={{
          padding: 18,
          borderRadius: 14,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <strong style={{ fontSize: 15 }}>Summary details</strong>

        <div style={{ color: "#cbd5f5", marginTop: 6, fontSize: 14 }}>
          {kilometres && <p>Kilometres: {kilometres}</p>}
          {owners && <p>Owners: {owners}</p>}
          {listingUrl && (
            <p>
              Listing:{" "}
              <a
                href={listingUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#9bb5ff" }}
              >
                {listingUrl}
              </a>
            </p>
          )}
          {!kilometres && !owners && !listingUrl && (
            <p>
              No extra details were captured for this scan. You can use this
              report as a general reference when comparing cars.
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleSaveScan}
        style={{
          padding: "14px 22px",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 600,
          background: "#7aa2ff",
          color: "#0b1020",
          border: "none",
          cursor: "pointer",
          width: "fit-content",
        }}
      >
        Save to My Scans
      </button>
    </div>
  );
}
