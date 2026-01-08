import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadScans } from "../utils/scanStorage";
import { saveProgress, loadProgress } from "../utils/scanProgress";

type OnlineScanSummary = {
  id: string;
  title: string;
  createdAt: string;
  listingUrl?: string;
};

export default function InPersonLinkSource() {
  const navigate = useNavigate();

  const existing = loadProgress();
  const [onlineScans, setOnlineScans] = useState<OnlineScanSummary[]>([]);

  useEffect(() => {
    // Load any saved scans that came from online mode
    const scans = loadScans().filter((s: any) => s.type === "online");

    setOnlineScans(
      scans.map((s: any) => ({
        id: s.id,
        title: s.title || "Online scan",
        createdAt: s.createdAt,
        listingUrl: s.listingUrl,
      }))
    );

    // Mark the journey step even if user hasn't chosen yet
    saveProgress({
      ...(existing ?? {}),
      type: "in-person",
      step: "/scan/in-person/link-source",
      startedAt: existing?.startedAt ?? new Date().toISOString(),
    });
  }, []);

  function continueStandalone() {
    saveProgress({
      ...(existing ?? {}),
      type: "in-person",
      linkedOnlineScanId: null,
      fromOnlineScan: false,
      step: "/scan/in-person/photos",
    });

    navigate("/scan/in-person/photos");
  }

  function linkTo(scanId: string) {
    saveProgress({
      ...(existing ?? {}),
      type: "in-person",
      linkedOnlineScanId: scanId,
      fromOnlineScan: true,
      step: "/scan/in-person/photos",
    });

    navigate("/scan/in-person/photos");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Choose how to begin
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        How do you want to start this in-person inspection?
      </h1>

      {/* Always allow fresh standalone mode */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-2">
        <h2 className="text-sm font-semibold text-slate-100">
          Start a new stand-alone inspection
        </h2>

        <p className="text-sm text-slate-300">
          Choose this if you’re inspecting a different car or don’t want to link
          this visit to a previous online listing scan.
        </p>

        <button
          onClick={continueStandalone}
          className="w-full mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
        >
          Start a new in-person inspection
        </button>
      </section>

      {/* Only show linking options if scans exist */}
      {onlineScans.length > 0 && (
        <section className="rounded-2xl border border-indigo-400/25 bg-indigo-600/10 px-5 py-4 space-y-2">
          <h2 className="text-sm font-semibold text-indigo-200">
            Or link this in-person inspection to one of your online scans
          </h2>

          <p className="text-xs text-slate-300">
            Useful if you’re inspecting the same vehicle you previously scanned
            online.
          </p>

          <ul className="space-y-2 mt-2">
            {onlineScans.map((s) => (
              <li
                key={s.id}
                className="rounded-2xl border border-white/15 bg-slate-900/60 px-4 py-2"
              >
                <div className="text-sm text-slate-200 font-semibold">
                  {s.title}
                </div>

                {s.listingUrl && (
                  <div className="text-xs text-slate-400 truncate">
                    {s.listingUrl}
                  </div>
                )}

                <button
                  onClick={() => linkTo(s.id)}
                  className="w-full mt-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-black font-semibold px-3 py-2 text-sm"
                >
                  Link to this scan & continue
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
