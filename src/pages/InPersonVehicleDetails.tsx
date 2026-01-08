// src/pages/InPersonVehicleDetails.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

/* =========================================================
   Smart suggestion data (large, offline, no API required)
   - Make list is intentionally broad (global + AU common)
   - Model list is “good enough” + learns from what users type
========================================================= */

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

const MAKE_SUGGESTIONS: string[] = [
  "Abarth",
  "Acura",
  "Aion",
  "Alfa Romeo",
  "Alpina",
  "Aston Martin",
  "Audi",
  "Austin",
  "BAIC",
  "Bentley",
  "Bestune",
  "BMW",
  "Borgward",
  "Brilliance",
  "Bugatti",
  "Buick",
  "BYD",
  "Cadillac",
  "Changan",
  "Chery",
  "Chevrolet",
  "Chrysler",
  "Citroën",
  "Cupra",
  "Dacia",
  "Daewoo",
  "Daihatsu",
  "Datsun",
  "Denza",
  "Dodge",
  "Dongfeng",
  "DS Automobiles",
  "Ferrari",
  "Fiat",
  "Ford",
  "Foton",
  "GAC",
  "Geely",
  "Genesis",
  "GMC",
  "Great Wall",
  "Haval",
  "Holden",
  "Honda",
  "Hummer",
  "Hyundai",
  "Infiniti",
  "Isuzu",
  "Iveco",
  "Jaguar",
  "Jeep",
  "JMC",
  "Kia",
  "Koenigsegg",
  "Lada",
  "Lamborghini",
  "Lancia",
  "Land Rover",
  "Leapmotor",
  "LDV",
  "Lexus",
  "Lincoln",
  "Lotus",
  "Lucid",
  "Mahindra",
  "Maserati",
  "Maybach",
  "Mazda",
  "McLaren",
  "Mercedes-Benz",
  "Mercury",
  "MG",
  "Mini",
  "Mitsubishi",
  "Morgan",
  "Neta",
  "NIO",
  "Nissan",
  "Opel",
  "Peugeot",
  "Polestar",
  "Pontiac",
  "Porsche",
  "Proton",
  "RAM",
  "Renault",
  "Rivian",
  "Rolls-Royce",
  "Rover",
  "Saab",
  "Saturn",
  "Scion",
  "SEAT",
  "Škoda",
  "Smart",
  "SsangYong",
  "Subaru",
  "Suzuki",
  "Tesla",
  "Toyota",
  "Vauxhall",
  "Volkswagen",
  "Volvo",
  "Wey",
  "XPeng",
  "Zeekr",
  "Zotye",
];

// A “starter” model map for perceived intelligence.
// Not exhaustive by design; we also learn from user inputs per make.
const MODEL_SUGGESTIONS_BY_MAKE: Record<string, string[]> = {
  Toyota: [
    "Corolla",
    "Camry",
    "RAV4",
    "Kluger",
    "Hilux",
    "LandCruiser",
    "LandCruiser Prado",
    "Yaris",
    "C-HR",
    "86",
    "Supra",
    "HiAce",
  ],
  Mazda: ["Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-30", "CX-5", "CX-8", "CX-9", "BT-50", "MX-5"],
  Hyundai: ["i20", "i30", "Elantra", "Sonata", "Kona", "Tucson", "Santa Fe", "Palisade", "Staria", "Ioniq", "Ioniq 5", "Ioniq 6"],
  Kia: ["Rio", "Cerato", "Stinger", "Seltos", "Sportage", "Sorento", "Carnival", "Picanto", "EV6", "EV9"],
  Ford: ["Fiesta", "Focus", "Mondeo", "Mustang", "Everest", "Ranger", "Puma", "Escape", "Territory"],
  Nissan: ["Micra", "Pulsar", "X-Trail", "Qashqai", "Navara", "Patrol", "Leaf", "Juke"],
  Subaru: ["Impreza", "WRX", "Levorg", "Forester", "Outback", "Crosstrek", "BRZ", "Liberty"],
  Mitsubishi: ["Mirage", "Lancer", "ASX", "Outlander", "Eclipse Cross", "Pajero Sport", "Triton"],
  Volkswagen: ["Golf", "Passat", "Tiguan", "Touareg", "Polo", "T-Roc", "Amarok", "Arteon"],
  BMW: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "X1", "X3", "X5", "X7", "M3", "M4"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "G-Class"],
  Audi: ["A1", "A3", "A4", "A6", "Q2", "Q3", "Q5", "Q7", "S3", "RS3"],
  Honda: ["Jazz", "Civic", "Accord", "HR-V", "CR-V", "Odyssey", "NSX"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X"],
  Isuzu: ["D-MAX", "MU-X"],
  LDV: ["T60", "G10", "Deliver 9"],
  "Land Rover": ["Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", "Range Rover Evoque", "Defender"],
};

const RECENT_MODELS_KEY = "carverity_recent_models_by_make_v1";

/* =========================================================
   Helpers
========================================================= */

function clampYear(value: number) {
  if (value < MIN_YEAR) return MIN_YEAR;
  if (value > CURRENT_YEAR + 1) return CURRENT_YEAR + 1;
  return value;
}

function clampKm(value: number) {
  if (value < 0) return 0;
  if (value > 999999) return 999999;
  return value;
}

function normaliseSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function ciStartsWith(haystack: string, needle: string) {
  return haystack.toLowerCase().startsWith(needle.toLowerCase());
}

function ciIncludes(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

type RecentModelsMap = Record<string, string[]>;

function loadRecentModels(): RecentModelsMap {
  if (typeof window === "undefined") return {};
  const parsed = safeParseJson<RecentModelsMap>(
    window.localStorage.getItem(RECENT_MODELS_KEY)
  );
  return parsed && typeof parsed === "object" ? parsed : {};
}

function saveRecentModel(make: string, model: string) {
  if (typeof window === "undefined") return;
  const m = normaliseSpaces(make);
  const mo = normaliseSpaces(model);
  if (m.length < 2 || mo.length < 1) return;

  const current = loadRecentModels();
  const list = current[m] ?? [];
  const next = [mo, ...list.filter((x) => x.toLowerCase() !== mo.toLowerCase())].slice(0, 25);

  const updated: RecentModelsMap = { ...current, [m]: next };
  try {
    window.localStorage.setItem(RECENT_MODELS_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage issues
  }
}

function buildYearOptions() {
  const years: string[] = [];
  for (let y = CURRENT_YEAR + 1; y >= MIN_YEAR; y--) years.push(String(y));
  return years;
}

const YEAR_OPTIONS = buildYearOptions();

type KmRange = { label: string; min: number; max: number };

const KM_RANGES: KmRange[] = [
  { label: "Under 10,000 km", min: 0, max: 10000 },
  { label: "10,000 – 25,000 km", min: 10000, max: 25000 },
  { label: "25,000 – 50,000 km", min: 25000, max: 50000 },
  { label: "50,000 – 75,000 km", min: 50000, max: 75000 },
  { label: "75,000 – 100,000 km", min: 75000, max: 100000 },
  { label: "100,000 – 150,000 km", min: 100000, max: 150000 },
  { label: "150,000 – 200,000 km", min: 150000, max: 200000 },
  { label: "200,000 – 300,000 km", min: 200000, max: 300000 },
  { label: "300,000 – 500,000 km", min: 300000, max: 500000 },
  { label: "Over 500,000 km", min: 500000, max: 999999 },
];

function medianOfRange(r: KmRange) {
  // Use a realistic “center” point so the number looks intentional.
  if (r.max >= 999999) return 550000;
  return Math.round((r.min + r.max) / 2);
}

/* =========================================================
   Component
========================================================= */

export default function InPersonVehicleDetails() {
  const navigate = useNavigate();
  const existing = loadProgress();

  const [scanId] = useState<string>(() => {
    if (existing?.scanId) return existing.scanId;
    const id = generateScanId();
    saveProgress({ scanId: id, type: "in-person" });
    return id;
  });

  /* =========================================================
     Controlled state
  ========================================================== */

  const [yearText, setYearText] = useState<string>(
    String((existing as any)?.vehicleYear ?? "")
  );

  const [makeText, setMakeText] = useState<string>(
    String((existing as any)?.vehicleMake ?? "")
  );

  const [modelText, setModelText] = useState<string>(
    String((existing as any)?.vehicleModel ?? "")
  );

  const [kilometres, setKilometres] = useState<number>(
    clampKm(Number((existing as any)?.kilometres ?? 0))
  );

  // Dropdown visibility & focus control
  const [showYearList, setShowYearList] = useState(false);
  const [showMakeList, setShowMakeList] = useState(false);
  const [showModelList, setShowModelList] = useState(false);

  const yearCloseTimer = useRef<number | null>(null);
  const makeCloseTimer = useRef<number | null>(null);
  const modelCloseTimer = useRef<number | null>(null);

  function scheduleClose(kind: "year" | "make" | "model") {
    const setTimer = (ref: React.MutableRefObject<number | null>, fn: () => void) => {
      if (ref.current) window.clearTimeout(ref.current);
      ref.current = window.setTimeout(fn, 120);
    };

    if (kind === "year") setTimer(yearCloseTimer, () => setShowYearList(false));
    if (kind === "make") setTimer(makeCloseTimer, () => setShowMakeList(false));
    if (kind === "model") setTimer(modelCloseTimer, () => setShowModelList(false));
  }

  function cancelClose(kind: "year" | "make" | "model") {
    const ref =
      kind === "year" ? yearCloseTimer : kind === "make" ? makeCloseTimer : modelCloseTimer;
    if (ref.current) window.clearTimeout(ref.current);
    ref.current = null;
  }

  /* =========================================================
     Derived values
  ========================================================== */

  const parsedYear = useMemo(() => {
    const clean = yearText.replace(/\D/g, "");
    if (clean.length !== 4) return null;
    const n = parseInt(clean, 10);
    if (Number.isNaN(n)) return null;
    return clampYear(n);
  }, [yearText]);

  const filteredYears = useMemo(() => {
    const q = yearText.replace(/\D/g, "").slice(0, 4);
    if (!q) return YEAR_OPTIONS.slice(0, 12);
    return YEAR_OPTIONS.filter((y) => y.startsWith(q)).slice(0, 12);
  }, [yearText]);

  const filteredMakes = useMemo(() => {
    const q = normaliseSpaces(makeText);
    if (!q) return MAKE_SUGGESTIONS.slice(0, 18);

    // Prefer prefix matches, then contains matches.
    const prefix = MAKE_SUGGESTIONS.filter((m) => ciStartsWith(m, q));
    const contains = MAKE_SUGGESTIONS.filter((m) => !ciStartsWith(m, q) && ciIncludes(m, q));
    return [...prefix, ...contains].slice(0, 18);
  }, [makeText]);

  const modelSuggestions = useMemo(() => {
    const make = normaliseSpaces(makeText);
    const typed = normaliseSpaces(modelText);

    const recentMap = loadRecentModels();
    const recent = recentMap[make] ?? [];

    const base = MODEL_SUGGESTIONS_BY_MAKE[make] ?? [];
    const combined = Array.from(
      new Set([...recent, ...base]) // keep order: recent first
    );

    if (!typed) return combined.slice(0, 18);

    const prefix = combined.filter((m) => ciStartsWith(m, typed));
    const contains = combined.filter((m) => !ciStartsWith(m, typed) && ciIncludes(m, typed));
    return [...prefix, ...contains].slice(0, 18);
  }, [makeText, modelText]);

  const kmSuggestions = useMemo(() => {
    // Show all if empty; otherwise show ranges near value.
    if (!kilometres) return KM_RANGES;
    return KM_RANGES.filter(
      (r) => kilometres >= r.min - 30000 && kilometres <= r.max + 30000
    );
  }, [kilometres]);

  const isComplete =
    Boolean(parsedYear) &&
    normaliseSpaces(makeText).length > 1 &&
    normaliseSpaces(modelText).length > 0;

  /* =========================================================
     Persist progress (defensive)
  ========================================================== */

  useEffect(() => {
    saveProgress({
      type: "in-person",
      scanId,
      step: "/scan/in-person/vehicle-details",
      vehicleYear: parsedYear ?? undefined,
      vehicleMake: normaliseSpaces(makeText),
      vehicleModel: normaliseSpaces(modelText),
      kilometres: clampKm(kilometres),
    });
  }, [scanId, parsedYear, makeText, modelText, kilometres]);

  /* =========================================================
     Continue
  ========================================================== */

  function continueToPhotos() {
    if (!isComplete) return;

    const cleanMake = normaliseSpaces(makeText);
    const cleanModel = normaliseSpaces(modelText);

    // Learn from what the user typed so future lists feel “smart”.
    saveRecentModel(cleanMake, cleanModel);

    // Ensure the next step is explicit in progress.
    saveProgress({ step: "/scan/in-person/photos" });

    navigate("/scan/in-person/photos");
  }

  /* =========================================================
     UI parts
  ========================================================== */

  function FieldShell({
    label,
    hint,
    children,
  }: {
    label: string;
    hint?: string;
    children: React.ReactNode;
  }) {
    return (
      <section className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <label className="text-sm font-semibold text-slate-200">{label}</label>
          {hint ? <span className="text-[11px] text-slate-500">{hint}</span> : null}
        </div>
        {children}
      </section>
    );
  }

  function Dropdown({
    items,
    onPick,
    onPointerDown,
    emptyText,
  }: {
    items: string[];
    onPick: (value: string) => void;
    onPointerDown: () => void;
    emptyText?: string;
  }) {
    return (
      <div
        className="mt-2 rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur divide-y divide-white/10 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        onPointerDown={onPointerDown}
      >
        {items.length > 0 ? (
          items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onPick(item)}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-900/60 active:bg-slate-900/80"
            >
              {item}
            </button>
          ))
        ) : (
          <div className="px-4 py-3 text-sm text-slate-400">
            {emptyText ?? "No matches — keep typing."}
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     Render
  ========================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Vehicle details
      </span>

      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          Vehicle details
        </h1>
        <p className="text-sm text-slate-300">
          These details help you compare multiple cars later in <span className="text-slate-200 font-semibold">My Scans</span>.
        </p>
      </div>

      {/* YEAR */}
      <FieldShell label="Year" hint="Type or pick from list">
        <div className="relative">
          <input
            inputMode="numeric"
            autoComplete="off"
            placeholder="Start typing (e.g. 2018)"
            value={yearText}
            onChange={(e) => setYearText(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onFocus={() => {
              cancelClose("year");
              setShowYearList(true);
            }}
            onBlur={() => scheduleClose("year")}
            className="w-full rounded-2xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400/40"
          />

          {showYearList && (
            <Dropdown
              items={filteredYears}
              onPointerDown={() => cancelClose("year")}
              onPick={(y) => {
                setYearText(y);
                setShowYearList(false);
              }}
              emptyText="No matching years — try a different number."
            />
          )}
        </div>

        <p className="text-[11px] text-slate-500">
          If you’re unsure, approximate is fine — this is for context.
        </p>
      </FieldShell>

      {/* MAKE */}
      <FieldShell label="Make" hint="Smart autocomplete">
        <div className="relative">
          <input
            autoComplete="off"
            placeholder="Start typing (e.g. Mazda)"
            value={makeText}
            onChange={(e) => {
              setMakeText(e.target.value);
              // When make changes, keep model but suggestions will shift.
              // Do not clear model automatically (prevents frustration).
            }}
            onFocus={() => {
              cancelClose("make");
              setShowMakeList(true);
            }}
            onBlur={() => scheduleClose("make")}
            className="w-full rounded-2xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400/40"
          />

          {showMakeList && (
            <Dropdown
              items={filteredMakes}
              onPointerDown={() => cancelClose("make")}
              onPick={(m) => {
                setMakeText(m);
                setShowMakeList(false);
              }}
              emptyText="No matches — keep typing (you can still enter any make)."
            />
          )}
        </div>

        <p className="text-[11px] text-slate-500">
          Start typing — the list narrows instantly. If it’s not listed, you can still enter it.
        </p>
      </FieldShell>

      {/* MODEL */}
      <FieldShell label="Model" hint="Smart autocomplete">
        <div className="relative">
          <input
            autoComplete="off"
            placeholder="Start typing (e.g. CX-5 Touring)"
            value={modelText}
            onChange={(e) => setModelText(e.target.value)}
            onFocus={() => {
              cancelClose("model");
              setShowModelList(true);
            }}
            onBlur={() => scheduleClose("model")}
            className="w-full rounded-2xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400/40"
          />

          {showModelList && (
            <Dropdown
              items={modelSuggestions}
              onPointerDown={() => cancelClose("model")}
              onPick={(m) => {
                setModelText(m);
                setShowModelList(false);
              }}
              emptyText="No matches yet — keep typing (you can enter any model)."
            />
          )}
        </div>

        <p className="text-[11px] text-slate-500">
          Suggestions are based on common models and what you’ve entered previously on this device.
        </p>
      </FieldShell>

      {/* KILOMETRES */}
      <FieldShell label="Kilometres" hint="Exact or tap a range">
        <div className="space-y-3">
          <input
            inputMode="numeric"
            autoComplete="off"
            placeholder="Enter exact km (e.g. 84500)"
            value={kilometres ? String(kilometres) : ""}
            onChange={(e) => {
              const clean = e.target.value.replace(/\D/g, "");
              setKilometres(clampKm(clean ? Number(clean) : 0));
            }}
            className="w-full rounded-2xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400/40"
          />

          <div className="rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden divide-y divide-white/10">
            {kmSuggestions.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setKilometres(clampKm(medianOfRange(r)))}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-900/60 active:bg-slate-900/80"
              >
                {r.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-500">
            Kilometres help frame wear and value — high km doesn’t automatically mean problems.
          </p>
        </div>
      </FieldShell>

      {/* CTA */}
      <button
        onClick={continueToPhotos}
        disabled={!isComplete}
        className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-4 py-3 shadow"
      >
        Continue to photo inspection
      </button>

      {!isComplete && (
        <p className="text-[11px] text-slate-500 text-center">
          Enter Year, Make, and Model to continue.
        </p>
      )}
    </div>
  );
}
