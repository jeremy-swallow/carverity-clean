import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadScans } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

export default function ScanDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [scan, setScan] = useState<SavedScan | null>(null);

  useEffect(() => {
    const scans = loadScans();
    const found = scans.find((s) => s.id === id);
    setScan(found || null);
  }, [id]);

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

  if (!scan) {
    return (
      <div
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "clamp(24px, 6vw, 64px)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Scan not found</h1>

        <p style={{ color: "#cbd5f5" }}>
          This scan may have been removed or can’t be loaded.
        </p>

        <button
          onClick={() => navigate("/my-scans")}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            background: "#7aa2ff",
            color: "#0b1020",
            border: "none",
            fontWeight: 600,
            width: "fit-content",
          }}
        >
          Back to My Scans
        </button>
      </div>
    );
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
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: "8px 12px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.1)",
          color: "#e5ebff",
          border: "1px solid rgba(255,255,255,0.2)",
          width: "fit-content",
        }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: 26, fontWeight: 800 }}>
        {scan.title || "Saved scan"}
      </h1>

      <span
        style={{
          padding: "6px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          color: "#0b1020",
          background: scan.type === "online" ? "#7aa2ff" : "#8bffa5",
          width: "fit-content",
        }}
      >
        {scan.type === "online" ? "Online scan" : "In-person scan"}
      </span>

      <p style={{ color: "#9aa3c7", fontSize: 13 }}>
        Saved {formatDate(scan.createdAt)}
      </p>

      {scan.summary && (
        <div
          style={{
            padding: 18,
            borderRadius: 14,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <strong style={{ fontSize: 15 }}>Summary</strong>
          <p style={{ color: "#cbd5f5", marginTop: 6 }}>{scan.summary}</p>
        </div>
      )}

      <div
        style={{
          padding: 18,
          borderRadius: 14,
          background: "rgba(255,255,255,0.03)",
          border: "1px dashed rgba(255,255,255,0.15)",
        }}
      >
        <p style={{ color: "#9aa3c7", fontSize: 13 }}>
          More detail will appear here in future versions (photos, notes,
          condition flags and guided insights).
        </p>
      </div>
    </div>
  );
}
