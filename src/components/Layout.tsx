import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadCredits } from "../utils/scanCredits";
import { loadProgress } from "../utils/scanProgress";

export default function Layout() {
  const [credits, setCredits] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [progress, setProgress] = useState<any>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // 🔹 Placeholder user profile (future-auth ready)
  const userName = "Jeremy Swallow";
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // 🔹 Dynamic credit badge colour
  function creditBadgeClass() {
    if (credits >= 5)
      return "bg-emerald-900/40 border-emerald-500/40 text-emerald-300";
    if (credits >= 2)
      return "bg-amber-900/40 border-amber-500/40 text-amber-300";
    return "bg-red-900/40 border-red-500/40 text-red-300";
  }

  // Load credits + scan progress + subscribe
  useEffect(() => {
    setCredits(loadCredits());
    setProgress(loadProgress());

    const handler = (e: StorageEvent) => {
      if (e.key === "carverity_scan_credits" && e.newValue) {
        const parsed = parseInt(e.newValue, 10);
        setCredits(Number.isFinite(parsed) ? parsed : 0);
      }

      if (e.key === "carverity_scan_progress") {
        setProgress(loadProgress());
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  function resumeScan() {
    if (!progress?.step) return;
    closeAllOverlays();
    navigate(progress.step);
  }

  function closeAllOverlays() {
    setMenuOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
  }

  function navClass(path: string) {
    const active =
      location.pathname === path || location.pathname.startsWith(path);

    return active
      ? "text-white font-semibold underline underline-offset-4"
      : "text-slate-300 hover:text-white";
  }

  return (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 w-full z-40">
        <div className="bg-slate-900/80 backdrop-blur border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

            {/* LOGO */}
            <NavLink
              to="/"
              onClick={closeAllOverlays}
              className="font-semibold text-lg tracking-tight"
            >
              CarVerity
            </NavLink>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-5 text-sm">
              <NavLink to="/start-scan" className={navClass("/start-scan")}>
                Start scan
              </NavLink>
              <NavLink to="/my-scans" className={navClass("/my-scans")}>
                My scans
              </NavLink>
              <NavLink to="/pricing" className={navClass("/pricing")}>
                Pricing
              </NavLink>
              <NavLink to="/faq" className={navClass("/faq")}>
                FAQ
              </NavLink>
              <NavLink
                to="/credits-history"
                className={navClass("/credits-history")}
              >
                Credits history
              </NavLink>
            </nav>

            {/* DESKTOP ACTIONS */}
            <div className="hidden md:flex items-center gap-3">

              {/* RESUME PILL — only shows when scan in progress */}
              {progress?.step && (
                <button
                  onClick={resumeScan}
                  className="px-3 py-1 rounded-full bg-amber-900/40 border border-amber-400/40 text-amber-200 text-xs hover:bg-amber-800/50"
                >
                  Resume last scan
                </button>
              )}

              <span
                className={`px-3 py-1 rounded-full border text-xs ${creditBadgeClass()}`}
              >
                Scan credits: {credits}
              </span>

              <NavLink
                to="/pricing"
                className="px-3 py-1 rounded-full bg-indigo-900/40 border border-indigo-500/40 text-indigo-300 text-xs hover:bg-indigo-800/40"
              >
                Buy more credits
              </NavLink>

              {/* NOTIFICATIONS */}
              <div className="relative">
                <button
                  onClick={() =>
                    setNotificationsOpen((v) => !v)
                  }
                  className="relative px-2 py-1 rounded-full bg-slate-800 border border-white/10"
                >
                  {notificationsOpen && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  🔔
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/15 bg-slate-900/95 shadow-lg backdrop-blur p-2 text-sm">
                    <div className="px-3 py-2 text-slate-300">
                      No new notifications
                    </div>
                  </div>
                )}
              </div>

              {/* PROFILE DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-xs font-semibold"
                >
                  {initials}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/15 bg-slate-900/95 shadow-lg backdrop-blur p-2 text-sm">
                    <div className="px-3 py-1 text-slate-400 text-xs">
                      Signed in as {userName}
                    </div>

                    <NavLink
                      to="/my-scans"
                      onClick={closeAllOverlays}
                      className="block px-3 py-2 rounded-lg hover:bg-slate-800/70"
                    >
                      My scans
                    </NavLink>

                    <NavLink
                      to="/credits-history"
                      onClick={closeAllOverlays}
                      className="block px-3 py-2 rounded-lg hover:bg-slate-800/70"
                    >
                      Credits history
                    </NavLink>

                    <button
                      onClick={closeAllOverlays}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800/70"
                    >
                      Settings (coming soon)
                    </button>

                    <button
                      onClick={closeAllOverlays}
                      className="w-full text-left px-3 py-2 rounded-lg text-red-300 hover:bg-red-500/20"
                    >
                      Sign out (future)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* MOBILE HAMBURGER */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-white/15 bg-slate-800/50"
              onClick={() => {
                setMenuOpen((v) => !v);
                setProfileOpen(false);
                setNotificationsOpen(false);
              }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* MOBILE MENU PANEL — animated */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            menuOpen ? "max-h-[460px] opacity-100" : "max-h-0 opacity-0"
          } bg-slate-900/95 backdrop-blur border-b border-white/10`}
        >
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-3">

            {/* Resume pill on mobile */}
            {progress?.step && (
              <button
                onClick={resumeScan}
                className="w-full px-3 py-2 rounded-xl bg-amber-900/40 border border-amber-400/40 text-amber-200 text-sm font-semibold"
              >
                Resume last scan
              </button>
            )}

            <div className="flex items-center justify-between">
              <span
                className={`px-3 py-1 rounded-full border text-xs ${creditBadgeClass()}`}
              >
                Scan credits: {credits}
              </span>

              <NavLink
                to="/pricing"
                onClick={closeAllOverlays}
                className="px-3 py-1 rounded-full bg-indigo-900/40 border border-indigo-500/40 text-indigo-300 text-xs"
              >
                Buy more credits
              </NavLink>
            </div>

            <nav className="flex flex-col gap-2 text-sm">
              <NavLink
                to="/start-scan"
                onClick={closeAllOverlays}
                className={navClass("/start-scan")}
              >
                Start scan
              </NavLink>
              <NavLink
                to="/my-scans"
                onClick={closeAllOverlays}
                className={navClass("/my-scans")}
              >
                My scans
              </NavLink>
              <NavLink
                to="/pricing"
                onClick={closeAllOverlays}
                className={navClass("/pricing")}
              >
                Pricing
              </NavLink>
              <NavLink
                to="/faq"
                onClick={closeAllOverlays}
                className={navClass("/faq")}
              >
                FAQ
              </NavLink>
              <NavLink
                to="/credits-history"
                onClick={closeAllOverlays}
                className={navClass("/credits-history")}
              >
                Credits history
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <div className="h-14" />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
