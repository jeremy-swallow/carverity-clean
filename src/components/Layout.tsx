import { Outlet, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadCredits } from "../utils/scanCredits";

export default function Layout() {
  const [credits, setCredits] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Load + subscribe to storage changes
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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 w-full z-40">
        <div className="bg-slate-900/80 backdrop-blur border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

            {/* LOGO */}
            <NavLink
              to="/"
              onClick={closeMenu}
              className="font-semibold text-lg tracking-tight"
            >
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

            {/* DESKTOP ACTIONS */}
            <div className="hidden md:flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-xs">
                Scan credits: {credits}
              </span>

              <NavLink
                to="/pricing"
                className="px-3 py-1 rounded-full bg-indigo-900/40 border border-indigo-500/40 text-indigo-300 text-xs hover:bg-indigo-800/40"
              >
                Buy more credits
              </NavLink>

              <button className="relative px-2 py-1 rounded-full bg-slate-800 border border-white/10">
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500" />
                🔔
              </button>

              <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-xs font-semibold">
                JS
              </div>
            </div>

            {/* MOBILE HAMBURGER */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-white/15 bg-slate-800/50"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* MOBILE MENU PANEL */}
        {menuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur border-b border-white/10">
            <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-3">

              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-xs">
                  Scan credits: {credits}
                </span>

                <NavLink
                  to="/pricing"
                  onClick={closeMenu}
                  className="px-3 py-1 rounded-full bg-indigo-900/40 border border-indigo-500/40 text-indigo-300 text-xs"
                >
                  Buy more credits
                </NavLink>
              </div>

              <nav className="flex flex-col gap-2 text-sm">
                <NavLink to="/start-scan" onClick={closeMenu}>
                  Start scan
                </NavLink>
                <NavLink to="/my-scans" onClick={closeMenu}>
                  My scans
                </NavLink>
                <NavLink to="/pricing" onClick={closeMenu}>
                  Pricing
                </NavLink>
                <NavLink to="/faq" onClick={closeMenu}>
                  FAQ
                </NavLink>
                <NavLink to="/credits-history" onClick={closeMenu}>
                  Credits history
                </NavLink>
              </nav>
            </div>
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
