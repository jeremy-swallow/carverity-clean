import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path
      ? "text-indigo-400 font-semibold"
      : "text-slate-300 hover:text-white";

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">

      {/* HEADER */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="CarVerity logo" className="h-8" />
            <span className="font-bold text-lg">CarVerity</span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex gap-6 items-center">
            <Link to="/start-scan" className={isActive("/start-scan")}>
              Start scan
            </Link>
            <Link to="/my-scans" className={isActive("/my-scans")}>
              My scans
            </Link>
            <Link to="/pricing" className={isActive("/pricing")}>
              Pricing
            </Link>
            <Link to="/faq" className={isActive("/faq")}>
              FAQ
            </Link>
            <Link to="/account" className={isActive("/account")}>
              Account
            </Link>
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            className="md:hidden p-2 border border-white/20 rounded-lg"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-900">
            <nav className="flex flex-col p-3 gap-3">

              <Link
                to="/start-scan"
                className={isActive("/start-scan")}
                onClick={() => setMenuOpen(false)}
              >
                Start scan
              </Link>

              <Link
                to="/my-scans"
                className={isActive("/my-scans")}
                onClick={() => setMenuOpen(false)}
              >
                My scans
              </Link>

              <Link
                to="/pricing"
                className={isActive("/pricing")}
                onClick={() => setMenuOpen(false)}
              >
                Pricing
              </Link>

              <Link
                to="/faq"
                className={isActive("/faq")}
                onClick={() => setMenuOpen(false)}
              >
                FAQ
              </Link>

              <Link
                to="/account"
                className={isActive("/account")}
                onClick={() => setMenuOpen(false)}
              >
                Account
              </Link>

            </nav>
          </div>
        )}
      </header>

      {/* MAIN PAGE CONTENT */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
