import { Outlet, NavLink } from "react-router-dom";
import { useState } from "react";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0b1020",
        color: "white",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(11,16,32,0.9)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo / Brand */}
          <NavLink
            to="/"
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 0.3,
              textDecoration: "none",
              color: "white",
            }}
          >
            CarVerity
          </NavLink>

          {/* Desktop Nav */}
          <nav
            style={{
              display: "none",
              gap: 24,
              fontSize: 15,
            }}
            className="desktop-nav"
          >
            <NavLink
              to="/start-scan"
              style={({ isActive }) => ({
                color: isActive ? "#7aa2ff" : "#cbd5f5",
                textDecoration: "none",
                fontWeight: 500,
              })}
            >
              Start scan
            </NavLink>

            <NavLink
              to="/pricing"
              style={({ isActive }) => ({
                color: isActive ? "#7aa2ff" : "#cbd5f5",
                textDecoration: "none",
                fontWeight: 500,
              })}
            >
              Pricing
            </NavLink>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: 22,
              cursor: "pointer",
            }}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "12px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <NavLink
              to="/start-scan"
              onClick={() => setMenuOpen(false)}
              style={{
                color: "#cbd5f5",
                textDecoration: "none",
                fontSize: 16,
              }}
            >
              Start scan
            </NavLink>

            <NavLink
              to="/pricing"
              onClick={() => setMenuOpen(false)}
              style={{
                color: "#cbd5f5",
                textDecoration: "none",
                fontSize: 16,
              }}
            >
              Pricing
            </NavLink>
          </div>
        )}
      </header>

      {/* PAGE CONTENT */}
      <main
        style={{
          flex: 1,
          width: "100%",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
