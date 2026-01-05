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

const YEARS = Array.from({ length: 26 }, (_, i) => String(2026 - i));

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

  const [isExtracting, setIsExtracting] = useState(false);
  const [clipboardError, setClipboardError] = useState<string | null>(null);

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

  async function handlePasteFromClipboard() {
    setClipboardError(null);

    try {
      setIsExtracting(true);
      const text = await navigator.clipboard.readText();

      if (!text || text.trim().length < 20) {
        setClipboardError("Nothing useful was found in the clipboard. Try copying the listing again, then paste.");
        setIsExtracting(false);
        return;
      }

      // Basic placeholder extraction for now — real heuristics can evolve
      updateField("pastedDetails", text);

    } catch {
      setClipboardError("Your browser didn’t allow clipboard access. Please paste manually instead.");
    } finally {
      setIsExtracting(false);
    }
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
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 text-slate-200">

      {/* HEADER */}
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">
          Assisted scan — we’ll help finish this one
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed">
          This listing couldn’t be scanned automatically. Some sites place limits on automated tools,
          but you can still get a full CarVerity report using one of the easy options below.
        </p>
      </header>

      {/* MODE SELECT */}
      <section className="space-y-6">

        {/* SMART PASTE */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="text-sm font-semibold">
              Smart Paste (recommended)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              Low effort
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            On your phone or computer, open the listing → Select All → Copy.
            Then tap the button below and we’ll extract the key details automatically.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handlePasteFromClipboard}
              className="flex-1 rounded-xl bg-violet-400 hover:bg-violet-300 text-slate-900 font-semibold px-4 py-2 shadow text-sm"
            >
              {isExtracting ? "Extracting…" : "Paste from clipboard"}
            </button>
          </div>

          {clipboardError && (
            <p className="text-xs text-rose-300">{clipboardError}</p>
          )}

          <textarea
            className="w-full h-28 rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm"
            value={form.pastedDetails}
            onChange={(e) => updateField("pastedDetails", e.target.value)}
            placeholder="Or paste listing text here…"
          />
        </div>

        {/* SCREENSHOT MODE */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="text-sm font-semibold">
              Upload screenshots instead
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-300 border border-blue-400/30">
              Mobile-friendly
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Take 1–2 screenshots of the listing (title, price, description, features)
            and upload them. We’ll read the text automatically and pre-fill details.
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
        </div>

        {/* MANUAL FINE-TUNE */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4">
          <h2 className="text-sm font-semibold">
            Fine-tune details (optional)
          </h2>

          <p className="text-xs text-slate-400">
            If anything didn’t import cleanly, you can adjust the basics here.
          </p>

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
                placeholder="e.g. 73,500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex gap-3 pt-2">
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
