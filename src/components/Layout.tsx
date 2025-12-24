import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";

function getContextLabel(pathname: string) {
  if (pathname.startsWith("/scan/online")) return "Online scan";
  if (pathname.startsWith("/scan/in-person")) return "In-person scan";
  if (pathname.startsWith("/start-scan")) return "Start scan";
  return "";
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const contextLabel = getContextLabel(location.pathname);

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
          background: "rgba(11,16,32,0.92)",
          backdropFilter: "blur(10px)",
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
            gap: 24,
          }}
        >
          {/* Brand */}
          <NavLink
            to="/"
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 0.3,
              textDecoration: "none",
              color: "white",
              whiteSpace: "nowrap",
            }}
          >
            CarVerity
          </NavLink>

          {/* Context label (desktop only) */}
          {contextLabel && (
            <div
              style={{
                fontSize: 14,
                color: "#9aa7d9",
                whiteSpace: "nowrap",
                display: "none",
              }}
              className="header-context"
            >
              {contextLabel}
            </div>
          )}

          {/* Desktop navigation */}
          <nav
            style={{
              display: "none",
              gap: 28,
              fontSize: 15,
              alignItems: "center",
            }}
            className="desktop-nav"
          >
            <NavLink
              to="/start-scan"
              style={({ isActive }) => ({
                color: isActive ? "#7aa2ff" : "#cbd5f5",
                textDecoration: "none",
                fontWeight: 500,
                paddingBottom: 2,
                borderBottom: isActive
                  ? "2px solid #7aa2ff"
                  : "2px solid transparent",
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
                paddingBottom: 2,
                borderBottom: isActive
                  ? "2px solid #7aa2ff"
                  : "2px solid transparent",
              })}
            >
              Pricing
            </NavLink>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
            }}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "14px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {contextLabel && (
              <div
                style={{
                  fontSize: 13,
                  color: "#9aa7d9",
                  marginBottom: 4,
                }}
              >
                {contextLabel}
              </div>
            )}

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
