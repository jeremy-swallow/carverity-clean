// src/pages/OnlineAssist.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

/* =========================================================
   Types
========================================================= */

type AssistForm = {
  make: string;
  model: string;
  year: string;
  kilometres: string;
  pastedDetails: string;
  photos: string[];
};

const MAKES = [
  "Toyota","Hyundai","Kia","Mazda","Ford","Nissan","Mitsubishi",
  "Subaru","Honda","Volkswagen","BMW","Mercedes","Audi","Holden"
];

const YEARS = Array.from({ length: 26 }, (_, i) =>
  String(2026 - i)
);

/* =========================================================
   Component
========================================================= */

export default function OnlineAssist() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SavedResult | null>(null);

  const [form, setForm] = useState<AssistForm>({
    make: "",
    model: "",
    year: "",
    kilometres: "",
    pastedDetails: "",
    photos: [],
  });

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored || stored.step !== "assist-required") {
      navigate("/scan/online/results", { replace: true });
      return;
    }
    setResult(stored);
  }, []);

  function updateField<K extends keyof AssistForm>(key: K, value: AssistForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 8)) {
      const reader = new FileReader();
      urls.push(await new Promise<string>((resolve) => {
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      }));
    }

    updateField("photos", urls);
  }

  function handleContinue() {
    if (!result) return;

    const updated: SavedResult = {
      ...result,
      step: "assist-complete",
      vehicle: {
        make: form.make,
        model: form.model,
        year: form.year,
        kilometres: form.kilometres,
      },
      notes: form.pastedDetails,
      photos: { listing: form.photos },
      completed: true,
    };

    saveOnlineResults(updated);
    navigate("/scan/online/results", { replace: true });
  }

  if (!result) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-slate-200">
      <h1 className="text-lg font-semibold">
        Assisted scan — help us complete your report
      </h1>

      <p className="text-slate-400 text-sm">
        The listing could not be scanned automatically. Please provide a few key
        details and optional photos so CarVerity can continue the analysis.
      </p>

      {/* VEHICLE DETAILS */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-5 space-y-4">
        <h2 className="text-sm font-semibold">Vehicle details</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <label className="text-xs text-slate-400">Make</label>
            <select
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-2 py-1"
              value={form.make}
              onChange={(e) => updateField("make", e.target.value)}
            >
              <option value="">Select</option>
              {MAKES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Model</label>
            <input
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-2 py-1"
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
              placeholder="e.g. i30, CX-5"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Year</label>
            <select
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-2 py-1"
              value={form.year}
              onChange={(e) => updateField("year", e.target.value)}
            >
              <option value="">Select</option>
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Kilometres</label>
            <input
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-2 py-1"
              value={form.kilometres}
              onChange={(e) => updateField("kilometres", e.target.value)}
              placeholder="e.g. 73500"
            />
          </div>
        </div>
      </section>

      {/* PASTE DETAILS */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-5 space-y-3">
        <h2 className="text-sm font-semibold">Paste listing details</h2>

        <p className="text-xs text-slate-400">
          For best results, copy and paste **any text from the listing** such as
          description, features, condition notes or seller comments.
        </p>

        <textarea
          className="w-full h-32 rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm"
          value={form.pastedDetails}
          onChange={(e) => updateField("pastedDetails", e.target.value)}
          placeholder="Paste listing text here…"
        />
      </section>

      {/* PHOTOS */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-5 space-y-3">
        <h2 className="text-sm font-semibold">Upload listing photos (optional)</h2>

        <p className="text-xs text-slate-400">
          Add up to 8 exterior or interior photos. This helps detect potential
          bodywork or presentation concerns.
        </p>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="text-sm"
        />

        {form.photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {form.photos.map((p, i) => (
              <img
                key={i}
                src={p}
                className="rounded-lg border border-white/10 object-cover"
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/start-scan")}
          className="flex-1 rounded-xl border border-white/20 px-4 py-2 text-sm"
        >
          Cancel
        </button>

        <button
          onClick={handleContinue}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-4 py-2 shadow text-sm"
        >
          Continue — generate report
        </button>
      </div>
    </div>
  );
}
