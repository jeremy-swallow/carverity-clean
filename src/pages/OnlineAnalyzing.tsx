import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

/* =========================================================
   ONLINE ANALYSIS — TRANSITION SCREEN
   Purpose: reassurance + expectation setting
========================================================= */

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/scan/online/report");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 56px)",
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
          Checking the listing…
        </h1>

        <p
          style={{
            color: "#cbd5f5",
            maxWidth: 600,
            lineHeight: 1.6,
          }}
        >
          I’m reviewing the information in this listing and looking for anything
          that may be worth your attention before you inspect the car in person.
        </p>
      </header>

      {/* Progress */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: 24,
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        {[
          "Reviewing listing photos",
          "Checking for visible damage or inconsistencies",
          "Assessing condition indicators",
          "Preparing a summary for you",
        ].map((step, index) => (
          <div
            key={step}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: index === 0 ? 1 : 0.6,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: index === 0 ? "#7aa2ff" : "#475569",
              }}
            />
            <span style={{ fontSize: 15 }}>{step}</span>
          </div>
        ))}
      </section>

      {/* Reassurance */}
      <footer
        style={{
          fontSize: 13,
          color: "#9aa7d9",
          lineHeight: 1.5,
        }}
      >
        This usually takes a moment. You don’t need to stay on this screen — I’ll
        let you know when it’s ready.
      </footer>

      {/* Back option */}
      <Link
        to="/scan/online"
        style={{
          marginTop: 12,
          fontSize: 14,
          color: "#9aa7d9",
          textDecoration: "none",
          alignSelf: "flex-start",
        }}
      >
        ← Go back to the listing
      </Link>
    </div>
  );
}
