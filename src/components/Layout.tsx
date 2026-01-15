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
import { Menu, X } from "lucide-react";

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
     Auth + credits (Supabase is source of truth)
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
    { to: "/start-scan", label: "Start scan" },
    { to: "/my-scans", label: "My scans" },
    { to: "/pricing", label: "Pricing" },
    { to: "/what-to-expect", label: "What to expect" },
  ];

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "text-sm transition-colors",
      isActive
        ? "text-white font-semibold"
        : "text-slate-300 hover:text-white",
    ].join(" ");

  const mobileLinkClass = "text-slate-200 text-sm py-2";

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
                    className="px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-900/40 text-emerald-300 text-xs hover:bg-emerald-900/60"
                  >
                    Credits: {credits ?? "—"}
                  </button>

                  <NavLink
                    to="/account"
                    className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
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
                    className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <NavLink
                  to="/sign-in"
                  className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-semibold"
                >
                  Sign in
                </NavLink>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-800"
              aria-label="Open menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={mobileLinkClass}
                >
                  {item.label}
                </NavLink>
              ))}

              <div className="pt-3 border-t border-slate-800 space-y-2">
                {!authReady ? null : isLoggedIn ? (
                  <>
                    <div className="text-xs text-slate-400">
                      Credits: {credits ?? "—"}
                    </div>

                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/account");
                      }}
                      className={mobileLinkClass}
                    >
                      Account
                    </button>

                    {hasActiveScan && (
                      <button
                        onClick={handleResume}
                        className="w-full text-left text-amber-300 text-sm py-2"
                      >
                        Resume scan
                      </button>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left text-slate-200 text-sm py-2"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <NavLink
                    to="/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className="text-emerald-400 text-sm py-2 block"
                  >
                    Sign in
                  </NavLink>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="h-14" />

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
