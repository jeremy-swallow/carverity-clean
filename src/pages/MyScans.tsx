import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadScans,
  deleteScan,
  clearAllScans,
  updateScanTitle,
} from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

export default function MyScans() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<SavedScan[]>([]);

  useEffect(() => {
    setScans(loadScans());
  }, []);

  function handleRename(scan: SavedScan) {
    const newTitle = prompt(
      "Rename this scan:",
      scan.title
    );
    if (!newTitle || !newTitle.trim()) return;

    updateScanTitle(scan.id, newTitle.trim());
    setScans(loadScans());
  }

  function handleDelete(scanId: string) {
    const ok = confirm("Delete this scan?");
    if (!ok) return;

    deleteScan(scanId);
    setScans(loadScans());
  }

  function handleClearAll() {
    const ok = confirm("Delete all scans?");
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
        <h1 style={{ fontSize: 36 }}>
          My scans
        </h1>
        <p style={{ color: "#cbd5f5" }}>
          Saved locally on this device.
        </p>
      </header>

      {scans.length === 0 && (
        <p style={{ color: "#cbd5f5" }}>
          No scans yet.
        </p>
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
                  gap: 12,
                }}
              >
                <strong>{scan.title}</strong>

                <div style={{ fontSize: 13, color: "#9aa3c7" }}>
                  {scan.type === "online"
                    ? "Online scan"
                    : "In-person scan"}
                </div>

                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {new Date(scan.createdAt).toLocaleString()}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() =>
                      navigate(
                        scan.type === "online"
                          ? "/scan/online/report"
                          : "/scan/in-person/summary"
                      )
                    }
                  >
                    View
                  </button>

                  <button onClick={() => handleRename(scan)}>
                    Rename
                  </button>

                  <button onClick={() => handleDelete(scan.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </section>

          <button onClick={handleClearAll}>
            Clear all scans
          </button>
        </>
      )}
    </div>
  );
}
