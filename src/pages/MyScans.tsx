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
    const ok = confirm("Delete this scan?");
    if (!ok) return;

    deleteScan(scanId);
    setScans(loadScans());
  }

  function handleClearAll() {
    const ok = confirm("Delete all saved scans?");
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
        gap: 32,
      }}
    >
      <header>
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>My scans</h1>
        <p style={{ color: "#cbd5f5", maxWidth: 640 }}>
          These scans are saved locally on this device.
        </p>
      </header>

      {scans.length === 0 ? (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            color: "#9aa3c7",
          }}
        >
          You don’t have any saved scans yet.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {scans.map((scan) => (
              <div
                key={scan.id}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "white",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div>
                  <strong>{scan.title}</strong>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      color: "#9aa3c7",
                    }}
                  >
                    {scan.type === "online" ? "Online scan" : "In-person scan"}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    {new Date(scan.createdAt).toLocaleString()}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 8,
                  }}
                >
                  <button
                    onClick={() =>
                      navigate(
                        scan.type === "online"
                          ? `/scan/online/report/${scan.id}`
                          : `/scan/in-person/summary/${scan.id}`
                      )
                    }
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      background: "transparent",
                      border: "1px solid rgba(122,162,255,0.4)",
                      color: "#7aa2ff",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    View
                  </button>

                  <button
                    onClick={() => handleDelete(scan.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      background: "transparent",
                      border: "1px solid rgba(239,68,68,0.5)",
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
          </div>

          <button
            onClick={handleClearAll}
            style={{
              marginTop: 12,
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
