import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";

function getContextLabel(pathname: string) {
  if (pathname.startsWith("/scan/online")) return "Online scan";
  if (pathname.startsWith("/scan/in-person")) return "In-person scan";
  if (pathname.startsWith("/my-scans")) return "My scans";
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
          <NavLink
            to="/"
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: 18,
              fontWeight: 700,
              textDecoration: "none",
              color: "white",
            }}
          >
            CarVerity
          </NavLink>

          {contextLabel && (
            <div
              className="header-context"
              style={{ fontSize: 14, color: "#9aa7d9", display: "none" }}
            >
              {contextLabel}
            </div>
          )}

          <nav
            className="desktop-nav"
            style={{
              display: "none",
              gap: 28,
              alignItems: "center",
            }}
          >
            <NavLink to="/start-scan">Start scan</NavLink>
            <NavLink to="/my-scans">My scans</NavLink>
          </nav>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ☰
          </button>
        </div>

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
              <div style={{ fontSize: 13, color: "#9aa7d9" }}>
                {contextLabel}
              </div>
            )}

            <NavLink to="/start-scan" onClick={() => setMenuOpen(false)}>
              Start scan
            </NavLink>

            <NavLink to="/my-scans" onClick={() => setMenuOpen(false)}>
              My scans
            </NavLink>
          </div>
        )}
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
