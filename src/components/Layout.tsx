import { Outlet, NavLink } from "react-router-dom";

export default function Layout() {
  return (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col">

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-40">
        <div className="bg-slate-900/80 backdrop-blur border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

            {/* LOGO */}
            <NavLink to="/" className="font-semibold text-lg tracking-tight">
              CarVerity
            </NavLink>

            {/* NAV LINKS */}
            <nav className="flex items-center gap-5 text-sm">
              <NavLink to="/start-scan" className="hover:text-indigo-300 transition">
                Start scan
              </NavLink>
              <NavLink to="/my-scans" className="hover:text-indigo-300 transition">
                My scans
              </NavLink>
              <NavLink to="/pricing" className="hover:text-indigo-300 transition">
                Pricing
              </NavLink>
              <NavLink to="/faq" className="hover:text-indigo-300 transition">
                FAQ
              </NavLink>
              <NavLink to="/credits-history" className="hover:text-indigo-300 transition">
                Credits history
              </NavLink>
            </nav>

            {/* ACTIONS */}
            <div className="flex items-center gap-3">

              {/* Credits pill */}
              <span className="px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-xs">
                Scan credits: 3
              </span>

              {/* Buy credits */}
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

              {/* Profile badge */}
              <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-xs font-semibold">
                JS
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Space for fixed header */}
      <div className="h-14" />

      {/* MAIN CONTENT */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
