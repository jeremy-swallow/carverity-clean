import { Outlet, NavLink } from "react-router-dom";

export default function Layout() {
  return (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col">

      {/* HEADER / NAV */}
      <header className="w-full border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <NavLink to="/" className="font-semibold text-lg">
            CarVerity
          </NavLink>

          {/* NAV LINKS */}
          <nav className="flex items-center gap-6 text-sm">
            <NavLink to="/start-scan">Start scan</NavLink>
            <NavLink to="/my-scans">My scans</NavLink>
            <NavLink to="/pricing">Pricing</NavLink>
            <NavLink to="/faq">FAQ</NavLink>
            <NavLink to="/credits-history">Credits history</NavLink>
            <NavLink to="/account">Account</NavLink>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
