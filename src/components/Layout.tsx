import { Outlet, Link } from "react-router-dom";

const HEADER_HEIGHT = 64;

export default function Layout() {
  return (
    <>
      {/* Header */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "rgba(6, 10, 30, 0.85)",
          backdropFilter: "blur(10px)",
          zIndex: 1000,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link
          to="/"
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "white",
            textDecoration: "none",
          }}
        >
          CarVerity
        </Link>

        <nav
          style={{
            display: "flex",
            gap: 18,
            fontSize: 14,
          }}
        >
          <Link
            to="/start-scan"
            style={{
              color: "#cbd5f5",
              textDecoration: "none",
            }}
          >
            Start scan
          </Link>

          <Link
            to="/my-scans"
            style={{
              color: "#cbd5f5",
              textDecoration: "none",
            }}
          >
            My scans
          </Link>
        </nav>
      </header>

      {/* Page content */}
      <main
        style={{
          paddingTop: HEADER_HEIGHT,
          minHeight: "100vh",
        }}
      >
        <Outlet />
      </main>
    </>
  );
}
