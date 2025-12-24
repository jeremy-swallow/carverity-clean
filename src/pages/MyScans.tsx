import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadScans,
  deleteScan,
  clearAllScans,
} from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

export default function MyScans() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<SavedScan[]>([]);

  useEffect(() => {
    setScans(loadScans());
  }, []);

  function handleDelete(scanId: string) {
    const ok = confirm("Delete this scan? This cannot be undone.");
    if (!ok) return;

    deleteScan(scanId);
    setScans(loadScans());
  }

  function handleClearAll() {
    const ok = confirm(
      "Delete all saved scans on this device? This cannot be undone."
    );
    if (!ok) return;

    clearAllScans();
    setScans([]);
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 36,
      }}
    >
      <header>
        <h1 style={{ fontSize: 36, marginBottom: 10 }}>
          My scans
        </h1>

        <p
          style={{
            color: "#cbd5f5",
            maxWidth: 680,
            lineHeight: 1.6,
          }}
        >
          These scans are saved <strong>locally on this device</strong>.
        </p>
      </header>

      {scans.length === 0 && (
        <section
          style={{
            padding: 28,
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <strong>No scans yet</strong>

          <p style={{ color: "#cbd5f5", marginTop: 8 }}>
            Run an online or in-person scan to see it here.
          </p>

          <button
            onClick={() => navigate("/start-scan")}
            style={{
              marginTop: 16,
              padding: "14px 22px",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 600,
              background: "#7aa2ff",
              color: "#0b1020",
              border: "none",
              cursor: "pointer",
            }}
          >
            Start a scan
          </button>
        </section>
      )}

      {scans.length > 0 && (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {scans.map((scan) => (
              <div
                key={scan.id}
                style={{
                  padding: 22,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <strong>{scan.title}</strong>

                <div
                  style={{
                    fontSize: 13,
                    color: "#9aa3c7",
                  }}
                >
                  {scan.type === "online"
                    ? "Online scan"
                    : "In-person scan"}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  {new Date(scan.createdAt).toLocaleString()}
                </div>

                {scan.summary && (
                  <p
                    style={{
                      fontSize: 14,
                      color: "#cbd5f5",
                      lineHeight: 1.5,
                    }}
                  >
                    {scan.summary}
                  </p>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() =>
                      navigate(
                        scan.type === "online"
                          ? "/scan/online/report"
                          : "/scan/in-person/summary"
                      )
                    }
                    style={{
                      padding: "10px 16px",
                      borderRadius: 12,
                      background: "transparent",
                      border:
                        "1px solid rgba(122,162,255,0.4)",
                      color: "#7aa2ff",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    View
                  </button>

                  <button
                    onClick={() => handleDelete(scan.id)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 12,
                      background: "transparent",
                      border:
                        "1px solid rgba(239,68,68,0.5)",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </section>

          <button
            onClick={handleClearAll}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Clear all scans
          </button>
        </>
      )}
    </div>
  );
}
