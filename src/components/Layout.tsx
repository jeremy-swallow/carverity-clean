// src/components/Layout.tsx

import {
  Outlet,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { loadProgress } from "../utils/scanProgress";
import { loadCredits } from "../utils/scanCredits";
import { supabase } from "../supabaseClient";
import { signOut } from "../supabaseAuth";

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
  const [credits, setCredits] = useState(0);
  const [session, setSession] = useState<
    Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] | null
  >(null);
  const [authReady, setAuthReady] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const isLoggedIn = Boolean(session);

  /* -------------------------------------------------------
     Auth state (SESSION is source of truth)
  ------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setCredits(data.session ? loadCredits() : 0);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setCredits(newSession ? loadCredits() : 0);
      }
    );

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

    navigate(safeRoute);
  }

  async function handleLogout() {
    try {
      await signOut();
    } finally {
      navigate("/", { replace: true });
    }
  }

  function handleCreditsClick() {
    navigate("/pricing");
  }

  function handleSignIn() {
    navigate("/sign-in");
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

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */

  return (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col">
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="bg-slate-950/85 backdrop-blur border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            {/* LOGO */}
            <NavLink to="/" className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight">
                CarVerity
              </span>
            </NavLink>

            {/* DESKTOP NAV */}
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

            {/* DESKTOP ACTIONS */}
            <div className="hidden md:flex items-center gap-3">
              {!authReady ? null : isLoggedIn ? (
                <>
                  <button
                    onClick={handleCreditsClick}
                    className="px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-900/40 text-emerald-300 text-xs hover:bg-emerald-900/60 transition"
                  >
                    Scan credits: {credits}
                  </button>

                  {hasActiveScan && (
                    <button
                      onClick={handleResume}
                      className="px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-semibold shadow hover:bg-amber-300"
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
                <button
                  onClick={handleSignIn}
                  className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-semibold"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="h-14" />

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
