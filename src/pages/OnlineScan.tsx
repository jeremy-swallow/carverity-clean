import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress } from "../utils/scanProgress";

export default function OnlineScan() {
  const navigate = useNavigate();
  const [link, setLink] = useState("");

  useEffect(() => {
    saveProgress({
      type: "online",
      step: "/scan/online",
      startedAt: new Date().toISOString(),
    });

    const existing = localStorage.getItem("carverity_listing_url");
    if (existing) setLink(existing);
  }, []);

  function handleContinue() {
    const trimmed = link.trim();
    localStorage.setItem("carverity_listing_url", trimmed);

    saveProgress({
      type: "online",
      step: "/scan/online/details",
      listingUrl: trimmed,
    });

    navigate("/scan/online/details");
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(24px,6vw,64px)", display: "flex", flexDirection: "column", gap: 24 }}>
      <span style={{ fontSize: 13, letterSpacing: 0.8, textTransform: "uppercase", color: "#9aa3c7" }}>
        Online scan · Step 1 of 3
      </span>

      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Add the listing link (optional)</h1>

      <p style={{ color: "#cbd5f5", fontSize: 15 }}>
        Paste the URL to the car listing, or continue without one.
        The link is saved with your report but isn’t scraped.
      </p>

      <input
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

      <button
        onClick={handleContinue}
        style={{
          padding: "14px 22px",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 600,
          background: "#7aa2ff",
          color: "#0b1020",
          border: "none",
          cursor: "pointer",
        }}
      >
        Continue
      </button>
    </div>
  );
}
