// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
  type VehicleInfo,
  normaliseVehicle,
} from "../utils/onlineResults";

const UNLOCK_KEY = "carverity_test_full_unlock";

/* =========================================================
   Types & constants
========================================================= */

type ReportSection = {
  title: string;
  body: string;
};

type RiskSeverity = "critical" | "moderate" | "info";

type RiskItem = {
  label: string;
  severity: RiskSeverity;
  description: string;
  action: string;
};

type RiskBuckets = {
  critical: RiskItem[];
  moderate: RiskItem[];
  info: RiskItem[];
};

/**
 * Normalises headings so we can match things like:
 * — KEY RISK SIGNALS —
 * **NEGOTIATION ADVICE**
 * Key risks & warnings
 */
function normaliseHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/[—\-_:•|]+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SECTION_ALIASES: Record<string, string[]> = {
  "Confidence assessment": [
    "confidence assessment",
    "confidence code",
    "assessment summary",
  ],
  "What this means for you": [
    "what this means for you",
    "what this means",
    "buyer takeaway",
  ],
  "Key risk signals": [
    "key risk signals",
    "key risks",
    "risk signals",
    "risks and warnings",
    "risk assessment",
  ],
  "Buyer considerations": [
    "buyer considerations",
    "important considerations",
    "things to consider",
  ],
  "Negotiation insights": [
    "negotiation insights",
    "negotiation advice",
    "price negotiation",
    "negotiation tips",
  ],
  "General ownership notes": [
    "general ownership notes",
    "ownership notes",
    "ownership guidance",
    "running cost considerations",
  ],
  "CarVerity analysis — summary": [
    "carverity analysis summary",
    "summary",
    "analysis summary",
  ],
};

const SECTION_MARKERS = Object.entries(SECTION_ALIASES).map(
  ([label, aliases]) => ({ label, aliases })
);

/* =========================================================
   Text helpers & section cleaning
========================================================= */

function cleanSectionBody(text: string): string {
  if (!text) return "";
  return text
    .replace(/^\*\*\s*/gm, "")
    .replace(/^\*\s*/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isMeaningfulContent(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  if (t === "**" || t === "--" || t === "N/A") return false;
  if (t.length < 2) return false;
  if (!/[a-zA-Z0-9]/.test(t)) return false;
  return true;
}

/**
 * SAFE sanitiser — only removes true noise
 */
function sanitiseReportText(text: string): string {
  if (!text) return "";
  const filtered = text.split("\n").filter((line) => {
    const lower = line.toLowerCase().trim();
    if (lower === "null" || lower === "undefined") return false;
    if (lower.startsWith("service history date anomaly")) return false;
    if (lower.startsWith("appears in the future")) return false;

    // Extra guards against over-aggressive service-history interpretation
    if (
      lower.includes("service history report") &&
      lower.includes("cannot be records of past completed services")
    ) {
      return false;
    }
    if (
      lower.includes("significant inconsistency") &&
      lower.includes("service")
    ) {
      return false;
    }
    if (
      lower.includes("crucial to clarify this discrepancy") &&
      lower.includes("service")
    ) {
      return false;
    }

    return true;
  });

  return filtered.join("\n").replace(/\n{3,}/g, "\n\n");
}

/* =========================================================
   Synthetic sections (when no headings come back)
========================================================= */

function pickSentencesByKeywords(
  sentences: string[],
  keywords: string[]
): string[] {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  return sentences.filter((s) =>
    lowerKeywords.some((k) => s.toLowerCase().includes(k))
  );
}

function buildSyntheticSections(cleaned: string): ReportSection[] {
  const overviewBody = cleanSectionBody(cleaned);
  if (!isMeaningfulContent(overviewBody)) return [];

  const sentences = overviewBody
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);

  if (!sentences.length) {
    return [{ title: "Overview", body: overviewBody }];
  }

  const sections: ReportSection[] = [];

  // Overview
  sections.push({
    title: "Overview",
    body: sentences.slice(0, 2).join(" "),
  });

  const remaining = sentences.slice(2);

  const riskSentences =
    pickSentencesByKeywords(remaining, [
      "risk",
      "concern",
      "issue",
      "warning",
      "red flag",
      "accident",
      "damage",
      "unknown",
      "import",
      "compliance",
      "repair",
      "history",
    ]) || [];

  if (riskSentences.length) {
    sections.push({
      title: "Key risk signals",
      body: riskSentences.join(" "),
    });
  }

  const buyerSentences =
    pickSentencesByKeywords(remaining, [
      "price",
      "value",
      "market",
      "budget",
      "buyer",
      "suitable",
      "consider",
      "offer",
      "deal",
    ]) || [];

  if (buyerSentences.length) {
    sections.push({
      title: "Buyer considerations",
      body: buyerSentences.join(" "),
    });
  }

  const ownershipSentences =
    pickSentencesByKeywords(remaining, [
      "ownership",
      "warranty",
      "servicing",
      "service",
      "maintenance",
      "running costs",
      "fuel",
      "economy",
      "long-term",
      "daily use",
    ]) || [];

  if (ownershipSentences.length) {
    sections.push({
      title: "General ownership notes",
      body: ownershipSentences.join(" "),
    });
  }

  if (sections.length === 0) {
    sections.push({ title: "Overview", body: overviewBody });
  }

  return sections;
}

/* =========================================================
   Section builder
========================================================= */

function buildSectionsFromFreeText(text: string): ReportSection[] {
  const cleaned = sanitiseReportText(text);
  if (!cleaned.trim()) return [];

  const lines = cleaned.split(/\r?\n/);
  const indexed: { idx: number; label: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const norm = normaliseHeading(lines[i]);
    if (!norm) continue;

    for (const marker of SECTION_MARKERS) {
      if (marker.aliases.some((a) => norm.includes(a))) {
        indexed.push({ idx: i, label: marker.label });
        break;
      }
    }
  }

  const sections: ReportSection[] = [];

  if (indexed.length) {
    // Intro as overview (if present)
    if (indexed[0].idx > 0) {
      const intro = cleanSectionBody(lines.slice(0, indexed[0].idx).join("\n"));
      if (isMeaningfulContent(intro)) {
        sections.push({ title: "Overview", body: intro });
      }
    }

    for (let i = 0; i < indexed.length; i++) {
      const startIdx = indexed[i].idx;
      const endIdx = i + 1 < indexed.length ? indexed[i + 1].idx : lines.length;

      let body = lines.slice(startIdx + 1, endIdx).join("\n");
      body = cleanSectionBody(body);
      if (!isMeaningfulContent(body)) continue;

      sections.push({
        title: indexed[i].label,
        body,
      });
    }
  }

  if (sections.length <= 1) {
    return buildSyntheticSections(cleaned);
  }

  return sections;
}

/* =========================================================
   Smart teaser generator
========================================================= */

function pickFirstMeaningfulLine(body: string): string | null {
  const lines = body
    .split(/\n+/)
    .map((l) => l.replace(/^•\s*/, "").replace(/^-\s*/, "").trim())
    .filter((l) => l.length > 40 && l.length < 260);

  return lines[0] ?? null;
}

function buildTeaserFromSections(sections: ReportSection[]): string[] {
  if (!sections.length) return [];

  const teaser: string[] = [];

  const meaning = sections.find((s) =>
    s.title.toLowerCase().includes("what this means")
  );
  if (meaning) {
    const line = pickFirstMeaningfulLine(meaning.body);
    if (line) teaser.push(line);
  }

  if (teaser.length < 2) {
    const conf = sections.find((s) =>
      s.title.toLowerCase().includes("confidence")
    );
    if (conf) {
      const line = pickFirstMeaningfulLine(conf.body);
      if (line) teaser.push(line);
    }
  }

  if (teaser.length < 2) {
    for (const s of sections) {
      const line = pickFirstMeaningfulLine(s.body);
      if (line && !teaser.includes(line)) teaser.push(line);
      if (teaser.length >= 2) break;
    }
  }

  if (teaser.length === 0) {
    const overview = sections.find((s) =>
      s.title.toLowerCase().includes("overview")
    );
    if (overview) {
      const sentences = overview.body
        .split(".")
        .map((s) => s.trim())
        .filter((s) => s.length > 30 && s.length < 220);

      teaser.push(...sentences.slice(0, 2));
    }
  }

  return teaser.slice(0, 2);
}

/* =========================================================
   Theming
========================================================= */

type SectionTheme = {
  icon: string;
  headerGradient: string;
  cardGradient: string;
};

function getSectionTheme(title: string): SectionTheme {
  const t = title.toLowerCase();

  if (t.includes("confidence"))
    return {
      icon: "🧭",
      headerGradient: "from-indigo-500 to-indigo-400",
      cardGradient: "from-indigo-950 to-slate-900",
    };

  if (t.includes("what this means"))
    return {
      icon: "✨",
      headerGradient: "from-violet-500 to-fuchsia-500",
      cardGradient: "from-violet-950 to-slate-900",
    };

  if (t.includes("risk"))
    return {
      icon: "⚠️",
      headerGradient: "from-amber-500 to-orange-500",
      cardGradient: "from-amber-950 to-slate-900",
    };

  if (t.includes("buyer"))
    return {
      icon: "🛠️",
      headerGradient: "from-blue-500 to-sky-500",
      cardGradient: "from-sky-950 to-slate-900",
    };

  if (t.includes("negotiation"))
    return {
      icon: "🤝",
      headerGradient: "from-teal-500 to-emerald-500",
      cardGradient: "from-teal-950 to-slate-900",
    };

  if (t.includes("ownership"))
    return {
      icon: "🚗",
      headerGradient: "from-emerald-500 to-lime-500",
      cardGradient: "from-emerald-950 to-slate-900",
    };

  if (t.includes("analysis"))
    return {
      icon: "📊",
      headerGradient: "from-violet-500 to-indigo-500",
      cardGradient: "from-violet-950 to-slate-900",
    };

  return {
    icon: "📌",
    headerGradient: "from-slate-500 to-slate-400",
    cardGradient: "from-slate-950 to-slate-900",
  };
}

function getSectionSubtitle(title: string): string {
  const t = title.toLowerCase();

  if (t.includes("overview")) {
    return "High-level summary of what this listing is offering.";
  }
  if (t.includes("confidence")) {
    return "How comfortable you should feel based on the information so far.";
  }
  if (t.includes("risk")) {
    return "Potential issues and red flags to check before you proceed.";
  }
  if (t.includes("buyer considerations")) {
    return "Practical pros and cons to weigh up as a buyer.";
  }
  if (t.includes("negotiation")) {
    return "Guidance to help you frame offers and counter-offers.";
  }
  if (t.includes("ownership")) {
    return "What day-to-day life with this car might look like.";
  }
  if (t.includes("what this means")) {
    return "Plain-English takeaway so you know where you stand.";
  }
  if (t.includes("analysis")) {
    return "How the different pieces of information fit together.";
  }

  return "Guidance based on the details we found in this listing.";
}

/* =========================================================
   Vehicle display enrichment
========================================================= */

const KNOWN_BRANDS = [
  "Toyota",
  "Kia",
  "Mazda",
  "Ford",
  "Hyundai",
  "Nissan",
  "Mitsubishi",
  "Subaru",
  "Honda",
  "Volkswagen",
  "Audi",
  "BMW",
  "Mercedes",
  "Holden",
  "Peugeot",
  "Renault",
  "Jeep",
  "Volvo",
  "Lexus",
  "Porsche",
  "Mini",
  "Skoda",
  "Cupra",
  "Chery",
  "LDV",
  "Great Wall",
  "GWM",
  "Haval",
  "BYD",
  "Tesla",
  "Polestar",
  "Fiat",
  "Alfa Romeo",
  "Citroen",
  "Jaguar",
  "Land Rover",
  "Range Rover",
  "Genesis",
  "SsangYong",
  "Suzuki",
  "Isuzu",
  "Ram",
  "Chevrolet",
  "Dodge",
  "Chrysler",
];

function enrichVehicleForDisplay(
  vehicle: VehicleInfo,
  summary: string | null
): VehicleInfo {
  if (!summary || !summary.trim()) return vehicle;

  const updated: VehicleInfo = { ...vehicle };

  const firstLine = summary.split(/\r?\n/)[0] || summary;
  const text = firstLine || summary;

  const brandRegex = new RegExp(`\\b(${KNOWN_BRANDS.join("|")})\\b`, "i");

  if (!updated.make) {
    const brandMatch = text.match(brandRegex);
    if (brandMatch) updated.make = brandMatch[1];
  }

  if (!updated.model && updated.make) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(updated.make.toLowerCase());
    if (idx !== -1) {
      const after = text.slice(idx + updated.make.length);
      const tokens = after.split(/[\s,.;:()]+/).filter(Boolean);
      if (tokens.length > 0) {
        const candidate = tokens[0];
        if (candidate && candidate.length <= 24) {
          updated.model = candidate;
        }
      }
    }
  }

  if (!updated.year) {
    const yMatch = text.match(/\b(19|20)\d{2}\b/);
    if (yMatch) updated.year = yMatch[0];
  }

  return updated;
}

/* =========================================================
   Risk & Confidence Heat-Map helpers
========================================================= */

function pushRisk(buckets: RiskBuckets, item: RiskItem): void {
  const target = buckets[item.severity];
  if (!target.some((r) => r.label === item.label)) {
    target.push(item);
  }
}

function buildRiskBuckets(rawReport: string): RiskBuckets {
  const buckets: RiskBuckets = {
    critical: [],
    moderate: [],
    info: [],
  };

  if (!rawReport.trim()) return buckets;

  const text = rawReport.toLowerCase();

  // --- Critical signals ---
  if (
    text.includes("unknown import") ||
    text.includes("import status unknown") ||
    text.includes("compliance unclear") ||
    text.includes("compliance status unknown")
  ) {
    pushRisk(buckets, {
      severity: "critical",
      label: "Unknown import / compliance status",
      description:
        "The listing hints at an import or compliance status that isn’t clearly explained.",
      action:
        "Ask the seller to confirm whether the vehicle is a local delivery or grey import, and provide registration / compliance paperwork.",
    });
  }

  if (
    text.includes("no service history") ||
    text.includes("service history not provided") ||
    text.includes("service history missing")
  ) {
    pushRisk(buckets, {
      severity: "critical",
      label: "Service history not disclosed",
      description:
        "There are signs the vehicle’s maintenance history may be incomplete or not clearly documented.",
      action:
        "Request photos of the logbook and recent invoices before proceeding, or factor uncertainty into your budget.",
    });
  }

  if (
    text.includes("odometer anomaly") ||
    text.includes("odometer concern") ||
    text.includes("odometer reading inconsistent") ||
    text.includes("odometer not disclosed")
  ) {
    pushRisk(buckets, {
      severity: "critical",
      label: "Odometer / kilometres concern",
      description:
        "The way kilometres are presented raises questions about accuracy or disclosure.",
      action:
        "Confirm the current odometer reading, check against service records and any available history reports.",
    });
  }

  if (
    text.includes("structural damage") ||
    text.includes("repairable write-off") ||
    text.includes("significant accident") ||
    text.includes("heavy accident history")
  ) {
    pushRisk(buckets, {
      severity: "critical",
      label: "Possible structural / accident history",
      description:
        "There are signs the vehicle may have had significant accident or structural repairs.",
      action:
        "Ask for written details of any accident history and consider an independent inspection before committing.",
    });
  }

  if (
    text.includes("limited detail from seller") ||
    text.includes("sparse description") ||
    text.includes("seller not transparent")
  ) {
    pushRisk(buckets, {
      severity: "critical",
      label: "Low transparency from seller",
      description:
        "Key details appear to be missing or downplayed in the listing.",
      action:
        "Prepare a short list of direct questions for the seller and be cautious if answers stay vague or change.",
    });
  }

  // --- Moderate signals ---
  if (
    text.includes("tyres likely due soon") ||
    text.includes("tyres approaching replacement") ||
    text.includes("brakes likely due") ||
    text.includes("brake pads low")
  ) {
    pushRisk(buckets, {
      severity: "moderate",
      label: "Tyres / brakes approaching cost",
      description:
        "Future spend on tyres or brakes is likely based on current wording.",
      action:
        "Ask when tyres and brakes were last replaced and factor a replacement set into your budget if needed.",
    });
  }

  if (
    text.includes("cosmetic damage") ||
    text.includes("cosmetic wear") ||
    text.includes("paint fade") ||
    text.includes("peeling clear coat") ||
    text.includes("repainted panel")
  ) {
    pushRisk(buckets, {
      severity: "moderate",
      label: "Cosmetic paint / panel work",
      description:
        "The listing suggests paintwork, cosmetic repairs or visible imperfections.",
      action:
        "Capture clear photos in good light and get a basic quote if you care about presentation or resale value.",
    });
  }

  if (
    text.includes("uncertain ownership") ||
    text.includes("ownership history unclear") ||
    text.includes("short ownership period")
  ) {
    pushRisk(buckets, {
      severity: "moderate",
      label: "Ownership history not fully clear",
      description:
        "There are questions about how long the car has been with the current owner or how many owners there have been.",
      action:
        "Ask how long they’ve owned the car and why they’re selling; check that details line up with paperwork.",
    });
  }

  if (
    text.includes("priced above market") ||
    text.includes("strong asking price")
  ) {
    pushRisk(buckets, {
      severity: "moderate",
      label: "Price positioned at upper end of market",
      description:
        "The asking price appears to sit towards the stronger / higher side for similar vehicles.",
      action:
        "Use any wear, missing history or upcoming costs as negotiation leverage if you decide the car is otherwise suitable.",
    });
  }

  // --- Neutral / info signals ---
  if (
    text.includes("typical wear for age") ||
    text.includes("normal wear") ||
    text.includes("expected wear for kilometres")
  ) {
    pushRisk(buckets, {
      severity: "info",
      label: "Wear consistent with age and use",
      description:
        "Any wear mentioned appears consistent with the vehicle’s age and kilometres.",
      action:
        "Focus inspection on confirming that wear is cosmetic only and not affecting safety or reliability.",
    });
  }

  if (
    text.includes("well documented service history") ||
    text.includes("complete service history") ||
    text.includes("full service history")
  ) {
    pushRisk(buckets, {
      severity: "info",
      label: "Service history described positively",
      description:
        "The listing suggests that maintenance has been kept up-to-date and reasonably well documented.",
      action:
        "Ask for photos of the logbook so you can confirm dates, kilometre readings and servicing locations.",
    });
  }

  if (
    text.includes("priced fairly") ||
    text.includes("good value") ||
    text.includes("competitive compared to similar listings")
  ) {
    pushRisk(buckets, {
      severity: "info",
      label: "Price appears broadly reasonable",
      description:
        "Based on the analysis, the asking price seems broadly in line with what the car is offering.",
      action:
        "Still compare a few similar listings so you’re comfortable the price feels right for you.",
    });
  }

  return buckets;
}

/* =========================================================
   UI components
========================================================= */

function ConfidenceGauge({ code }: { code?: string }) {
  let value = 0;
  if (code === "LOW") value = 0.33;
  if (code === "MODERATE") value = 0.66;
  if (code === "HIGH") value = 1;

  const pct = Math.round(value * 100);

  const gradient =
    value === 0
      ? "conic-gradient(#1e293b 0deg,#1e293b 360deg)"
      : `conic-gradient(#a855f7 ${pct * 3.6}deg,#1e293b ${
          pct * 3.6
        }deg 360deg)`;

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-full border border-white/10 shadow-inner flex items-center justify-center"
        style={{ backgroundImage: gradient }}
      >
        <div className="w-7 h-7 rounded-full bg-slate-950/90 flex items-center justify-center text-[10px] font-semibold text-slate-100">
          {code ?? "N/A"}
        </div>
      </div>

      <div className="text-xs text-slate-200">
        <div className="font-semibold">Confidence</div>
        <div className="text-slate-300">
          {code === "LOW" &&
            "Proceed carefully — there are important details to understand."}
          {code === "MODERATE" &&
            "Mixed picture — mostly positive but worth weighing up."}
          {code === "HIGH" &&
            "Comfortable so far overall, based on what we can see."}
          {!code && "Not available"}
        </div>
      </div>
    </div>
  );
}

function CompactSection({ section }: { section: ReportSection }) {
  const theme = getSectionTheme(section.title);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 flex gap-2 items-start">
      <span>{theme.icon}</span>
      <div>
        <div className="font-semibold">{section.title}</div>
        <div className="text-slate-300 whitespace-pre-wrap">
          {section.body}
        </div>
      </div>
    </div>
  );
}

function FullReportSection({
  section,
  index,
}: {
  section: ReportSection;
  index: number;
}) {
  const theme = getSectionTheme(section.title);
  const delayMs = 80 * index;

  if (section.body.length < 120) {
    return <CompactSection section={section} />;
  }

  return (
    <div
      className={`rounded-2xl border border-white/12 shadow-[0_18px_40px_rgba(0,0,0,0.55)] bg-gradient-to-b ${theme.cardGradient} opacity-0 translate-y-2 animate-[fadeUp_0.45s_ease-out_forwards] overflow-hidden`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div
        className={`px-5 py-3 border-b border-white/15 bg-gradient-to-r ${theme.headerGradient} flex items-center justify-between`}
      >
        <div className="flex flex-col gap-0.5 text-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-base">{theme.icon}</span>
            <h3 className="text-sm font-semibold tracking-wide uppercase">
              {section.title}
            </h3>
          </div>
          <p className="text-[11px] text-slate-100/80">
            {getSectionSubtitle(section.title)}
          </p>
        </div>

        <span className="text-[10px] uppercase tracking-wide text-slate-100/80">
          Section {index + 1}
        </span>
      </div>

      <div className="px-5 py-4">
        <div className="rounded-xl bg-slate-950/60 border border-white/8 px-4 py-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
          {section.body}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Risk Heat-Map UI
========================================================= */

function RiskHeatMap({
  buckets,
  showUnlocked,
}: {
  buckets: RiskBuckets;
  showUnlocked: boolean;
}) {
  const hasAny =
    buckets.critical.length ||
    buckets.moderate.length ||
    buckets.info.length;

  if (!hasAny) return null;

  const previewBuckets: RiskBuckets = showUnlocked
    ? buckets
    : {
        critical: buckets.critical.slice(0, 1),
        moderate: buckets.moderate.slice(0, 2),
        info: buckets.info.slice(0, 2),
      };

  const truncated =
    !showUnlocked &&
    (buckets.critical.length > previewBuckets.critical.length ||
      buckets.moderate.length > previewBuckets.moderate.length ||
      buckets.info.length > previewBuckets.info.length);

  function renderList(
    items: RiskItem[],
    accentClasses: string,
    badge: string
  ) {
    if (!items.length) return null;

    return (
      <div
        className={`rounded-2xl border border-white/10 bg-gradient-to-b ${accentClasses} px-4 py-3 space-y-2`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-slate-100/80">
            {badge}
          </span>
        </div>

        <ul className="space-y-2 text-sm text-slate-50">
          {items.map((item, idx) => (
            <li
              key={`${item.label}-${idx}`}
              className="rounded-xl bg-black/15 border border-white/10 px-3 py-2"
            >
              <div className="font-semibold">{item.label}</div>
              <div className="text-xs text-slate-100/90 mt-0.5">
                {item.description}
              </div>
              <div className="text-[11px] text-slate-200 mt-1">
                <span className="font-semibold">What to do:</span>{" "}
                {item.action}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-white/12 bg-slate-950/80 shadow-[0_22px_60px_rgba(0,0,0,0.7)] px-5 py-5 space-y-3">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-slate-50 flex items-center gap-2">
            <span>🧊</span>
            <span>Risk &amp; confidence heat-map</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            A quick view of where this car sits on risk, upcoming costs, and
            general comfort level — based on the wording in this listing.
          </p>
        </div>

        {!showUnlocked && (
          <span className="text-[11px] rounded-full border border-white/20 px-2 py-0.5 text-slate-200">
            Preview — full detail unlocks with a paid scan
          </span>
        )}
      </header>

      <div className="grid md:grid-cols-3 gap-3 mt-2">
        {renderList(
          previewBuckets.critical,
          "from-red-900/90 via-red-900/70 to-slate-950",
          "Critical — high priority to understand"
        )}
        {renderList(
          previewBuckets.moderate,
          "from-amber-900/90 via-amber-900/70 to-slate-950",
          "Moderate — worth investigating / negotiating"
        )}
        {renderList(
          previewBuckets.info,
          "from-sky-900/90 via-sky-900/70 to-slate-950",
          "Observations — context & general guidance"
        )}
      </div>

      {truncated && (
        <p className="text-[11px] text-slate-400 mt-2">
          The full CarVerity report includes additional risk and confidence
          points tailored to this listing.
        </p>
      )}
    </section>
  );
}

/* =========================================================
   Main component
========================================================= */

export default function OnlineResults() {
  const navigate = useNavigate();

  const [result, setResult] = useState<SavedResult | null>(null);
  const [showFloatingBar, setShowFloatingBar] = useState(false);

  // journey flags
  const hasInPersonScan =
    localStorage.getItem("carverity_inperson_completed") === "1";
  const hasOnlineScan = true;
  const dualJourneyComplete = hasInPersonScan && hasOnlineScan;

  useEffect(() => {
    function handleScroll() {
      setShowFloatingBar(window.scrollY > 520);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (stored) {
      setResult(stored);
      localStorage.setItem("carverity_online_completed", "1");
    }
  }, []);

  function unlockForTesting() {
    if (!result) return;

    const updated: SavedResult = {
      ...result,
      type: "online",
      isUnlocked: true,
    };

    saveOnlineResults(updated);
    localStorage.setItem(UNLOCK_KEY, "1");
    setResult(updated);
  }

  useEffect(() => {
    if (!result) return;
    if (!result.isUnlocked) {
      localStorage.removeItem(UNLOCK_KEY);
    }
  }, [result]);

  function goStartNewScan() {
    localStorage.removeItem(UNLOCK_KEY);
    navigate("/start-scan");
  }

  function goMyScans() {
    navigate("/my-scans");
  }

  function goInPersonFlow() {
    navigate("/scan/in-person/start");
  }

  function goAssistFlow() {
    navigate("/scan/online/assist");
  }

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-semibold mb-2">No scan data found</h1>
        <p className="text-slate-400 mb-6">
          It looks like there&apos;s no saved CarVerity online scan on this
          device yet.
        </p>

        <button
          onClick={goStartNewScan}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow"
        >
          Start a new scan
        </button>
      </div>
    );
  }

  const {
    vehicle: storedVehicle = {},
    confidenceCode,
    fullSummary,
    summary,
    isUnlocked,
    createdAt,
    step,
  } = result;

  const isAssistMode = step === "assist-required";

  /* =====================================================
     Assist-required state
  ====================================================== */

  if (isAssistMode) {
    const createdLabel = createdAt
      ? new Date(createdAt).toLocaleString()
      : "Just now";

    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center gap-2 text-[11px] md:text-xs text-slate-400 px-1">
          <span className="opacity-80">Online scan</span>
          <span className="opacity-40">›</span>
          <span className="font-semibold text-slate-200">
            Extra details needed
          </span>
        </div>

        <section className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs md:text-sm text-amber-100 shadow-[0_12px_30px_rgba(0,0,0,0.55)]">
          <div className="font-semibold mb-1">
            We couldn&apos;t read this listing automatically
          </div>
          <p className="text-amber-100/90">
            Some websites block automated tools from reading the page. We can
            still help — we just need a couple of key details from you to finish
            the CarVerity report.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base md:text-lg font-semibold text-white">
                Continue your CarVerity scan
              </h1>
              <p className="text-xs md:text-sm text-slate-300 mt-1">
                We&apos;ll guide you through a short assist screen to capture
                the make, model, year and kilometres from the listing.
              </p>
            </div>

            <span className="hidden md:inline-block text-[11px] text-slate-400">
              Saved {createdLabel}
            </span>
          </div>

          <button
            onClick={goAssistFlow}
            className="mt-4 w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-4 py-2.5 shadow flex items-center justify-center gap-2"
          >
            <span>Continue — add vehicle details</span>
          </button>

          <button
            onClick={goStartNewScan}
            className="mt-2 w-full rounded-xl border border-white/20 text-slate-200 px-4 py-2 text-sm"
          >
            Start a new online scan instead
          </button>
        </section>
      </div>
    );
  }

  /* =====================================================
     Normal full-report / preview state
  ====================================================== */

  const rawReport = fullSummary || summary || "";
  const baseVehicle = normaliseVehicle(storedVehicle as VehicleInfo);
  const displayVehicle = enrichVehicleForDisplay(baseVehicle, rawReport);

  const sections = buildSectionsFromFreeText(rawReport);
  const teaserSnippets = buildTeaserFromSections(sections);

  const storedUnlock = localStorage.getItem(UNLOCK_KEY) === "1";
  const showUnlocked = Boolean(isUnlocked) || storedUnlock;

  const createdLabel = createdAt
    ? new Date(createdAt).toLocaleString()
    : "Saved locally";

  const riskBuckets = buildRiskBuckets(rawReport);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 توسعه space-y-8">
      {/* Sticky vehicle bar */}
      <div className="sticky top-0 -mx-4 px-4 py-2 bg-slate-950/80 backdrop-blur border-b border-white/5 z-30">
        <div className="flex items-center justify-between text-xs md:text-sm text-slate-300">
          <span className="truncate">
            {displayVehicle.year || "—"} {displayVehicle.make || "Vehicle"}{" "}
            {displayVehicle.model || ""}
          </span>
          <span>
            {displayVehicle.kilometres
              ? `${displayVehicle.kilometres} km`
              : "— km"}
          </span>
        </div>
      </div>

      {/* Journey breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] md:text-xs text-slate-400 px-1 animate-[fadeUp_0.35s_ease-out]">
        <span className="opacity-80">Online scan</span>
        <span className="opacity-40">›</span>
        <span className="font-semibold text-slate-200">
          Results &amp; guidance
        </span>
      </div>

      {/* Dual-journey badge */}
      {dualJourneyComplete && (
        <section className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 px-5 py-4 shadow">
          <h3 className="text-sm font-semibold text-emerald-200">
            ✅ Dual-scan complete — strongest confidence
          </h3>
          <p className="text-xs text-emerald-200/90 mt-1">
            You’ve completed both the online listing analysis and the in-person
            inspection. That gives you the most balanced view of this car.
          </p>
        </section>
      )}

      {/* Scan overview strip */}
      <section className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.55)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs md:text-sm text-slate-200">
          <div className="flex items-center gap-2">
            <span>📡</span>
            <span className="font-semibold">Online listing scan</span>
            <span className="opacity-60">•</span>
            <span>{showUnlocked ? "Full report" : "Preview mode"}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/20 bg-slate-800/70 px-2 py-0.5 text-[10px] tracking-wide text-slate-200">
              STEP 2 — Results &amp; guidance
            </span>
            <span className="opacity-80">{createdLabel}</span>
          </div>
        </div>
      </section>

      {/* Premium header */}
      <section className="rounded-2xl bg-gradient-to-r from-violet-700/85 to-indigo-600/85 border border-white/12 shadow-[0_24px_60px_rgba(0,0,0,0.7)] px-6 py-5 md:py-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-white mb-1">
              CarVerity online scan results
            </h1>
            <p className="text-xs md:text-sm text-slate-100/90">
              Independent guidance based on the details in this listing.
            </p>
          </div>

          <ConfidenceGauge code={confidenceCode} />
        </div>
      </section>

      {/* Risk & Confidence Heat-Map */}
      <RiskHeatMap buckets={riskBuckets} showUnlocked={showUnlocked} />

      {/* PREVIEW MODE */}
      {!showUnlocked && (
        <section className="rounded-2xl border border-white/10 bg-slate-900/80 shadow-[0_18px_40px_rgba(0,0,0,0.55)] px-5 py-5 space-y-3">
          <h2 className="text-sm md:text-base font-semibold text-slate-100 flex items-center gap-2">
            👁️ CARVERITY ANALYSIS — PREVIEW
          </h2>

          {teaserSnippets.length > 0 ? (
            <>
              <p className="text-sm text-slate-300">
                Based on the listing details so far, here are early insights our
                analysis has surfaced for this car. Unlock the full CarVerity
                report to reveal deeper checks, negotiation angles, and
                ownership considerations tailored specifically to this listing.
              </p>

              <ul className="mt-1 text-sm text-slate-200 space-y-2 list-disc list-inside">
                {teaserSnippets.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>

              <div className="mt-1 rounded-xl border border-white/12 bg-slate-800/60 px-4 py-2 text-sm text-slate-400">
                Remaining guidance and full context locked — upgrade to
                continue.
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-300">
                This preview highlights a small portion of the analysis for this
                car. Unlock the full CarVerity report to see deeper risk
                markers, in-person inspection priorities, negotiation insights,
                and ownership guidance — tailored specifically to this vehicle.
              </p>

              <div className="mt-1 rounded-xl border border-white/12 bg-slate-800/60 px-4 py-3 text-sm text-slate-400">
                Full report content locked — upgrade to continue.
              </div>
            </>
          )}

          <button
            onClick={unlockForTesting}
            className="mt-3 inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow"
          >
            Unlock full report (testing)
          </button>

          <p className="text-[11px] text-slate-500">
            In the live app, this unlocks after purchasing a scan.
          </p>
        </section>
      )}

      {/* FULL REPORT */}
      {showUnlocked && (
        <section className="rounded-2xl border border-white/12 bg-slate-950/85 shadow-[0_28px_70px_rgba(0,0,0,0.75)] px-5 py-5 space-y-5">
          <header className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-slate-100">
              <span className="text-base">✨</span>
              <h2 className="text-sm md:text-base font-semibold tracking-wide uppercase">
                Full CarVerity report
              </h2>
            </div>

            <span className="text-[11px] text-emerald-300/90 border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              Unlocked for testing
            </span>
          </header>

          <div className="space-y-5">
            {sections.map((section, idx) => (
              <FullReportSection key={idx} section={section} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Optional encouragement — ONLY when in-person scan not done */}
      {!hasInPersonScan && (
        <section className="rounded-2xl border border-blue-400/30 bg-blue-500/10 px-5 py-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-100">
            🧭 Optional next step — in-person inspection
          </h3>
          <p className="text-xs md:text-sm text-slate-300">
            If this car still looks promising, you can continue with a guided
            in-person inspection to capture photos and check condition clues.
            This step is optional, but many buyers complete both stages to feel
            more confident before deciding.
          </p>
          <button
            onClick={goInPersonFlow}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-4 py-2 shadow"
          >
            Continue — in-person inspection checklist
          </button>
        </section>
      )}

      {/* VEHICLE DETAILS */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-5">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
          🚗 VEHICLE DETAILS
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 mt-3 text-sm">
          <div>
            <div className="text-slate-400 text-xs">Make</div>
            <div className="font-medium text-slate-100">
              {displayVehicle.make || "—"}
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-xs">Model</div>
            <div className="font-medium text-slate-100">
              {displayVehicle.model || "—"}
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-xs">Year</div>
            <div className="font-medium text-slate-100">
              {displayVehicle.year || "—"}
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-xs">Kilometres</div>
            <div className="font-medium text-slate-100">
              {displayVehicle.kilometres || "—"}
            </div>
          </div>
        </div>
      </section>

      {/* DESKTOP ACTIONS */}
      <section className="hidden md:block rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-5 space-y-3">
        {!hasInPersonScan && (
          <button
            onClick={goInPersonFlow}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-4 py-2 shadow flex items-center justify-between"
          >
            <span>Continue — in-person inspection checklist</span>
            <span className="text-[11px] font-medium opacity-80">
              Optional step
            </span>
          </button>
        )}

        <button
          onClick={goStartNewScan}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 shadow"
        >
          Start another online scan
        </button>

        <button
          onClick={goMyScans}
          className="w-full rounded-xl border border-white/20 text-slate-200 px-4 py-2"
        >
          View my scans
        </button>
      </section>

      {/* MOBILE FLOATING CTA */}
      {showFloatingBar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
          <div className="mx-3 mb-3 rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur shadow-[0_20px_60px_rgba(0,0,0,0.7)] px-4 py-3 space-y-2">
            {!hasInPersonScan && (
              <button
                onClick={goInPersonFlow}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-3 py-2 text-sm"
              >
                Continue — in-person inspection
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={goStartNewScan}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 text-sm shadow"
              >
                New scan
              </button>

              <button
                onClick={goMyScans}
                className="flex-1 rounded-xl border border-white/25 text-slate-200 px-3 py-2 text-sm"
              >
                My scans
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
