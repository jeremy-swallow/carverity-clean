// src/pages/InPersonSummary.tsx
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { clearProgress, loadProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";
import { syncScanToCloud } from "../services/scanSyncService";

export default function InPersonSummary() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  // Journey flags
  const hasOnlineScan =
    localStorage.getItem("carverity_online_completed") === "1";
  const hasInPersonScan = true;
  const dualJourneyComplete = hasOnlineScan && hasInPersonScan;

  // Extract logged data from earlier steps
  const imperfections = progress?.imperfections ?? [];
  const followUps = progress?.followUpPhotos ?? [];
  const checks = progress?.checks ?? {};

  /* =========================================================
     Helpers — friendlier labels for internal keys
  ========================================================== */
  const labelMap: Record<string, string> = {
    "test-drive-sounds": "Driving / mechanical noises",
    "warning-lights": "Dashboard warnings",
    "odour-interior": "Interior odours or moisture",
  };

  const mapLabel = (k: string) => labelMap[k] ?? k;

  /* =========================================================
     Derived groupings
  ========================================================== */

  // Things worth confirming with the seller
  const sellerQuestions = useMemo(() => {
    const list: string[] = [];

    imperfections.forEach((i: any) => {
      if (i?.type) list.push(`${i.type}${i?.note ? ` — ${i.note}` : ""}`);
    });

    followUps
      .filter((f: any) => !f.completed)
      .forEach((f: any) => list.push(`Clarify: ${f.label}`));

    Object.entries(checks).forEach(([k, v]) => {
      if (typeof v === "string" && v.includes("worth confirming")) {
        list.push(mapLabel(k));
      }
    });

    return list;
  }, [imperfections, followUps, checks]);

  // Areas that could influence cost or negotiation
  const possibleCostAreas = useMemo(() => {
    const list: string[] = [];

    imperfections.forEach((i: any) => {
      const text = `${i?.type ?? ""} ${i?.note ?? ""}`.toLowerCase();

      if (text.includes("tyre")) list.push("Tyres may require replacement soon.");
      if (text.includes("scratch") || text.includes("paint"))
        list.push("Paintwork / cosmetic touch-ups may be required.");
      if (text.includes("dent"))
        list.push("Panel dent repair may be needed depending on severity.");
      if (text.includes("wheel"))
        list.push("Wheel refurbishment may be required.");
      if (text.includes("windscreen") || text.includes("chip"))
        list.push("Windscreen chip or crack may require repair.");
    });

    return Array.from(new Set(list));
  }, [imperfections]);

  // Normal / positive findings
  const generalImpressions = useMemo(() => {
    const list: string[] = [];

    Object.entries(checks).forEach(([k, v]) => {
      if (typeof v === "string" && v.includes("everything seemed normal")) {
        list.push(mapLabel(k));
      }
    });

    return list;
  }, [checks]);

  /* =========================================================
     Observation list for user ownership value
  ========================================================== */
  const observationList = useMemo(() => {
    const out: string[] = [];

    imperfections.forEach((i: any) => {
      out.push(
        `${i?.type ?? "Observation"}${
          i?.note ? ` — ${i.note}` : ""
        } (${i?.costBand ?? "Cost unknown"})`
      );
    });

    followUps
      .filter((f: any) => f.completed)
      .forEach((f: any) => out.push(`Photo taken — ${f.label}`));

    return out;
  }, [imperfections, followUps]);

  /* =========================================================
     At-a-glance indicators
  ========================================================== */

  const glance = {
    normal: generalImpressions.length,
    confirm: sellerQuestions.length,
    cost: possibleCostAreas.length,
  };

  /* =========================================================
     Save + persist scan
  ========================================================== */

  useEffect(() => {
    clearProgress(); // scan completed — disable Resume
  }, []);

  async function handleSaveAndFinish() {
    const listingUrl = localStorage.getItem("carverity_listing_url") || "";

    const scan: SavedScan = {
      id: generateScanId(),
      type: "in-person",
      title: "In-person inspection summary",
      createdAt: new Date().toISOString(),
      listingUrl,
      summary: "In-person guided inspection completed",
      completed: true,
    };

    saveScan(scan);

    await syncScanToCloud(scan, {
      plan: "free",
      report: {
        listingUrl,
        type: "in-person",
        notes: scan.summary,
        observations: { imperfections, followUps, checks },
      },
    });

    localStorage.setItem("carverity_inperson_completed", "1");
    navigate("/my-scans");
  }

  function goOnlineScan() {
    navigate("/scan/online");
  }

  function startNewScan() {
    navigate("/start-scan");
  }

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <span
        style={{
          fontSize: 13,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "#9aa3c7",
        }}
      >
        In-person scan · Step 4 of 4 — Completed
      </span>

      {dualJourneyComplete && (
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background: "rgba(16,120,80,0.18)",
            border: "1px solid rgba(16,160,110,0.45)",
          }}
        >
          <strong style={{ color: "#c9ffe5", fontSize: 14 }}>
            ✅ Dual-scan complete — strongest confidence
          </strong>
          <p style={{ color: "#b5f5db", fontSize: 13, marginTop: 6 }}>
            You’ve completed both the in-person inspection and the online
            listing scan. Together they provide a clearer and more balanced
            understanding of this vehicle.
          </p>
        </div>
      )}

      {/* At-a-glance summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
          gap: 10,
        }}
      >
        <GlancePill
          label="Appeared normal"
          value={glance.normal}
          tone="positive"
        />
        <GlancePill
          label="Worth confirming"
          value={glance.confirm}
          tone="neutral"
        />
        <GlancePill
          label="May affect cost"
          value={glance.cost}
          tone="caution"
        />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800 }}>
        Your in-person inspection summary
      </h1>

      <p style={{ color: "#cbd5f5", fontSize: 15 }}>
        This summary captures what you observed during your in-person visit.
        Nothing here is labelled as a fault — it highlights areas that are
        either normal, worth confirming with the seller, or may influence your
        decision.
      </p>

      {/* Observation list */}
      {!!observationList.length && (
        <SummaryBlock
          title="Observations you recorded"
          tone="neutral"
          items={observationList}
        />
      )}

      {!!sellerQuestions.length && (
        <SummaryBlock
          title="Things worth confirming with the seller"
          tone="neutral"
          items={sellerQuestions}
        />
      )}

      {!!possibleCostAreas.length && (
        <SummaryBlock
          title="Areas that may affect cost or negotiation"
          tone="caution"
          items={possibleCostAreas}
          footnote="These aren’t automatically problems — costs depend on condition and context."
        />
      )}

      {!!generalImpressions.length && (
        <SummaryBlock
          title="General condition impressions"
          tone="positive"
          items={generalImpressions}
        />
      )}

      {!sellerQuestions.length &&
        !possibleCostAreas.length &&
        !generalImpressions.length &&
        !observationList.length && (
          <SummaryCard
            title="Inspection completed"
            body="No specific concerns or observations were recorded during this guided check."
          />
        )}

      {/* Adaptive recommended actions */}
      <NextStepsCard
        hasCostItems={possibleCostAreas.length > 0}
        hasUncertainItems={sellerQuestions.length > 0}
      />

      <TestDriveCard />

      {!hasOnlineScan && (
        <EncouragementCard
          onClick={goOnlineScan}
          label="🧭 Optional next step — online listing scan"
          body="If this car has an online listing, you can run a quick CarVerity listing scan to analyse the wording, omissions and seller-provided details. Completing both stages can help build a more rounded picture."
          button="Run an online listing scan"
        />
      )}

      <NoticeCard text="This is not a mechanical inspection or formal defect report — it’s a guided record to support your decision-making." />

      <Actions onSave={handleSaveAndFinish} onNew={startNewScan} />
    </div>
  );
}

/* =========================================================
   UI Helpers
========================================================= */

function GlancePill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "neutral" | "caution";
}) {
  const bg =
    tone === "positive"
      ? "rgba(120,240,200,0.18)"
      : tone === "caution"
      ? "rgba(255,200,120,0.18)"
      : "rgba(255,255,255,0.08)";
  const border =
    tone === "positive"
      ? "rgba(120,240,200,0.35)"
      : tone === "caution"
      ? "rgba(255,200,120,0.35)"
      : "rgba(255,255,255,0.18)";

  return (
    <div
      style={{
        borderRadius: 14,
        padding: 12,
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <strong style={{ fontSize: 18 }}>{value}</strong>
      <div style={{ fontSize: 12, color: "#dfe6ff" }}>{label}</div>
    </div>
  );
}

function SummaryBlock({
  title,
  tone,
  items,
  footnote,
}: {
  title: string;
  tone: "neutral" | "caution" | "positive";
  items: string[];
  footnote?: string;
}) {
  const bg =
    tone === "caution"
      ? "rgba(255,180,80,0.10)"
      : tone === "positive"
      ? "rgba(100,220,180,0.12)"
      : "rgba(255,255,255,0.05)";
  const border =
    tone === "caution"
      ? "rgba(255,200,120,0.35)"
      : tone === "positive"
      ? "rgba(120,240,200,0.35)"
      : "rgba(255,255,255,0.15)";

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 18,
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <strong style={{ fontSize: 15 }}>{title}</strong>
      <ul style={{ marginTop: 8, color: "#dfe6ff", fontSize: 14 }}>
        {items.map((i, idx) => (
          <li key={idx} style={{ marginTop: 6 }}>
            {i}
          </li>
        ))}
      </ul>
      {footnote && (
        <p style={{ color: "#b9c3ff", fontSize: 12, marginTop: 10 }}>
          {footnote}
        </p>
      )}
    </div>
  );
}

function SummaryCard({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 14,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.15)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <strong style={{ fontSize: 16 }}>{title}</strong>
      <p style={{ color: "#cbd5f5", fontSize: 14 }}>{body}</p>
    </div>
  );
}

function NextStepsCard({
  hasCostItems,
  hasUncertainItems,
}: {
  hasCostItems: boolean;
  hasUncertainItems: boolean;
}) {
  const items: string[] = [];

  if (hasCostItems)
    items.push(
      "Ask the seller for receipts, quotes or service records relating to observed items."
    );

  if (hasUncertainItems)
    items.push(
      "Discuss unclear areas with the seller and confirm details before committing."
    );

  items.push(
    "If the vehicle still feels like a good option, consider a mechanical inspection for added peace of mind."
  );

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 18,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      <strong style={{ fontSize: 15 }}>Recommended next steps</strong>
      <ul style={{ marginTop: 8, color: "#dfe6ff", fontSize: 14 }}>
        {items.map((i, idx) => (
          <li key={idx} style={{ marginTop: 6 }}>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestDriveCard() {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 18,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      <strong style={{ fontSize: 15 }}>Before your test drive</strong>
      <ul style={{ marginTop: 8, color: "#dfe6ff", fontSize: 14 }}>
        <li style={{ marginTop: 6 }}>
          Listen for knocks, rattles or whining noises when braking, turning or
          accelerating.
        </li>
        <li style={{ marginTop: 6 }}>
          Check that the steering feels stable and the car tracks straight on a
          flat road.
        </li>
        <li style={{ marginTop: 6 }}>
          Watch the dashboard for warning lights that stay on or appear during
          the drive.
        </li>
        <li style={{ marginTop: 6 }}>
          If the car has{" "}
          <strong>advanced safety or driver-assist features (ADAS)</strong>,
          test that they activate normally and show no warnings.
        </li>
        <li style={{ marginTop: 6 }}>
          After driving, check for smells, smoke or fresh drips under the car.
        </li>
      </ul>
      <p style={{ color: "#b9c3ff", fontSize: 12, marginTop: 10 }}>
        Only use driver-assist systems where safe and legal, and never rely on
        them in place of your own attention.
      </p>
    </div>
  );
}

function EncouragementCard({
  onClick,
  label,
  body,
  button,
}: {
  onClick: () => void;
  label: string;
  body: string;
  button: string;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 18,
        background: "rgba(80,120,255,0.12)",
        border: "1px solid rgba(140,170,255,0.35)",
      }}
    >
      <strong style={{ fontSize: 14, color: "#dfe6ff" }}>{label}</strong>
      <p style={{ color: "#c8d2ff", fontSize: 13, marginTop: 6 }}>{body}</p>
      <button
        onClick={onClick}
        style={{
          marginTop: 10,
          padding: "12px 18px",
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          background: "#7aa2ff",
          color: "#0b1020",
          border: "none",
        }}
      >
        {button}
      </button>
    </div>
  );
}

function NoticeCard({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 14,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <p style={{ color: "#9aa3c7", fontSize: 13 }}>{text}</p>
    </div>
  );
}

function Actions({
  onSave,
  onNew,
}: {
  onSave: () => void;
  onNew: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginTop: 6,
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={onSave}
        style={{
          padding: "14px 22px",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          background: "#7aa2ff",
          color: "#0b1020",
          border: "none",
        }}
      >
        Save to My Scans
      </button>

      <button
        onClick={onNew}
        style={{
          padding: "14px 22px",
          borderRadius: 12,
          fontSize: 16,
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.25)",
          color: "#cbd5f5",
        }}
      >
        Start another scan
      </button>
    </div>
  );
}
