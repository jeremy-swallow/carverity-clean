// src/pages/OnlineAnalyzingListing.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

const STEPS = [
  "Reading listing content…",
  "Checking vehicle details…",
  "Extracting key information…",
  "Preparing suggestions…",
];

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const url = localStorage.getItem("carverity_listing_url");
    if (!url) {
      navigate("/start-scan", { replace: true });
      return;
    }

    async function runAnalysis() {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingUrl: url }),
      });

      const json = await res.json();

      if (json?.ok) {
        const existing = loadProgress() ?? {};
        saveProgress({
          ...existing,
          vehicle: {
            ...(existing as any).vehicle,
            make: json.extracted.make || "",
            model: json.extracted.model || "",
            year: json.extracted.year || "",
            variant: json.extracted.variant || "",
            importStatus:
              (existing as any).vehicle?.importStatus ?? "unknown",
          },
        });
      }

      navigate("/online/vehicle-details", { replace: true });
    }

    const interval = setInterval(() => {
      setStepIndex((i) =>
        i + 1 < STEPS.length ? i + 1 : STEPS.length - 1
      );
    }, 800);

    runAnalysis();
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(28px, 6vw, 72px)",
      }}
    >
      <span
        style={{
          fontSize: 13,
          textTransform: "uppercase",
          color: "#9aa3c7",
          letterSpacing: 0.8,
        }}
      >
        Online scan · Analyzing listing
      </span>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>
        Fetching details from the listing…
      </h1>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column" }}>
        {STEPS.map((s, i) => (
          <div
            key={i}
            style={{
              padding: 12,
              borderRadius: 10,
              marginBottom: 8,
              border:
                i === stepIndex
                  ? "1px solid rgba(148,163,255,0.8)"
                  : "1px solid rgba(255,255,255,0.1)",
              background:
                i <= stepIndex
                  ? "rgba(148,163,255,0.12)"
                  : "rgba(15,23,42,0.6)",
              color: i <= stepIndex ? "#cbd5ff" : "#9aa3c7",
            }}
          >
            {i < stepIndex ? "✔︎ " : i === stepIndex ? "⋯ " : "○ "}
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
