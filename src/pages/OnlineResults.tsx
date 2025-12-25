// src/pages/OnlineResults.tsx

import { useEffect, useState } from "react";
import { loadOnlineResults } from "../utils/onlineResults";
import type { StoredResult } from "../utils/onlineResults";
import { Link } from "react-router-dom";

export default function OnlineResults() {
  const [results, setResults] = useState<StoredResult[] | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    setResults(stored.length > 0 ? stored : null);
  }, []);

  if (!results) {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(24px, 6vw, 64px)",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          No results yet
        </h1>
        <p style={{ color: "#9aa3c7", fontSize: 15, marginBottom: 24 }}>
          Run an online scan first and your results will appear here.
        </p>

        <Link
          to="/online-start"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 20px",
            borderRadius: 999,
            background: "#7aa2ff",
            color: "#050816",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Start a new online scan
        </Link>
      </div>
    );
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
      <div>
        <span
          style={{
            fontSize: 13,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "#9aa3c7",
          }}
        >
          Online scan · Results
        </span>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
          How this listing looks on paper
        </h1>
        <p style={{ color: "#cbd5f5", fontSize: 15, marginTop: 8 }}>
          These are early signals based on the details you’ve provided. Use them
          as a guide only — always confirm with an in-person inspection and
          independent mechanic.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {results.map((item, index) => (
          <div
            key={index}
            style={{
              borderRadius: 16,
              padding: 16,
              background:
                "linear-gradient(135deg, rgba(148,163,255,0.08), rgba(15,23,42,0.9))",
              border: "1px solid rgba(148,163,255,0.25)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{item.title}</h2>

            <p
              style={{
                color: "#e5ebff",
                fontSize: 15,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              {item.description}
            </p>

            {item.action && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: "#fbbf24",
                  fontWeight: 500,
                }}
              >
                Next step: {item.action}
              </p>
            )}

            {item.confidence && (
              <p
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: "#9aa3c7",
                }}
              >
                Confidence: {item.confidence}
              </p>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        <Link
          to="/scan/online/next-actions"
          style={{
            padding: "10px 18px",
            borderRadius: 999,
            background: "#7aa2ff",
            color: "#050816",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Continue to next actions
        </Link>
      </div>
    </div>
  );
}
