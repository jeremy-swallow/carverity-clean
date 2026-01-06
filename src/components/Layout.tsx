// src/components/Layout.tsx
import { Outlet, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadCredits } from "../utils/scanCredits";
import { loadProgress } from "../utils/scanProgress";

export default function Layout() {
  const [credits, setCredits] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = loadProgress();

  useEffect(() => {
    setCredits(loadCredits());

    const handler = (e: StorageEvent) => {
      if (e.key === "carverity_scan_credits" && e.newValue) {
        const parsed = parseInt(e.newValue, 10);
        setCredits(Number.isFinite(parsed) ? parsed : 0);
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 w-full z-40">
        <div className="bg-slate-900/80 backdrop-blur border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

            {/* LOGO */}
            <NavLink to="/" className="font-semibold text-lg tracking-tight">
              CarVerity
            </NavLink>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-5 text-sm">
              <NavLink to="/start-scan">Start scan</NavLink>
              <NavLink to="/my-scans">My scans</NavLink>
              <NavLink to="/pricing">Pricing</NavLink>
              <NavLink to="/faq">FAQ</NavLink>
              <NavLink to="/credits-history">Credits history</NavLink>
            </nav>

            {/* RIGHT ACTIONS */}
            <div className="hidden md:flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-xs">
                Scan credits: {credits}
              </span>

              {progress?.step && (
                <NavLink
                  to={progress.step}
                  className="px-3 py-1 rounded-full bg-amber-400 text-black text-xs font-semibold"
                >
                  Resume scan
                </NavLink>
              )}
            </div>

            {/* MOBILE HAMBURGER */}
            <button
              className="md:hidden px-3 py-2 rounded-lg border border-white/20"
              onClick={() => setMenuOpen((v) => !v)}
            >
              ☰
            </button>
          </div>
        </div>

        {/* MOBILE MENU PANEL */}
        {menuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-white/10 px-6 py-3 space-y-2">
            <NavLink to="/start-scan" onClick={() => setMenuOpen(false)}>
              Start scan
            </NavLink><br/>
            <NavLink to="/my-scans" onClick={() => setMenuOpen(false)}>
              My scans
            </NavLink><br/>
            <NavLink to="/pricing" onClick={() => setMenuOpen(false)}>
              Pricing
            </NavLink><br/>
            <NavLink to="/faq" onClick={() => setMenuOpen(false)}>
              FAQ
            </NavLink><br/>
            <NavLink to="/credits-history" onClick={() => setMenuOpen(false)}>
              Credits history
            </NavLink>

            <div className="mt-2 text-xs text-slate-300">
              Scan credits: {credits}
            </div>

            {progress?.step && (
              <NavLink
                to={progress.step}
                onClick={() => setMenuOpen(false)}
                className="block mt-2 px-3 py-1 rounded-full bg-amber-400 text-black text-xs font-semibold w-fit"
              >
                Resume scan
              </NavLink>
            )}
          </div>
        )}
      </header>

      <div className="h-14" />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
