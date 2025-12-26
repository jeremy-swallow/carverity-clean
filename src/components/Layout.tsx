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
      ? "text-indigo-300 font-semibold drop-shadow-sm"
      : "text-slate-300 hover:text-white transition";

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">

      {/* GLASS NAVBAR */}
      <header className="
        sticky top-0 z-50
        border-b border-white/10
        bg-slate-900/70
        backdrop-blur-xl
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]
      ">
        <div className="
          max-w-6xl mx-auto px-4 h-16
          flex items-center justify-between
        ">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="CarVerity logo" className="h-8" />
            <span className="font-bold text-lg tracking-wide">
              CarVerity
            </span>
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
            onClick={() => setMenuOpen(!menuOpen)}
            className="
              md:hidden p-2 rounded-xl
              border border-white/20
              bg-white/5 hover:bg-white/10
              transition
            "
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* MOBILE MENU GLASS PANEL */}
        {menuOpen && (
          <div className="
            md:hidden border-t border-white/10
            bg-slate-900/80 backdrop-blur-xl
          ">
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

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
