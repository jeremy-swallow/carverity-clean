import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface LayoutProps {
  children?: ReactNode; // 👈 children is now optional (fixes TS error)
}

export default function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">

      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="CarVerity logo" className="h-8" />
            <span className="font-bold text-lg">CarVerity</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6">
            <Link to="/start-scan" className="hover:text-blue-300">Start scan</Link>
            <Link to="/my-scans" className="hover:text-blue-300">My scans</Link>
            <Link to="/pricing" className="hover:text-blue-300">Pricing</Link>
            <Link to="/faq" className="hover:text-blue-300">FAQ</Link>
            <Link to="/account" className="hover:text-blue-300">Account</Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden px-3 py-1 border rounded"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-900">
            <nav className="flex flex-col px-4 py-3 gap-3">
              <Link to="/start-scan" onClick={() => setMenuOpen(false)}>Start scan</Link>
              <Link to="/my-scans" onClick={() => setMenuOpen(false)}>My scans</Link>
              <Link to="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
              <Link to="/faq" onClick={() => setMenuOpen(false)}>FAQ</Link>
              <Link to="/account" onClick={() => setMenuOpen(false)}>Account</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
