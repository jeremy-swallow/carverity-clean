import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadProgress, clearProgress, saveProgress } from "../utils/scanProgress";

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
        "No urgency-based pricing language.",
        "Price tone appears neutral.",
      ],
      language: [
        "No avoidance language detected.",
        "No repair-avoidance patterns found.",
      ],
      sellerTrust: [
        "Description suggests a private seller.",
        "Contact tone appears consistent.",
      ],
      missingInfo: ["Service history not stated"],
      recommendations: [
        "Request service records",
        "Confirm roadworthy or inspection status",
      ],
    },
    source: listingUrl,
  };
}

export default function OnlineResults() {
  const progress = loadProgress();
  const listingUrl = progress?.listingUrl ?? "(missing link)";

  const [report, setReport] = useState<any>(progress?.analysis ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    report ? "ready" : "loading"
  );

  useEffect(() => {
    if (report || !listingUrl) return;

    async function runAnalysis() {
      try {
        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingUrl }),
        });

        if (!res.ok) throw new Error("API failed");

        const aiReport = await res.json();

        saveProgress({ ...progress, analysis: aiReport });
        setReport(aiReport);
        setStatus("ready");
      } catch {
        // fallback to mock so UX never breaks
        const fallback = generateMockAnalysis(listingUrl);
        saveProgress({ ...progress, analysis: fallback });
        setReport(fallback);
        setStatus("error");
      }
    }

    runAnalysis();
  }, [report, listingUrl, progress]);

  function finishScan() {
    clearProgress();
  }

  if (!report) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 40 }}>
        <h1>Generating report…</h1>
        <p style={{ color: "#9aa7d9" }}>
          Analysing listing details and building structured insights…
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
          {status === "error" && " (AI offline — mock result)"}
        </div>

        <ReportCard title="Key insights" items={report.keyInsights} />
      </section>

      <ReportCard title="Pricing & value signals" items={report.sections.pricing} />
      <ReportCard title="Listing language risk signals" items={report.sections.language} />
      <ReportCard title="Seller trust indicators" items={report.sections.sellerTrust} />
      <ReportCard title="Missing / unknown information" items={report.sections.missingInfo} />
      <ReportCard title="Recommended next steps" items={report.sections.recommendations} />

      <Link
        to="/start-scan"
        onClick={finishScan}
        style={{ fontSize: 14, color: "#9aa7d9", marginTop: 6 }}
      >
        ← Back to start
      </Link>
    </div>
  );
}

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
