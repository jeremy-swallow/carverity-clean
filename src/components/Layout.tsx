import { Outlet, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Layout() {
  const [credits, setCredits] = useState<number>(0);

  // Load credits from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("carverity_scan_credits");
      if (stored) setCredits(parseInt(stored, 10));
    } catch {
      setCredits(0);
    }

    // Listen for credit changes across app
    const handler = (e: StorageEvent) => {
      if (e.key === "carverity_scan_credits" && e.newValue) {
        setCredits(parseInt(e.newValue, 10));
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

            {/* NAV */}
            <nav className="flex items-center gap-5 text-sm">
              <NavLink to="/start-scan">Start scan</NavLink>
              <NavLink to="/my-scans">My scans</NavLink>
              <NavLink to="/pricing">Pricing</NavLink>
              <NavLink to="/faq">FAQ</NavLink>
              <NavLink to="/credits-history">Credits history</NavLink>
            </nav>

            {/* ACTIONS */}
            <div className="flex items-center gap-3">

              {/* REAL CREDIT BALANCE */}
              <span className="px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-xs">
                Scan credits: {credits}
              </span>

              {/* BUY MORE */}
              <NavLink
                to="/pricing"
                className="px-3 py-1 rounded-full bg-indigo-900/40 border border-indigo-500/40 text-indigo-300 text-xs hover:bg-indigo-800/40"
              >
                Buy more credits
              </NavLink>

              {/* Bell */}
              <button className="relative px-2 py-1 rounded-full bg-slate-800 border border-white/10">
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500" />
                🔔
              </button>

              {/* Profile */}
              <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-xs font-semibold">
                JS
              </div>
            </div>
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
