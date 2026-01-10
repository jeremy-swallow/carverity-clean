import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

/* =========================================================
   Constants
========================================================= */

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

/* =========================================================
   Helpers
========================================================= */

const clampYear = (y: number) =>
  Math.min(Math.max(y, MIN_YEAR), CURRENT_YEAR + 1);

const clampKm = (n: number) =>
  Math.min(Math.max(n, 0), 999999);

const normalise = (s: string) => s.replace(/\s+/g, " ").trim();

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

  const [openYear, setOpenYear] = useState(false);

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

  const isComplete =
    Boolean(parsedYear) &&
    normalise(makeText).length > 1 &&
    normalise(modelText).length > 0;

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

  function continueNext() {
    if (!isComplete) return;
    navigate("/scan/in-person/photos");
  }

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
          You’re partway through an inspection. You can leave and return at any
          time.
        </p>
      </header>

      {/* YEAR */}
      <div>
        <label className="text-sm font-semibold text-slate-200">Year</label>

        <div className="mt-1 flex gap-3">
          <input
            value={yearText}
            onChange={(e) =>
              setYearText(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            onFocus={() => setOpenYear(true)}
            placeholder="e.g. 2019"
            className="flex-1 rounded-xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100"
          />

          <div className="w-32">
            {openYear && (
              <div className="max-h-60 overflow-auto rounded-xl border border-white/10 bg-slate-950">
                {yearOptions.slice(0, 20).map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      setYearText(y);
                      setOpenYear(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-slate-200 hover:bg-slate-900"
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAKE */}
      <div>
        <label className="text-sm font-semibold text-slate-200">Make</label>
        <input
          value={makeText}
          onChange={(e) => setMakeText(e.target.value)}
          placeholder="e.g. Toyota"
          className="mt-1 w-full rounded-xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100"
        />
      </div>

      {/* MODEL */}
      <div>
        <label className="text-sm font-semibold text-slate-200">Model</label>
        <input
          value={modelText}
          onChange={(e) => setModelText(e.target.value)}
          placeholder="e.g. Corolla"
          className="mt-1 w-full rounded-xl bg-slate-900/70 border border-white/15 px-4 py-3 text-slate-100"
        />
      </div>

      {/* KILOMETRES */}
      <div>
        <label className="text-sm font-semibold text-slate-200">
          Kilometres
        </label>
        <input
          value={kilometres || ""}
          onChange={(e) =>
            setKilometres(clampKm(Number(e.target.value.replace(/\D/g, ""))))
          }
          placeholder="Approximate is fine"
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
