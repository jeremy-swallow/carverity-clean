// src/components/Layout.tsx

import {
  Outlet,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { loadProgress } from "../utils/scanProgress";
import { supabase } from "../supabaseClient";
import { signOut } from "../supabaseAuth";
import {
  Menu,
  X,
  PlayCircle,
  CreditCard,
  User,
  LogOut,
} from "lucide-react";

/* =========================================================
   Helpers
========================================================= */

const VALID_RESUME_ROUTES = new Set([
  "/scan/in-person/start",
  "/scan/in-person/vehicle-details",
  "/scan/in-person/photos",
  "/scan/in-person/checks/around",
  "/scan/in-person/checks/inside",
  "/scan/in-person/checks/drive",
  "/scan/in-person/summary",
  "/scan/in-person/preview",
  "/scan/in-person/unlock",
  "/scan/in-person/results",
  "/scan/in-person/negotiation",
]);

function getSafeResumeRoute(step?: string): string | null {
  if (!step) return null;
  if (VALID_RESUME_ROUTES.has(step)) return step;
  return "/scan/in-person/summary";
}

/* =========================================================
   Layout
========================================================= */

export default function Layout() {
  const [hasActiveScan, setHasActiveScan] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [session, setSession] = useState<
    Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] | null
  >(null);
  const [authReady, setAuthReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const isLoggedIn = Boolean(session);

  /* -------------------------------------------------------
     Auth + credits
  ------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    async function refresh() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session ?? null);

      if (data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", data.session.user.id)
          .single();

        setCredits(profile?.credits ?? 0);
      } else {
        setCredits(null);
      }

      setAuthReady(true);
    }

    refresh();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* -------------------------------------------------------
     Resume pill
  ------------------------------------------------------- */
  useEffect(() => {
    const progress = loadProgress();
    setHasActiveScan(Boolean(progress?.step));
  }, [location.pathname]);

  function handleResume() {
    const progress = loadProgress();
    const safeRoute = getSafeResumeRoute(progress?.step);
    if (!safeRoute) return;
    setMobileOpen(false);
    navigate(safeRoute);
  }

  async function handleLogout() {
    try {
      await signOut();
    } finally {
      setMobileOpen(false);
      navigate("/", { replace: true });
    }
  }

  /* -------------------------------------------------------
     Nav config
  ------------------------------------------------------- */
  const navItems = [
    { to: "/start-scan", label: "Start scan", icon: PlayCircle },
    { to: "/my-scans", label: "My scans", icon: PlayCircle },
    { to: "/pricing", label: "Pricing", icon: CreditCard },
    { to: "/what-to-expect", label: "What to expect", icon: PlayCircle },
  ];

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "text-sm transition-colors",
      isActive
        ? "text-white font-semibold"
        : "text-slate-300 hover:text-white",
    ].join(" ");

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */

  return (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col">
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="bg-slate-950/85 backdrop-blur border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <NavLink to="/" className="font-semibold">
              CarVerity
            </NavLink>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={desktopLinkClass}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-3">
              {!authReady ? null : isLoggedIn ? (
                <>
                  <button
                    onClick={() => navigate("/account")}
                    className="px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-900/40 text-emerald-300 text-xs"
                  >
                    Credits: {credits ?? "—"}
                  </button>

                  <NavLink
                    to="/account"
                    className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-xs"
                  >
                    Account
                  </NavLink>

                  {hasActiveScan && (
                    <button
                      onClick={handleResume}
                      className="px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-semibold"
                    >
                      Resume scan
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-xs"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <NavLink
                  to="/sign-in"
                  className="px-3 py-1 rounded-full bg-emerald-600 text-black text-xs font-semibold"
                >
                  Sign in
                </NavLink>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile scrim */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={[
          "fixed top-0 right-0 z-50 h-full w-[82%] max-w-sm bg-slate-950 border-l border-slate-800",
          "transform transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800">
          <span className="font-semibold">Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-6 space-y-6">
          <nav className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-slate-200 text-sm py-2"
                >
                  <Icon size={18} className="text-slate-400" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {authReady && isLoggedIn && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="text-xs text-slate-400">
                Credits: {credits ?? "—"}
              </div>

              <button
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/account");
                }}
                className="flex items-center gap-3 text-sm text-slate-200 py-2"
              >
                <User size={18} className="text-slate-400" />
                Account
              </button>

              {hasActiveScan && (
                <button
                  onClick={handleResume}
                  className="flex items-center gap-3 text-sm text-amber-300 py-2"
                >
                  <PlayCircle size={18} />
                  Resume scan
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-sm text-slate-200 py-2"
              >
                <LogOut size={18} className="text-slate-400" />
                Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="h-14" />

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
