import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadScans } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

export default function MyScans() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<SavedScan[]>([]);

  useEffect(() => {
    setScans(loadScans());
  }, []);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
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
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>My Scans</h1>

      <p style={{ color: "#cbd5f5", fontSize: 15 }}>
        Saved online and in-person scans are stored here so you can revisit and
        compare cars later.
      </p>

      {/* Empty state */}
      {scans.length === 0 && (
        <div
          style={{
            padding: 20,
            borderRadius: 14,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <p style={{ color: "#cbd5f5", marginBottom: 6 }}>
            You haven’t saved any scans yet.
          </p>

          <button
            onClick={() => navigate("/start-scan")}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              background: "#7aa2ff",
              color: "#0b1020",
              border: "none",
              fontWeight: 600,
              marginTop: 6,
            }}
          >
            Start a scan
          </button>
        </div>
      )}

      {/* Scan list */}
      {scans.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {scans.map((scan) => (
            <div
              key={scan.id}
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
              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <strong style={{ fontSize: 16 }}>
                  {scan.title || "Saved scan"}
                </strong>

                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0b1020",
                    background:
                      scan.type === "online" ? "#7aa2ff" : "#8bffa5",
                  }}
                >
                  {scan.type === "online" ? "Online scan" : "In-person scan"}
                </span>
              </div>

              {/* Summary */}
              {scan.summary && (
                <p style={{ color: "#cbd5f5", fontSize: 14 }}>
                  {scan.summary}
                </p>
              )}

              {/* Footer meta */}
              <p style={{ color: "#9aa3c7", fontSize: 12 }}>
                Saved {formatDate(scan.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
