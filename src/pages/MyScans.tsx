import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadScans } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

export default function MyScans() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<SavedScan[]>([]);

  useEffect(() => {
    const stored = loadScans();
    setScans(stored);
  }, []);

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
        <p style={{ color: "#cbd5f5", maxWidth: 640, lineHeight: 1.6 }}>
          These scans are saved locally on this device. You can revisit them
          anytime.
        </p>
      </header>

      {scans.length === 0 ? (
        <section
          style={{
            padding: 24,
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#9aa3c7",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "white" }}>No scans yet</strong>
          <p style={{ marginTop: 8 }}>
            Start a scan and your latest results will appear here.
          </p>

          <button
            onClick={() => navigate("/start-scan")}
            style={{
              marginTop: 14,
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
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {scans.map((scan) => (
            <button
              key={scan.id}
              onClick={() =>
                navigate(
                  scan.type === "online"
                    ? "/scan/online/report"
                    : "/scan/in-person/summary"
                )
              }
              style={{
                textAlign: "left",
                padding: 20,
                borderRadius: 16,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                color: "white",
              }}
            >
              <strong style={{ fontSize: 16 }}>{scan.title}</strong>

              <div style={{ marginTop: 6, fontSize: 13, color: "#9aa3c7" }}>
                {scan.type === "online" ? "Online scan" : "In-person scan"}
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                {new Date(scan.createdAt).toLocaleString()}
              </div>
            </button>
          ))}
        </section>
      )}

      <button
        onClick={() => navigate("/start-scan")}
        style={{
          marginTop: 8,
          alignSelf: "flex-start",
          background: "none",
          border: "none",
          color: "#9aa3c7",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        ← Start a new scan
      </button>
    </div>
  );
}
