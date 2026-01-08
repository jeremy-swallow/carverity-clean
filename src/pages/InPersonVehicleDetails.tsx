import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

/* =========================================================
   AU-first smart suggestion data
========================================================= */

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

const MAKE_SUGGESTIONS: string[] = [
  "Abarth","Acura","Alfa Romeo","Aston Martin","Audi","Bentley","BMW","BYD",
  "Cadillac","Chery","Chevrolet","Chrysler","Citroën","Cupra","Daewoo",
  "Daihatsu","Dodge","Ferrari","Fiat","Ford","Genesis","Great Wall","Haval",
  "Holden","Honda","Hyundai","Infiniti","Isuzu","Jaguar","Jeep","Kia","Lamborghini",
  "Land Rover","LDV","Lexus","Lotus","Maserati","Mazda","McLaren",
  "Mercedes-Benz","MG","Mini","Mitsubishi","Nissan","Peugeot","Polestar",
  "Porsche","RAM","Renault","Rolls-Royce","Skoda","SsangYong","Subaru","Suzuki",
  "Tesla","Toyota","Volkswagen","Volvo"
];

const MODEL_SUGGESTIONS_BY_MAKE: Record<string, string[]> = {
  Toyota: ["Corolla","Camry","RAV4","Kluger","Hilux","LandCruiser","Prado","Yaris","C-HR","HiAce"],
  Mazda: ["Mazda2","Mazda3","Mazda6","CX-3","CX-30","CX-5","CX-8","CX-9","BT-50","MX-5"],
  Hyundai: ["i30","i20","Elantra","Sonata","Kona","Tucson","Santa Fe","Palisade","Ioniq 5","Ioniq 6"],
  Kia: ["Cerato","Rio","Seltos","Sportage","Sorento","Carnival","Stinger","EV6"],
  Ford: ["Ranger","Everest","Focus","Fiesta","Mustang","Territory"],
  Nissan: ["X-Trail","Qashqai","Navara","Patrol","Pulsar","Leaf"],
  Subaru: ["Impreza","WRX","Forester","Outback","Crosstrek","BRZ"],
  Mitsubishi: ["ASX","Outlander","Eclipse Cross","Pajero Sport","Triton"],
  Volkswagen: ["Golf","Polo","Passat","Tiguan","Touareg","Amarok"],
  BMW: ["1 Series","3 Series","5 Series","X1","X3","X5"],
  "Mercedes-Benz": ["A-Class","C-Class","E-Class","GLA","GLC","GLE"],
  Tesla: ["Model 3","Model Y","Model S","Model X"],
};

const RECENT_MODELS_KEY = "carverity_recent_models_by_make_v1";

/* =========================================================
   Helpers
========================================================= */

const clampYear = (y: number) =>
  Math.min(Math.max(y, MIN_YEAR), CURRENT_YEAR + 1);

const clampKm = (n: number) =>
  Math.min(Math.max(n, 0), 999999);

const normalise = (s: string) => s.replace(/\s+/g, " ").trim();

const ciStartsWith = (a: string, b: string) =>
  a.toLowerCase().startsWith(b.toLowerCase());

const ciIncludes = (a: string, b: string) =>
  a.toLowerCase().includes(b.toLowerCase());

function loadRecentModels(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(RECENT_MODELS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveRecentModel(make: string, model: string) {
  if (!make || !model) return;
  const map = loadRecentModels();
  const list = map[make] ?? [];
  map[make] = [model, ...list.filter(m => m !== model)].slice(0, 20);
  localStorage.setItem(RECENT_MODELS_KEY, JSON.stringify(map));
}

/* =========================================================
   Component
========================================================= */

export default function InPersonVehicleDetails() {
  const navigate = useNavigate();
  const existing = loadProgress();

  const [scanId] = useState(() => {
    if (existing?.scanId) return existing.scanId;
    const id = generateScanId();
    saveProgress({ scanId: id, type: "in-person" });
    return id;
  });

  const [yearText, setYearText] = useState(
    String((existing as any)?.vehicleYear ?? "")
  );
  const [makeText, setMakeText] = useState(
    String((existing as any)?.vehicleMake ?? "")
  );
  const [modelText, setModelText] = useState(
    String((existing as any)?.vehicleModel ?? "")
  );
  const [kilometres, setKilometres] = useState<number>(
    clampKm(Number((existing as any)?.kilometres ?? 0))
  );

  const yearRef = useRef<HTMLDivElement>(null);
  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState<"year" | "make" | "model" | null>(null);

  /* ---------------- click outside handling ---------------- */

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        yearRef.current?.contains(t) ||
        makeRef.current?.contains(t) ||
        modelRef.current?.contains(t)
      ) return;
      setOpen(null);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  /* ---------------- derived ---------------- */

  const parsedYear = useMemo(() => {
    if (yearText.length !== 4) return null;
    const n = Number(yearText);
    return Number.isNaN(n) ? null : clampYear(n);
  }, [yearText]);

  const yearOptions = useMemo(
    () =>
      Array.from(
        { length: CURRENT_YEAR + 2 - MIN_YEAR },
        (_, i) => String(CURRENT_YEAR + 1 - i)
      ),
    []
  );

  const filteredMakes = useMemo(() => {
    if (!makeText) return MAKE_SUGGESTIONS;
    const q = normalise(makeText);
    return [
      ...MAKE_SUGGESTIONS.filter(m => ciStartsWith(m, q)),
      ...MAKE_SUGGESTIONS.filter(
        m => !ciStartsWith(m, q) && ciIncludes(m, q)
      ),
    ];
  }, [makeText]);

  const modelSuggestions = useMemo(() => {
    const make = normalise(makeText);
    const typed = normalise(modelText);
    const recent = loadRecentModels()[make] ?? [];
    const base = MODEL_SUGGESTIONS_BY_MAKE[make] ?? [];
    const all = Array.from(new Set([...recent, ...base]));
    if (!typed) return all;
    return [
      ...all.filter(m => ciStartsWith(m, typed)),
      ...all.filter(
        m => !ciStartsWith(m, typed) && ciIncludes(m, typed)
      ),
    ];
  }, [makeText, modelText]);

  const isComplete =
    Boolean(parsedYear) &&
    normalise(makeText).length > 1 &&
    normalise(modelText).length > 0;

  /* ---------------- persist (DATA ONLY) ---------------- */

  useEffect(() => {
    saveProgress({
      scanId,
      type: "in-person",
      vehicleYear: parsedYear ?? undefined,
      vehicleMake: normalise(makeText),
      vehicleModel: normalise(modelText),
      kilometres,
    });
  }, [scanId, parsedYear, makeText, modelText, kilometres]);

  /* ---------------- continue ---------------- */

  function continueNext() {
    if (!isComplete) return;
    saveRecentModel(normalise(makeText), normalise(modelText));
    navigate("/scan/in-person/asking-price");
  }

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          Vehicle details
        </h1>
        <p className="text-sm text-slate-400">
          Enter the basic details — approximate is fine.
        </p>
      </header>

      <section className="space-y-6">
        {/* YEAR */}
        <div ref={yearRef} className="relative">
          <label className="text-sm font-semibold text-slate-200">Year</label>
          <input
            value={yearText}
            placeholder="e.g. 2018"
            onChange={(e) =>
              setYearText(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            onFocus={() => setOpen("year")}
            className="mt-1 w-full rounded-xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100"
          />
          {open === "year" && (
            <div className="absolute z-20 mt-2 max-h-60 overflow-auto rounded-xl border border-white/10 bg-slate-950">
              {yearOptions.slice(0, 20).map((y) => (
                <button
                  key={y}
                  onClick={() => {
                    setYearText(y);
                    setOpen(null);
                  }}
                  className="block w-full px-4 py-2 text-left text-slate-200 hover:bg-slate-900"
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MAKE */}
        <div ref={makeRef} className="relative">
          <label className="text-sm font-semibold text-slate-200">Make</label>
          <input
            value={makeText}
            placeholder="e.g. Toyota"
            onChange={(e) => setMakeText(e.target.value)}
            onFocus={() => setOpen("make")}
            className="mt-1 w-full rounded-xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100"
          />
          {open === "make" && (
            <div className="absolute z-20 mt-2 max-h-60 overflow-auto rounded-xl border border-white/10 bg-slate-950">
              {filteredMakes.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMakeText(m);
                    setOpen(null);
                  }}
                  className="block w-full px-4 py-2 text-left text-slate-200 hover:bg-slate-900"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MODEL */}
        <div ref={modelRef} className="relative">
          <label className="text-sm font-semibold text-slate-200">Model</label>
          <input
            value={modelText}
            placeholder="e.g. Corolla"
            onChange={(e) => setModelText(e.target.value)}
            onFocus={() => setOpen("model")}
            className="mt-1 w-full rounded-xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100"
          />
          {open === "model" && (
            <div className="absolute z-20 mt-2 max-h-60 overflow-auto rounded-xl border border-white/10 bg-slate-950">
              {modelSuggestions.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setModelText(m);
                    setOpen(null);
                  }}
                  className="block w-full px-4 py-2 text-left text-slate-200 hover:bg-slate-900"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* KILOMETRES */}
      <section className="space-y-3">
        <label className="text-sm font-semibold text-slate-200">
          Kilometres
        </label>
        <input
          value={kilometres || ""}
          placeholder="Approximate is fine"
          onChange={(e) =>
            setKilometres(
              clampKm(Number(e.target.value.replace(/\D/g, "")))
            )
          }
          className="w-full rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 text-slate-100"
        />
      </section>

      <button
        onClick={continueNext}
        disabled={!isComplete}
        className="w-full rounded-xl bg-emerald-500 disabled:opacity-50 text-black font-semibold px-4 py-3"
      >
        Continue
      </button>
    </div>
  );
}
