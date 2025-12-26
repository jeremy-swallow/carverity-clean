import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadProgress, clearProgress, saveProgress } from "../utils/scanProgress";

/**
 * Temporary local AI engine (mock)
 * In a later milestone we will replace this with a
 * real OpenAI or server-side call — this keeps the
 * structure identical so no UI rewrite is needed.
 */
function generateMockAnalysis(listingUrl: string) {
  return {
    riskRating: "Low",
    keyInsights: [
      "No immediate wording-based risk indicators detected.",
      "Seller tone appears factual rather than emotional or urgent.",
      "No contradictory condition statements found in listing text.",
    ],
    sections: {
      pricing: [
        "No unrealistic discount claims detected.",
        "No anchor-pricing or urgency-based pricing wording.",
        "Price tone appears neutral and descriptive.",
      ],
      language: [
        "No avoidance language such as “ran well last time”.",
        "No repair-avoidance or condition masking patterns detected.",
        "No strong emotional lead-in phrases.",
      ],
      sellerTrust: [
        "Description structure suggests a private sale.",
        "No marketplace reposting pattern detected.",
        "Contact language appears consistent.",
      ],
      missingInfo: [
        "Odometer details not explicitly stated in text.",
        "Service history not confirmed.",
        "Ownership history not stated.",
      ],
      recommendations: [
        "Request service records before inspection.",
        "Confirm roadworthy or inspection status.",
        "Proceed to in-person inspection checklist.",
      ],
    },
    source: listingUrl,
  };
}

export default function OnlineResults() {
  const progress = loadProgress();
  const listingUrl = progress?.listingUrl ?? "(missing link)";

  const [report, setReport] = useState<any>(progress?.analysis ?? null);

  // Generate analysis on first load if none exists
  useEffect(() => {
    if (!report && listingUrl) {
      const generated = generateMockAnalysis(listingUrl);

      // Persist into progress so results survive refresh
      saveProgress({
        ...progress,
        analysis: generated,
      });

      setReport(generated);
    }
  }, [report, listingUrl, progress]);

  function finishScan() {
    clearProgress();
  }

  if (!report) {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(24px, 6vw, 64px)",
        }}
      >
        <h1>Generating report…</h1>
        <p style={{ color: "#9aa7d9" }}>
          Analysing listing text, pricing tone, seller patterns, and risk-related
          wording…
        </p>
      </div>
    );
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
      {/* ===== SUMMARY PANEL ===== */}
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
        <h1 style={{ margin: 0 }}>Scan results — AI analysis</h1>

        <div style={{ color: "#9aa7d9", fontSize: 14 }}>
          Listing analysed:
          <br />
          {report.source}
        </div>

        {/* Risk rating */}
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
          <strong>Overall risk rating:</strong> {report.riskRating}
        </div>

        {/* Key insights */}
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
          <strong>Key insights</strong>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            {report.keyInsights.map((i: string, idx: number) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== SECTION CARDS ===== */}
      <ReportCard
        title="Pricing & value signals"
        items={report.sections.pricing}
      />
      <ReportCard
        title="Listing language risk signals"
        items={report.sections.language}
      />
      <ReportCard
        title="Seller trust indicators"
        items={report.sections.sellerTrust}
      />
      <ReportCard
        title="Missing / unknown information"
        items={report.sections.missingInfo}
      />
      <ReportCard
        title="Recommended next steps"
        items={report.sections.recommendations}
      />

      <Link
        to="/start-scan"
        onClick={finishScan}
        style={{
          fontSize: 14,
          color: "#9aa7d9",
          textDecoration: "none",
          marginTop: 6,
        }}
      >
        ← Back to start
      </Link>
    </div>
  );
}

/* ========= Reusable report section ========= */
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
        {props.items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
