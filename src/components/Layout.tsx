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
    location.pathname === path ? "text-indigo-400" : "text-white/90";

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" className="h-8" alt="CarVerity logo" />
            <span className="font-bold text-lg">CarVerity</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex gap-6 text-sm">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-md border border-white/20"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-white/10 bg-slate-900/95">
            <nav className="flex flex-col px-4 py-3 text-sm">
              <Link
                to="/start-scan"
                className={`py-2 ${isActive("/start-scan")}`}
                onClick={() => setMenuOpen(false)}
              >
                Start scan
              </Link>

              <Link
                to="/my-scans"
                className={`py-2 ${isActive("/my-scans")}`}
                onClick={() => setMenuOpen(false)}
              >
                My scans
              </Link>

              <Link
                to="/pricing"
                className={`py-2 ${isActive("/pricing")}`}
                onClick={() => setMenuOpen(false)}
              >
                Pricing
              </Link>

              <Link
                to="/faq"
                className={`py-2 ${isActive("/faq")}`}
                onClick={() => setMenuOpen(false)}
              >
                FAQ
              </Link>

              <Link
                to="/account"
                className={`py-2 ${isActive("/account")}`}
                onClick={() => setMenuOpen(false)}
              >
                Account
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* PAGE CONTENT */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
