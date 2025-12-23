import { Outlet, Link } from "react-router-dom";
import { useState } from "react";

/* =========================================================
   RESPONSIVE LAYOUT
   - Mobile: logo + menu icon
   - Desktop: logo + nav links
========================================================= */

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0b1020, #060914)",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px clamp(16px, 5vw, 40px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <img
            src="/logo.png"
            alt="CarVerity"
            style={{
              height: 28,
              width: "auto",
            }}
          />
          <div style={{ lineHeight: 1.1 }}>
            <strong style={{ fontSize: 16 }}>CarVerity</strong>
            <div style={{ fontSize: 12, color: "#9aa4c7" }}>
              calm expert assistant
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav
          style={{
            display: "none",
            gap: 24,
          }}
          className="desktop-nav"
        >
          <Link style={navLinkStyle} to="/">
            Home
          </Link>
          <Link style={navLinkStyle} to="/start-scan">
            Start Scan
          </Link>
          <Link style={navLinkStyle} to="/pricing">
            Pricing
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            background: "none",
            border: "none",
            color: "#e5e7eb",
            fontSize: 22,
            cursor: "pointer",
            display: "block",
          }}
          className="mobile-menu-button"
          aria-label="Menu"
        >
          ☰
        </button>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            background: "#0b1020",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Link onClick={() => setMenuOpen(false)} style={navLinkStyle} to="/">
            Home
          </Link>
          <Link
            onClick={() => setMenuOpen(false)}
            style={navLinkStyle}
            to="/start-scan"
          >
            Start Scan
          </Link>
          <Link
            onClick={() => setMenuOpen(false)}
            style={navLinkStyle}
            to="/pricing"
          >
            Pricing
          </Link>
        </div>
      )}

      {/* CONTENT */}
      <main
        style={{
          padding: "clamp(24px, 5vw, 48px)",
        }}
      >
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer
        style={{
          padding: "24px",
          textAlign: "center",
          fontSize: 13,
          color: "#9aa4c7",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        © CarVerity — vehicle insight with confidence
      </footer>

      {/* RESPONSIVE RULES */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex;
          }
          .mobile-menu-button {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#cbd5f5",
  fontSize: 14,
};
