import { loadScans } from "../utils/scanStorage";

export default function OnlineReport() {
  const scans = loadScans();
  const scan = scans.find((s) => s.type === "online");

  if (!scan) {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(24px, 6vw, 64px)",
        }}
      >
        <h1>No report found</h1>
        <p style={{ color: "#cbd5f5" }}>
          This online scan could not be loaded. Please start again.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <h1>Online Listing Report</h1>

      <div
        style={{
          padding: 20,
          borderRadius: 14,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <strong>{scan.title}</strong>

        {scan.listingUrl && (
          <p style={{ marginTop: 8 }}>
            <a
              href={scan.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#7aa2ff", wordBreak: "break-all" }}
            >
              View original listing
            </a>
          </p>
        )}

        <p style={{ color: "#cbd5f5", marginTop: 8 }}>
          Created {new Date(scan.createdAt).toLocaleString()}
        </p>
      </div>

      <p style={{ color: "#cbd5f5" }}>
        Full AI insights will appear here in the next phase.
      </p>
    </div>
  );
}
