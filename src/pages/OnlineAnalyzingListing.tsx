// src/pages/OnlineAnalyzingListing.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";

const STEPS = [
  "Reading listing content…",
  "Detecting make & model…",
  "Checking specification clues…",
  "Reviewing photo coverage…",
  "Extracting key vehicle details…",
  "Preparing pre-fill suggestions…",
];

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const url = localStorage.getItem("carverity_listing_url");
    if (!url) {
      navigate("/start-scan", { replace: true });
      return;
    }

    saveProgress({
      type: "online",
      step: "/online/analyzing-listing",
      startedAt: new Date().toISOString(),
    });

    // --- Simulated smooth progress ---
    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(100, p + Math.random() * 12));
    }, 260);

    // --- Cycle visible step messages ---
    const stepTimer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 900);

    // --- After ~4.5s → continue to vehicle details ---
    const continueTimer = setTimeout(() => {
      const state = loadProgress() ?? {};
      saveProgress({
        ...state,
        listingPrefillReady: true,
      });

      navigate("/online/vehicle-details", { replace: true });
    }, 4500);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
      clearTimeout(continueTimer);
    };
  }, [navigate]);

  return (
    <div
      style={{
        maxWidth: 780,
        margin: "0 auto",
        padding: "clamp(28px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <span
        style={{
          fontSize: 13,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "#9aa3c7",
        }}
      >
        Online scan · Listing analysis in progress
      </span>

      <h1 style={{ fontSize: 24, fontWeight: 800 }}>
        We’re analysing the listing for you
      </h1>

      <p style={{ fontSize: 15, color: "#cbd5f5", maxWidth: 560 }}>
        Sit tight — we’re extracting useful details to help pre-fill the next
        step. You can review and edit anything before continuing.
      </p>

      {/* PROGRESS BAR */}
      <div
        style={{
          marginTop: 10,
          borderRadius: 14,
          border: "1px solid rgba(148,163,255,0.35)",
          background: "rgba(15,23,42,0.65)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 14,
            width: `${progress}%`,
            background:
              "linear-gradient(90deg,#8fb3ff,#b7c7ff,#8fb3ff)",
            transition: "width 0.35s ease",
          }}
        />
      </div>

      {/* CURRENT STEP */}
      <div
        style={{
          marginTop: 6,
          color: "#e5ebff",
          fontWeight: 500,
          fontSize: 15,
        }}
      >
        {STEPS[stepIndex]}
      </div>

      {/* FUTURE STEPS LIST */}
      <ul style={{ marginTop: 6, color: "#9aa3c7", fontSize: 13 }}>
        {STEPS.map((s, i) => (
          <li
            key={i}
            style={{
              opacity: i <= stepIndex ? 1 : 0.45,
              marginTop: 4,
            }}
          >
            {i < stepIndex ? "✓ " : "• "}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
