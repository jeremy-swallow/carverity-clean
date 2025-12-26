import { Outlet, NavLink } from "react-router-dom";

export default function Layout() {
  return (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col">

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-40">
        <div className="bg-slate-900/70 backdrop-blur border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

            {/* Logo */}
            <NavLink
              to="/"
              className="font-semibold tracking-tight text-lg"
            >
              CarVerity
            </NavLink>

            {/* NAV */}
            <nav className="flex items-center gap-5 text-sm">
              <NavLink
                to="/start-scan"
                className={({ isActive }) =>
                  `hover:text-indigo-300 transition ${
                    isActive ? "text-indigo-300" : "text-slate-300"
                  }`
                }
              >
                Start scan
              </NavLink>

              <NavLink
                to="/my-scans"
                className={({ isActive }) =>
                  `hover:text-indigo-300 transition ${
                    isActive ? "text-indigo-300" : "text-slate-300"
                  }`
                }
              >
                My scans
              </NavLink>

              <NavLink to="/pricing" className="text-slate-300 hover:text-indigo-300">
                Pricing
              </NavLink>

              <NavLink to="/faq" className="text-slate-300 hover:text-indigo-300">
                FAQ
              </NavLink>

              <NavLink
                to="/credits-history"
                className="text-slate-300 hover:text-indigo-300"
              >
                Credits history
              </NavLink>

              <NavLink
                to="/account"
                className="text-slate-300 hover:text-indigo-300"
              >
                Account
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Add space for fixed header */}
      <div className="h-14" />

      {/* MAIN CONTENT */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
