import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress } from "../utils/scanProgress";

export default function OnlineScan() {
  const navigate = useNavigate();
  const [link, setLink] = useState("");

  const canContinue = link.trim().length > 10;

  useEffect(() => {
    // Mark this as the current step in the online scan
    saveProgress({
      type: "online",
      step: "/scan/online",
      startedAt: new Date().toISOString(),
    });

    // If the user has already entered a listing URL before, pre-fill it
    const existing = localStorage.getItem("carverity_listing_url");
    if (existing && existing.trim().length > 0) {
      setLink(existing);
    }
  }, []);

  function handleContinue() {
    const trimmed = link.trim();
    localStorage.setItem("carverity_listing_url", trimmed);

    // Next step in the flow
    navigate("/scan/online/kilometres");
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
      {/* Step context */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontSize: 13,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "#9aa3c7",
          }}
        >
          Online scan · Step 1 of 5
        </span>

        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          Start with the listing link
        </h1>

        <p style={{ color: "#cbd5f5", fontSize: 15 }}>
          Paste the URL to the car you’re interested in. CarVerity uses this to
          understand the listing details so we can guide your assessment.
        </p>
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 8,
        }}
      >
        <label
          htmlFor="listing-url"
          style={{ fontSize: 14, color: "#cbd5f5", fontWeight: 500 }}
        >
          Listing URL
        </label>

        <input
          id="listing-url"
          type="url"
          placeholder="https://www.carsales.com.au/..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
          style={{
            padding: 16,
            borderRadius: 12,
            fontSize: 16,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(7,10,25,0.9)",
            color: "#e5ebff",
          }}
        />

        <p style={{ color: "#9aa3c7", fontSize: 13 }}>
          We don’t share this link with anyone. It’s only used to help you
          assess the vehicle.
        </p>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 12 }}>
        <button
          disabled={!canContinue}
          onClick={handleContinue}
          style={{
            padding: "14px 22px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            background: canContinue ? "#7aa2ff" : "#3a3f55",
            color: canContinue ? "#0b1020" : "#9aa3c7",
            border: "none",
            cursor: canContinue ? "pointer" : "default",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
