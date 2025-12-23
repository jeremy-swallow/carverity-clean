import { Link } from "react-router-dom";

export default function OnlineStart() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(20px, 5vw, 48px)",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      {/* Heading */}
      <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h1
          style={{
            fontSize: "clamp(26px, 6vw, 40px)",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Let’s start with the listing
        </h1>

        <p
          style={{
            color: "#cbd5f5",
            maxWidth: 560,
            lineHeight: 1.6,
          }}
        >
          Share the online listing you’re looking at and I’ll help you spot
          potential issues before you inspect the car in person.
        </p>
      </header>

      {/* Input card */}
      <section
        style={{
          padding: 20,
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <label
          style={{
            fontSize: 14,
            color: "#9aa7d9",
          }}
        >
          Paste listing link
        </label>

        <input
          type="url"
          placeholder="https://www.carsales.com.au/..."
          style={{
            padding: "14px 16px",
            borderRadius: 10,
            border: "none",
            outline: "none",
            fontSize: 16,
            background: "#0f1733",
            color: "#fff",
          }}
        />

        <div
          style={{
            fontSize: 13,
            color: "#9aa7d9",
            lineHeight: 1.5,
          }}
        >
          Supported sites include Carsales, Facebook Marketplace, dealer
          listings, and most major classifieds.
        </div>
      </section>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          style={{
            padding: "14px 22px",
            borderRadius: 12,
            background: "#7aa2ff",
            color: "#0b1020",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          Continue
        </button>

        <Link
          to="/start-scan"
          style={{
            alignSelf: "center",
            fontSize: 14,
            color: "#9aa7d9",
            textDecoration: "none",
          }}
        >
          ← Choose a different scan type
        </Link>
      </div>

      {/* Reassurance */}
      <footer
        style={{
          marginTop: 24,
          fontSize: 13,
          color: "#9aa7d9",
        }}
      >
        No sign-up required yet. We’ll guide you step by step.
      </footer>
    </div>
  );
}
