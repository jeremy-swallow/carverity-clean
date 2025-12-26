import { Link } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";

export default function OnlineResults() {
  const progress = loadProgress();
  const listingUrl = progress?.listingUrl ?? "(missing link)";

  function finishScan() {
    clearProgress();
  }

  return (
    <div
      style={{
        maxWidth: 920,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* ===== TOP SUMMARY PANEL ===== */}
      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <h1 style={{ margin: 0 }}>Scan results — online listing review</h1>

        <div style={{ color: "#9aa7d9", fontSize: 14 }}>
          Listing analyzed:
          <br />
          {listingUrl}
        </div>

        {/* RISK STATUS */}
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.35)",
            color: "#a7f3d0",
            fontSize: 14,
          }}
        >
          <strong>Overall risk rating:</strong> Low (placeholder)
        </div>

        {/* KEY INSIGHTS */}
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 14,
            color: "#cbd5f5",
          }}
        >
          <strong>Key insights (placeholder):</strong>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            <li>No major red-flag wording detected.</li>
            <li>Price tone appears neutral and factual.</li>
            <li>Seller description suggests private sale.</li>
          </ul>
        </div>
      </section>

      {/* ===== SECTION CARDS ===== */}
      <section
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "1fr",
        }}
      >
        {/* Pricing Signals */}
        <ReportCard
          title="Pricing & value signals"
          items={[
            "No aggressive urgency language detected",
            "No unrealistic discount claims",
            "No contradictory pricing statements",
          ]}
        />

        {/* Listing Language Risk */}
        <ReportCard
          title="Listing language flags"
          items={[
            "Tone appears factual rather than sales-heavy",
            "No avoidance wording like “ran well last time”",
            "No negative repair-avoidance statements detected",
          ]}
        />

        {/* Seller Trust Indicators */}
        <ReportCard
          title="Seller trust indicators"
          items={[
            "Description structure suggests private sale",
            "No multiple-vehicle dealer pattern detected",
            "Contact wording appears consistent",
          ]}
        />

        {/* Missing Information */}
        <ReportCard
          title="Missing / unknown information"
          items={[
            "No odometer details in listing text",
            "Service history not confirmed",
            "Ownership history not stated",
          ]}
        />

        {/* Next Steps */}
        <ReportCard
          title="Recommended next steps"
          items={[
            "Request service records before inspection",
            "Confirm roadworthy or inspection history",
            "Proceed to in-person checklist for validation",
          ]}
        />
      </section>

      {/* FOOTER ACTION */}
      <Link
        to="/start-scan"
        onClick={finishScan}
        style={{
          fontSize: 14,
          color: "#9aa7d9",
          textDecoration: "none",
          marginTop: 8,
        }}
      >
        ← Back to start
      </Link>
    </div>
  );
}

/* =========================================================
   Reusable section component
   ========================================================= */
function ReportCard(props: { title: string; items: string[] }) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <strong style={{ fontSize: 15 }}>{props.title}</strong>

      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          fontSize: 14,
          lineHeight: 1.6,
          color: "#cbd5f5",
        }}
      >
        {props.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
