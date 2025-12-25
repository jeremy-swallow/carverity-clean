import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

          {/* Logo + Title */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="CarVerity logo"
              style={{
                height: "44px",
                width: "auto",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
            <span className="text-xl font-semibold tracking-tight">
              CarVerity
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              to="/start-scan"
              className="text-sm font-medium hover:underline"
            >
              Start scan
            </Link>
            <Link
              to="/my-scans"
              className="text-sm font-medium hover:underline"
            >
              My scans
            </Link>
          </nav>

        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
