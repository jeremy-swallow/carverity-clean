// src/components/Layout.tsx

import {
  Outlet,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { loadCredits } from "../utils/scanCredits";
import { loadProgress } from "../utils/scanProgress";

export default function Layout() {
  const [credits, setCredits] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasActiveScan, setHasActiveScan] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  /* -------------------------------------------------------
   * Credits — live from localStorage
   * ----------------------------------------------------- */
  useEffect(() => {
    setCredits(loadCredits());

    const handler = (e: StorageEvent) => {
      if (e.key === "carverity_scan_credits") {
        const raw = e.newValue ?? "0";
        const parsed = parseInt(raw, 10);
        setCredits(Number.isFinite(parsed) ? parsed : 0);
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  /* -------------------------------------------------------
   * Resume pill — check if there is progress
   * ----------------------------------------------------- */
  useEffect(() => {
    const progress = loadProgress();
    setHasActiveScan(Boolean(progress?.step));
  }, [location.pathname]);

  function handleResume() {
    const progress = loadProgress();
    if (!progress?.step) return;

    navigate(progress.step);
    setMenuOpen(false);
  }

  /* -------------------------------------------------------
   * Nav config
   * ----------------------------------------------------- */
  const navItems = [
    { to: "/start-scan", label: "Start scan" },
    { to: "/my-scans", label: "My scans" },
    { to: "/faq", label: "FAQ" },
    { to: "/credits-history", label: "Credits history" },
  ];

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "text-sm transition-colors",
      isActive
        ? "text-white font-semibold"
        : "text-slate-300 hover:text-white",
    ].join(" ");

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "block w-full text-left px-2 py-1.5 rounded-lg text-sm",
      isActive
        ? "bg-slate-800 text-white font-semibold"
        : "text-slate-200 hover:bg-slate-800/70",
    ].join(" ");

  /* -------------------------------------------------------
   * Render
   * ----------------------------------------------------- */

  return (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col">
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="bg-slate-950/85 backdrop-blur border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            {/* LOGO */}
            <NavLink to="/" className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight">
                CarVerity
              </span>
            </NavLink>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={desktopLinkClass}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* DESKTOP ACTIONS */}
            <div className="hidden md:flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-xs">
                Scan credits: {credits}
              </span>

              {hasActiveScan && (
                <button
                  onClick={handleResume}
                  className="px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-semibold shadow hover:bg-amber-300"
                >
                  Resume scan
                </button>
              )}
            </div>

            {/* MOBILE ACTIONS + HAMBURGER */}
            <div className="flex md:hidden items-center gap-2">
              {hasActiveScan && (
                <button
                  onClick={handleResume}
                  className="px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-semibold shadow"
                >
                  Resume
                </button>
              )}

              <button
                type="button"
                aria-label="Toggle navigation"
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/15 bg-slate-900/80"
              >
                <span className="sr-only">Open main menu</span>
                <span className="flex flex-col gap-[3px]">
                  <span className="w-4 h-[2px] bg-white rounded" />
                  <span className="w-4 h-[2px] bg-white rounded" />
                  <span className="w-4 h-[2px] bg-white rounded" />
                </span>
              </button>
            </div>
          </div>

          {/* MOBILE MENU */}
          {menuOpen && (
            <div className="md:hidden border-t border-slate-800 bg-slate-950/95">
              <div className="max-w-6xl mx-auto px-4 py-3 space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={mobileLinkClass}
                  >
                    {item.label}
                  </NavLink>
                ))}

                <div className="pt-2 mt-2 border-t border-slate-800">
                  <NavLink
                    to="/what-to-expect"
                    onClick={() => setMenuOpen(false)}
                    className="block px-2 py-1.5 text-sm text-slate-300 underline"
                  >
                    What to expect
                  </NavLink>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-800">
                  <span className="px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-xs">
                    Scan credits: {credits}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Spacer so content clears the fixed header */}
      <div className="h-14" />

      <main className="flex-1">
        <Outlet />
      </main>

      {/* FOOTER — subtle legal links */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <NavLink to="/privacy" className="hover:text-slate-200">
            Privacy
          </NavLink>
          <NavLink to="/terms" className="hover:text-slate-200">
            Terms
          </NavLink>
          <span className="opacity-60">
            © {new Date().getFullYear()} CarVerity
          </span>
        </div>
      </footer>
    </div>
  );
}
