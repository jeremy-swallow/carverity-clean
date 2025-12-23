import { Link } from "react-router-dom";

export default function OnlineReport() {
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 48px)",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      {/* Header */}
      <section>
        <h1
          style={{
            fontSize: "clamp(28px, 6vw, 40px)",
            marginBottom: 8,
          }}
        >
          Here’s what stands out
        </h1>

        <p
          style={{
            color: "#cbd5f5",
            maxWidth: 640,
            lineHeight: 1.6,
          }}
        >
          I’ve reviewed the listing and focused on areas that commonly hide
          issues or affect value. This is an early assessment — not a verdict.
        </p>
      </section>

      {/* Overall signal */}
      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "rgba(255,255,255,0.04)",
          borderLeft: "4px solid #7aa2ff",
        }}
      >
        <strong style={{ fontSize: 18 }}>Overall signal</strong>
        <p style={{ color: "#cbd5f5", marginTop: 8 }}>
          The listing appears generally consistent, but there are a few areas
          worth clarifying before inspecting the car in person.
        </p>
      </section>

      {/* Key observations */}
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 22, margin: 0 }}>Key observations</h2>

        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            color: "#cbd5f5",
            lineHeight: 1.6,
          }}
        >
          <li>Some photos avoid close-ups of wear-prone areas</li>
          <li>Service history details are not clearly shown</li>
          <li>Pricing is within market range, but not a standout deal</li>
        </ul>
      </section>

      {/* Questions to ask seller with guidance */}
      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <h2 style={{ fontSize: 22, marginTop: 0 }}>
          Questions worth asking the seller
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <GuidedQuestion
            priority="High"
            question="Do you have service records or invoices for recent maintenance?"
            acceptable="Clear records, invoices, or a service booklet that matches the car’s age and mileage."
            redFlag="Vague answers, missing records, or reluctance to provide proof."
          />

          <GuidedQuestion
            priority="High"
            question="Has the car ever been in an accident or had paint/body repairs?"
            acceptable="Honest disclosure with details or repair documentation."
            redFlag="Deflecting the question, changing the subject, or inconsistent explanations."
          />

          <GuidedQuestion
            priority="Medium"
            question="Are there any mechanical issues or warning lights present?"
            acceptable="Minor issues disclosed upfront or recently addressed problems."
            redFlag="Claims that the car is ‘perfect’ without explanation or inspection."
          />

          <GuidedQuestion
            priority="Medium"
            question="Is the mileage consistent with how the car has been used?"
            acceptable="Usage that aligns with the kilometres shown (e.g. highway driving)."
            redFlag="Unclear usage patterns or explanations that don’t match wear."
          />

          <GuidedQuestion
            priority="Low"
            question="Are you happy for an independent inspection before purchase?"
            acceptable="Agreement or openness to an independent inspection."
            redFlag="Strong resistance or pressure to avoid inspections."
          />
        </div>
      </section>

      {/* What to do if you see red flags */}
      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <h2 style={{ fontSize: 22, marginTop: 0 }}>
          If you notice red flags
        </h2>

        <ol
          style={{
            margin: 0,
            paddingLeft: 20,
            color: "#cbd5f5",
            lineHeight: 1.6,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <li>
            <strong>Slow down.</strong> Red flags don’t always mean the car is bad,
            but they do mean it’s worth taking your time.
          </li>
          <li>
            <strong>Ask follow-up questions.</strong> Inconsistencies are often
            clarified by honest sellers when asked directly.
          </li>
          <li>
            <strong>Verify independently.</strong> Consider a mechanical
            inspection or professional opinion before committing.
          </li>
          <li>
            <strong>Be willing to walk away.</strong> There will always be other
            cars — pressure to rush is itself a warning sign.
          </li>
        </ol>
      </section>

      {/* CTA */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
        }}
      >
        <Link
          to="/scan/in-person"
          style={{
            padding: "14px 22px",
            borderRadius: 10,
            background: "#7aa2ff",
            color: "#0b1020",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Prepare for in-person inspection
        </Link>

        <Link
          to="/start-scan"
          style={{
            color: "#9ca3af",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          ← Check a different car
        </Link>
      </section>

      {/* Disclaimer */}
      <p style={{ color: "#6b7280", fontSize: 13 }}>
        This assessment is based only on the online listing provided and does
        not replace a physical inspection or professional mechanical advice.
      </p>
    </div>
  );
}

/* =========================================================
   GUIDED QUESTION BLOCK
========================================================= */

function GuidedQuestion({
  question,
  acceptable,
  redFlag,
  priority,
}: {
  question: string;
  acceptable: string;
  redFlag: string;
  priority: "High" | "Medium" | "Low";
}) {
  const priorityColor = {
    High: "#ef4444",
    Medium: "#f59e0b",
    Low: "#10b981",
  }[priority];

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: priorityColor,
            minWidth: 60,
          }}
        >
          {priority}
        </span>
        <strong style={{ color: "#e5e7eb" }}>{question}</strong>
      </div>

      <div style={{ fontSize: 14, color: "#cbd5f5" }}>
        <strong style={{ color: "#10b981" }}>Good sign:</strong>{" "}
        {acceptable}
      </div>

      <div style={{ fontSize: 14, color: "#cbd5f5" }}>
        <strong style={{ color: "#ef4444" }}>Red flag:</strong>{" "}
        {redFlag}
      </div>
    </div>
  );
}
