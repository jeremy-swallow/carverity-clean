import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div
      className="min-h-screen text-foreground flex flex-col"
      style={{
        background: `
          radial-gradient(1200px 500px at 10% -10%, rgba(72, 255, 199, 0.12), transparent),
          radial-gradient(900px 400px at 90% 0%, rgba(87, 167, 255, 0.10), transparent),
          linear-gradient(180deg, hsl(240 10% 7%) 0%, hsl(240 10% 4%) 100%)
        `,
      }}
    >
      {/* HEADER */}
      <header className="border-b bg-card/70 backdrop-blur-sm">
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

      {/* PAGE CONTENT */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* TRUST FOOTER */}
      <footer className="border-t bg-card/70 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            CarVerity helps buyers make more informed vehicle decisions. We
            never sell user data, and reports are stored securely and only for
            your use. Insights are guidance only and should be considered along
            with a professional mechanical inspection.
          </p>

          <div className="mt-3 text-xs text-muted-foreground/80 flex flex-wrap gap-4">
            <span>© {new Date().getFullYear()} CarVerity</span>
            <span>Privacy-minded by design</span>
            <span>Independent & unbiased</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
