import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

/* =========================================================
   Constants & data
========================================================= */

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

const MAKE_SUGGESTIONS = [
  "Abarth","Acura","Alfa Romeo","Aston Martin","Audi","Bentley","BMW","BYD",
  "Cadillac","Chery","Chevrolet","Chrysler","Citroën","Cupra","Daewoo",
  "Daihatsu","Dodge","Ferrari","Fiat","Ford","Genesis","Great Wall","Haval",
  "Holden","Honda","Hyundai","Infiniti","Isuzu","Jaguar","Jeep","Kia",
  "Lamborghini","Land Rover","LDV","Lexus","Lotus","Maserati","Mazda",
  "McLaren","Mercedes-Benz","MG","Mini","Mitsubishi","Nissan","Peugeot",
  "Polestar","Porsche","RAM","Renault","Rolls-Royce","Skoda","SsangYong",
  "Subaru","Suzuki","Tesla","Toyota","Volkswagen","Volvo",
];

const MODEL_BY_MAKE: Record<string, string[]> = {
  Toyota: ["Corolla","Camry","RAV4","Hilux","LandCruiser","Yaris","Kluger"],
  Mazda: ["Mazda2","Mazda3","Mazda6","CX-3","CX-5","CX-9","MX-5"],
  Hyundai: ["i30","Elantra","Kona","Tucson","Santa Fe","Palisade"],
  Kia: ["Cerato","Rio","Seltos","Sportage","Sorento","Carnival"],
  Ford: ["Ranger","Everest","Focus","Fiesta","Mustang"],
  Tesla: ["Model 3","Model Y","Model S","Model X"],
};

const RECENT_MODELS_KEY = "carverity_recent_models_v1";

/* =========================================================
   Helpers
========================================================= */

const clampYear = (y: number) =>
  Math.min(Math.max(y, MIN_YEAR), CURRENT_YEAR + 1);

const clampKm = (n: number) =>
  Math.min(Math.max(n, 0), 999999);

const norm = (s: string) => s.trim();

const ciMatch = (v: string, q: string) =>
  v.toLowerCase().includes(q.toLowerCase());

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
  map[make] = [model, ...(map[make] ?? []).filter(m => m !== model)].slice(0, 10);
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

  const [yearText, setYearText] = useState(String(existing?.vehicleYear ?? ""));
  const [makeText, setMakeText] = useState(String(existing?.vehicleMake ?? ""));
  const [modelText, setModelText] = useState(String(existing?.vehicleModel ?? ""));
  const [kilometres, setKilometres] = useState<number>(
    clampKm(Number(existing?.kilometres ?? 0))
  );

  const [open, setOpen] = useState<"year" | "make" | "model" | null>(null);

  const yearRef = useRef<HTMLDivElement>(null);
  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    function close(e: MouseEvent) {
      if (
        yearRef.current?.contains(e.target as Node) ||
        makeRef.current?.contains(e.target as Node) ||
        modelRef.current?.contains(e.target as Node)
      ) return;
      setOpen(null);
    }
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  const parsedYear =
    yearText.length === 4 ? clampYear(Number(yearText)) : null;

  const yearOptions = useMemo(
    () =>
      Array.from(
        { length: CURRENT_YEAR + 2 - MIN_YEAR },
        (_, i) => String(CURRENT_YEAR + 1 - i)
      ),
    []
  );

  const makeOptions = useMemo(
    () =>
      makeText
        ? MAKE_SUGGESTIONS.filter(m => ciMatch(m, makeText))
        : MAKE_SUGGESTIONS,
    [makeText]
  );

  const modelOptions = useMemo(() => {
    const make = norm(makeText);
    const typed = norm(modelText);
    const recent = loadRecentModels()[make] ?? [];
    const base = MODEL_BY_MAKE[make] ?? [];
    const all = Array.from(new Set([...recent, ...base]));
    return typed ? all.filter(m => ciMatch(m, typed)) : all;
  }, [makeText, modelText]);

  const isComplete =
    Boolean(parsedYear) && norm(makeText).length > 1 && norm(modelText).length > 0;

  useEffect(() => {
    saveProgress({
      scanId,
      type: "in-person",
      vehicleYear: parsedYear ?? undefined,
      vehicleMake: norm(makeText),
      vehicleModel: norm(modelText),
      kilometres,
    });
  }, [scanId, parsedYear, makeText, modelText, kilometres]);

  function continueNext() {
    if (!isComplete) return;
    saveRecentModel(norm(makeText), norm(modelText));
    navigate("/scan/in-person/photos");
  }

  const dropdownBase =
    "absolute left-0 right-0 top-full mt-2 z-30 max-h-56 overflow-auto rounded-xl border border-white/10 bg-slate-950";

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          Vehicle details
        </h1>
        <p className="text-sm text-slate-400">
          Enter the basic details — approximate is fine.
        </p>
        <p className="text-[11px] text-slate-500">
          You can leave and return at any time.
        </p>
      </header>

      {/* YEAR */}
      <div ref={yearRef} className="relative">
        <label className="text-sm font-semibold text-slate-200">Year</label>
        <input
          value={yearText}
          onChange={e => setYearText(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onFocus={() => setOpen("year")}
          className="mt-1 w-full rounded-xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100"
        />
        {open === "year" && (
          <div className={dropdownBase}>
            {yearOptions.slice(0, 20).map(y => (
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
          onChange={e => setMakeText(e.target.value)}
          onFocus={() => setOpen("make")}
          className="mt-1 w-full rounded-xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100"
        />
        {open === "make" && (
          <div className={dropdownBase}>
            {makeOptions.map(m => (
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
          onChange={e => setModelText(e.target.value)}
          onFocus={() => setOpen("model")}
          className="mt-1 w-full rounded-xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100"
        />
        {open === "model" && (
          <div className={dropdownBase}>
            {modelOptions.map(m => (
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

      {/* KILOMETRES */}
      <div>
        <label className="text-sm font-semibold text-slate-200">Kilometres</label>
        <input
          value={kilometres || ""}
          onChange={e =>
            setKilometres(clampKm(Number(e.target.value.replace(/\D/g, ""))))
          }
          className="mt-1 w-full rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 text-slate-100"
        />
      </div>

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
