import { Link } from "react-router-dom";

/* =========================================================
   START SCAN — ASSISTANT DECISION PAGE
   Desktop-first (mobile later)
========================================================= */

export default function StartScan() {
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      {/* Intro */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>
          Let’s check the car together
        </h1>
        <p style={{ color: "#cbd5f5", maxWidth: 600, lineHeight: 1.6 }}>
          I’ll help you choose the best way to assess this car, depending on
          whether you’re browsing online or standing next to it.
        </p>
      </section>

      {/* Options */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
        }}
      >
        {/* Online scan */}
        <div
          style={{
            padding: 24,
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Online listing</h2>
          <p style={{ color: "#cbd5f5", lineHeight: 1.6 }}>
            Best if you’re researching cars on sites like Carsales or Facebook
            Marketplace.
          </p>
          <ul style={{ color: "#cbd5f5", paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Analyse listing photos</li>
            <li>Spot hidden issues or inconsistencies</li>
            <li>Compare condition before inspecting</li>
          </ul>

          <Link
            to="/scan/online"
            style={{
              alignSelf: "flex-start",
              marginTop: 8,
              padding: "12px 18px",
              borderRadius: 10,
              background: "#7aa2ff",
              color: "#0b1020",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            Scan an online listing
          </Link>
        </div>

        {/* In-person scan */}
        <div
          style={{
            padding: 24,
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>In-person inspection</h2>
          <p style={{ color: "#cbd5f5", lineHeight: 1.6 }}>
            Best if you’re physically with the car and want a guided check.
          </p>
          <ul style={{ color: "#cbd5f5", paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Step-by-step photo guidance</li>
            <li>Surface, body, and condition checks</li>
            <li>Immediate red-flag warnings</li>
          </ul>

          <Link
            to="/scan/in-person"
            style={{
              alignSelf: "flex-start",
              marginTop: 8,
              padding: "12px 18px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.12)",
              color: "#e5e7eb",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            Inspect a car in person
          </Link>
        </div>
      </section>
    </div>
  );
}
