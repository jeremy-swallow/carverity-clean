import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../public/logo.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">

      {/* HEADER */}
      <header className="w-full border-b border-white/10 bg-slate-900/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="CarVerity" className="h-8 rounded-md" />
            <span className="text-lg font-semibold">CarVerity</span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/start-scan" className="hover:text-indigo-300">
              Start scan
            </Link>
            <Link to="/my-scans" className="hover:text-indigo-300">
              My scans
            </Link>
            <Link to="/pricing" className="hover:text-indigo-300">
              Pricing
            </Link>
            <Link to="/faq" className="hover:text-indigo-300">
              FAQ
            </Link>
            <Link to="/account" className="hover:text-indigo-300">
              Account
            </Link>
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg border border-white/20"
          >
            <span className="sr-only">Open menu</span>
            ☰
          </button>
        </div>

        {/* MOBILE MENU PANEL */}
        {open && (
          <div className="md:hidden border-t border-white/10 bg-slate-900/95">
            <nav className="flex flex-col px-6 py-4 gap-3 text-base">
              <Link to="/start-scan" onClick={() => setOpen(false)}>
                Start scan
              </Link>
              <Link to="/my-scans" onClick={() => setOpen(false)}>
                My scans
              </Link>
              <Link to="/pricing" onClick={() => setOpen(false)}>
                Pricing
              </Link>
              <Link to="/faq" onClick={() => setOpen(false)}>
                FAQ
              </Link>
              <Link to="/account" onClick={() => setOpen(false)}>
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
