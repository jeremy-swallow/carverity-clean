import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

type ScanRecord = {
  id: string;
  type: "online" | "in-person";
  title?: string;
  thumbnail?: string;
  updatedAt?: string;
  progress?: number;
  pinned?: boolean;
  completed?: boolean;
};

type StoredScansPayload =
  | ScanRecord[]
  | {
      version?: number;
      userId?: string;
      scans: ScanRecord[];
    };

export default function Home() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const [offset, setOffset] = useState(0);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [allowMotion, setAllowMotion] = useState(true);

  const [fullScans, setFullScans] = useState<ScanRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "online" | "in-person" | "completed">(
    "all"
  );

  const [lastDeleted, setLastDeleted] = useState<ScanRecord | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  // ---- Helpers -------------------------------------------------

  const formatTimeAgo = (iso?: string) => {
    if (!iso) return "Unknown";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const getProgress = (n?: number) => Math.max(0, Math.min(n ?? 0, 100));
  const getProgressColor = (n: number, completed?: boolean) => {
    if (completed || n >= 100) return "bg-emerald-500";
    if (n >= 80) return "bg-emerald-500";
    if (n >= 40) return "bg-amber-400";
    return "bg-indigo-400";
  };

  const sortScans = (list: ScanRecord[]) =>
    [...list].sort((a, b) => {
      // Pinned first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // Newest first
      const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bt - at;
    });

  const saveList = (list: ScanRecord[]) => {
    const sorted = sortScans(list);
    const payload: StoredScansPayload = {
      version: 1,
      userId: "local-anon", // later: real user id when auth is wired
      scans: sorted,
    };

    localStorage.setItem("carverity_recent_scans", JSON.stringify(payload));
    setFullScans(sorted);
  };

  // ---- Load stored scans (cloud-sync ready shape) --------------

  useEffect(() => {
    try {
      const raw = localStorage.getItem("carverity_recent_scans");
      if (!raw) return;

      const parsed: StoredScansPayload = JSON.parse(raw);

      let scans: ScanRecord[] = [];
      if (Array.isArray(parsed)) {
        scans = parsed;
      } else if (parsed && Array.isArray(parsed.scans)) {
        scans = parsed.scans;
      }

      setFullScans(sortScans(scans));
    } catch {
      setFullScans([]);
    }
  }, []);

  // ---- Motion rules -------------------------------------------

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
    const isiOS =
      /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
      !window.matchMedia("(hover: hover)").matches;

    if (reduceMotion || isLowEnd || isiOS) {
      setAllowMotion(false);
      return;
    }
  }, []);

  useEffect(() => {
    if (!allowMotion) return;
    const handleScroll = () => setOffset(window.scrollY * 0.12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [allowMotion]);

  useEffect(() => {
    if (!allowMotion) return;
    const handleGyro = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;
      setTiltX(gamma * 0.25);
      setTiltY(beta * 0.15);
    };
    window.addEventListener("deviceorientation", handleGyro, true);
    return () => window.removeEventListener("deviceorientation", handleGyro, true);
  }, [allowMotion]);

  // ---- Fade-in animations -------------------------------------

  useEffect(() => {
    const reveal = (el: Element) => {
      el.classList.remove("opacity-0", "translate-y-6");
      el.classList.add("opacity-100", "translate-y-0");
    };
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && reveal(e.target)),
      { threshold: 0.24 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    if (cardsRef.current) {
      Array.from(cardsRef.current.children).forEach((card, i) =>
        setTimeout(() => observer.observe(card), i * 120)
      );
    }
    return () => observer.disconnect();
  }, []);

  // ---- Actions: pin, delete, complete, undo -------------------

  const togglePin = (id: string) => {
    const updated = fullScans.map((s) =>
      s.id === id ? { ...s, pinned: !s.pinned } : s
    );
    saveList(updated);
  };

  const toggleCompleted = (id: string) => {
    const updated = fullScans.map((s) =>
      s.id === id
        ? {
            ...s,
            completed: !s.completed,
            progress: !s.completed ? 100 : s.progress ?? 0,
          }
        : s
    );
    saveList(updated);
  };

  const deleteScan = (id: string) => {
    const target = fullScans.find((s) => s.id === id) || null;
    const updated = fullScans.filter((s) => s.id !== id);
    setLastDeleted(target);
    setShowUndo(true);
    saveList(updated);
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    const restored = [lastDeleted, ...fullScans];
    saveList(restored);
    setLastDeleted(null);
    setShowUndo(false);
  };

  // ---- Swipe gestures (mobile delete) -------------------------

  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeTarget, setSwipeTarget] = useState<string | null>(null);

  const startSwipe = (id: string, x: number) => {
    setSwipeTarget(id);
    setSwipeStartX(x);
  };

  const moveSwipe = (x: number) => {
    if (!swipeStartX || !swipeTarget) return;
    const diff = x - swipeStartX;
    if (diff < -60) {
      deleteScan(swipeTarget);
      setSwipeTarget(null);
      setSwipeStartX(null);
    }
  };

  const endSwipe = () => {
    setSwipeTarget(null);
    setSwipeStartX(null);
  };

  // ---- Derived views ------------------------------------------

  const filteredScans = fullScans.filter((scan) => {
    if (filter === "all") return true;
    if (filter === "completed") return !!scan.completed;
    return scan.type === filter;
  });

  const displayScans = filteredScans.slice(0, 3);

  // ---- Render -------------------------------------------------

  return (
    <div className="bg-slate-900 text-white">
      {/* HERO */}
      <section className="relative w-full overflow-hidden border-b border-white/10">
        <img
          src="/photo-guides/hero.png"
          alt="Car interior dashboard"
          className="absolute inset-0 w-full h-full object-cover will-change-transform"
          style={
            allowMotion
              ? {
                  transform: `
                    translateY(${offset * 0.4}px)
                    translateX(${tiltX}px)
                    translateY(${tiltY * 0.3}px)
                    scale(1.06)
                  `,
                }
              : { transform: "none" }
          }
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-black/85" />

        <div
          ref={heroRef}
          className="relative max-w-5xl mx-auto px-6 py-24 sm:py-28 opacity-0 translate-y-6 transition-all duration-700 ease-out"
        >
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Smarter used-car checks with CarVerity
          </h1>

          <p className="mt-4 text-slate-300 max-w-2xl">
            Analyse car listings, spot risk signals before you buy, and guide your
            in-person inspections with confidence.
          </p>

          <div className="mt-6 flex gap-4 flex-wrap">
            <Link
              to="/start-scan"
              className="px-4 py-2 rounded-md bg-indigo-500 text-white transition hover:bg-indigo-600"
            >
              Start a scan
            </Link>
            <Link
              to="/my-scans"
              className="px-4 py-2 rounded-md bg-slate-800 text-white/90 transition hover:bg-slate-700"
            >
              My scans
            </Link>
          </div>
        </div>
      </section>

      <div className="h-6 sm:h-10" />

      {/* RECENT SCANS PANEL */}
      <section className="max-w-5xl mx-auto px-6 mb-4">
        <div className="border border-white/10 rounded-xl p-5 bg-slate-800/40 backdrop-blur">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <h3 className="font-semibold">
              {displayScans.length ? "Recent scans" : "Start your first scan"}
            </h3>

            {/* Filter tabs */}
            <div className="flex gap-2 text-xs bg-slate-900/60 rounded-full p-1 border border-white/10">
              {[
                { key: "all", label: "All" },
                { key: "online", label: "Online" },
                { key: "in-person", label: "In-person" },
                { key: "completed", label: "Completed" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() =>
                    setFilter(tab.key as "all" | "online" | "in-person" | "completed")
                  }
                  className={`px-2.5 py-1 rounded-full transition ${
                    filter === tab.key
                      ? "bg-white text-slate-900"
                      : "text-slate-300 hover:bg-slate-700/80"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {displayScans.length === 0 ? (
            <div className="flex items-center justify-between">
              <p className="text-slate-300 text-sm">
                No scans yet — begin with an online listing or in-person inspection.
              </p>
              <Link
                to="/start-scan"
                className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white text-sm transition"
              >
                Start →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayScans.map((scan) => {
                const p = getProgress(scan.progress);
                const color = getProgressColor(p, scan.completed);
                const badgeClass =
                  scan.type === "online"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30";

                return (
                  <div
                    key={scan.id}
                    className="group relative rounded-lg overflow-hidden"
                    onTouchStart={(e) =>
                      startSwipe(scan.id, e.touches[0]?.clientX ?? 0)
                    }
                    onTouchMove={(e) => moveSwipe(e.touches[0]?.clientX ?? 0)}
                    onTouchEnd={endSwipe}
                  >
                    {/* Swipe delete background */}
                    <div className="absolute inset-0 bg-red-500/40 flex items-center justify-end pr-4">
                      <span className="text-white text-sm">Delete</span>
                    </div>

                    {/* Main row */}
                    <div
                      className="relative w-full flex items-center gap-4 text-left border border-white/10 rounded-lg p-3 bg-slate-800/30 hover:bg-slate-700/40 transition-all md:hover:-translate-y-[2px] md:hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                      style={
                        swipeTarget === scan.id && swipeStartX
                          ? { transform: "translateX(-60px)" }
                          : undefined
                      }
                    >
                      {/* Clickable content to resume */}
                      <button
                        onClick={() => navigate(`/scan/${scan.id}`)}
                        className="flex-1 flex items-center gap-4 text-left"
                      >
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-md overflow-hidden border border-white/10 bg-slate-700 flex items-center justify-center">
                          {scan.thumbnail ? (
                            <img
                              src={scan.thumbnail}
                              alt="Vehicle"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-300">No photo</span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">
                              {scan.title || "Vehicle scan"}
                            </p>

                            {/* Mode badge */}
                            <span
                              className={`text-[10px] px-2 py-[2px] rounded-md ${badgeClass}`}
                            >
                              {scan.type === "online" ? "Online" : "In-Person"}
                            </span>

                            {/* Completed badge */}
                            {scan.completed && (
                              <span className="text-[10px] px-2 py-[2px] rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Completed
                              </span>
                            )}

                            {/* Pin badge */}
                            {scan.pinned && (
                              <span className="text-amber-300 text-xs">★ Pinned</span>
                            )}
                          </div>

                          <p className="text-slate-300 text-xs mb-1">
                            {formatTimeAgo(scan.updatedAt)}
                          </p>

                          {/* Progress */}
                          <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full ${color} transition-all duration-500`}
                              style={{ width: `${p}%` }}
                            />
                          </div>

                          <p className="text-[11px] mt-1 text-slate-400">
                            {scan.completed || p >= 100 ? "100% complete" : `${p}% complete`}
                          </p>
                        </div>
                      </button>

                      {/* Right-side actions */}
                      <div className="flex flex-col gap-1 items-end ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompleted(scan.id);
                          }}
                          className="text-[11px] px-2 py-1 rounded-md bg-slate-700/70 text-slate-200 hover:bg-slate-600 transition"
                        >
                          {scan.completed || p >= 100 ? "Mark as active" : "Mark completed"}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(scan.id);
                          }}
                          className="text-[11px] px-2 py-1 rounded-md bg-slate-700/70 text-slate-200 hover:bg-slate-600 transition"
                        >
                          {scan.pinned ? "Unpin" : "Pin"}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteScan(scan.id);
                          }}
                          className="text-[11px] text-red-300 hover:text-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section
        ref={cardsRef}
        className="max-w-5xl mx-auto px-6 pb-16 pt-2 grid gap-6 md:grid-cols-3"
      >
        <div className="border border-white/10 rounded-xl p-5 bg-slate-800/30 backdrop-blur opacity-0 translate-y-6 transition-all duration-700 ease-out">
          <h3 className="font-semibold mb-2">Online Listing Scan</h3>
          <p className="text-slate-300 text-sm mb-3">
            Paste a listing link and instantly analyse pricing, wording risks, and
            seller flags.
          </p>
          <Link to="/start-scan" className="text-indigo-300 hover:text-indigo-200 text-sm">
            Start online scan →
          </Link>
        </div>

        <div className="border border-white/10 rounded-xl p-5 bg-slate-800/30 backdrop-blur opacity-0 translate-y-6 transition-all duration-700 ease-out">
          <h3 className="font-semibold mb-2">In-Person Inspection Mode</h3>
          <p className="text-slate-300 text-sm mb-3">
            Guided on-site checklist with photos, prompts, and risk highlights.
          </p>
          <Link
            to="/inperson-start"
            className="text-indigo-300 hover:text-indigo-200 text-sm"
          >
            Start in-person scan →
          </Link>
        </div>

        <div className="border border-white/10 rounded-xl p-5 bg-slate-800/30 backdrop-blur opacity-0 translate-y-6 transition-all duration-700 ease-out">
          <h3 className="font-semibold mb-2">Your Scan History</h3>
          <p className="text-slate-300 text-sm mb-3">
            Re-open reports and compare vehicles side-by-side.
          </p>
          <Link to="/my-scans" className="text-indigo-300 hover:text-indigo-200 text-sm">
            View my scans →
          </Link>
        </div>
      </section>

      {/* UNDO SNACKBAR */}
      {showUndo && lastDeleted && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-slate-900/90 border border-white/10 shadow-lg text-sm">
            <span>
              Removed{" "}
              <strong>{lastDeleted.title || "scan"}</strong>
            </span>
            <button
              onClick={undoDelete}
              className="text-emerald-300 hover:text-emerald-200 font-semibold"
            >
              Undo
            </button>
            <button
              onClick={() => setShowUndo(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
