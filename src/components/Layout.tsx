// src/components/Layout.tsx

import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type ProgressMeta = {
  label: string;
  index: number; // 0-based
  total: number;
};

function getInPersonProgressMeta(pathname: string): ProgressMeta | null {
  // Keep this list short and “human” (not every micro-step)
  const steps: Array<{ match: (p: string) => boolean; label: string }> = [
    {
      match: (p) => p === "/scan/in-person/start",
      label: "Start",
    },
    {
      match: (p) => p === "/scan/in-person/vehicle-details",
      label: "Vehicle",
    },
    {
      match: (p) => p === "/scan/in-person/photos",
      label: "Photos",
    },
    {
      match: (p) => p.startsWith("/scan/in-person/checks"),
      label: "Checks",
    },
    {
      match: (p) => p === "/scan/in-person/summary",
      label: "Summary",
    },
    {
      match: (p) => p.startsWith("/scan/in-person/analyzing"),
      label: "Analysing",
    },
    {
      match: (p) => p.startsWith("/scan/in-person/results"),
      label: "Report",
    },
    {
      match: (p) => p === "/scan/in-person/negotiation",
      label: "Negotiation",
    },
  ];

  const idx = steps.findIndex((s) => s.match(pathname));
  if (idx === -1) return null;

  return {
    label: steps[idx].label,
    index: idx,
    total: steps.length,
  };
}

function formatCredits(n: number | null) {
  if (n == null) return "—";
  const safe = Math.max(0, Math.floor(n));
  return String(safe);
}

/* =========================================================
   Layout
========================================================= */

export default function Layout() {
  const [hasActiveScan, setHasActiveScan] = useState(false);

  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  const [session, setSession] = useState<
    Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] | null
  >(null);

  const [authReady, setAuthReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const isLoggedIn = Boolean(session);

  const progressMeta = useMemo(() => {
    return getInPersonProgressMeta(location.pathname);
  }, [location.pathname]);

  const progressPercent = useMemo(() => {
    if (!progressMeta) return null;
    // index 0 => ~10%, final => 100%
    const raw =
      progressMeta.total <= 1
        ? 100
        : ((progressMeta.index + 1) / progressMeta.total) * 100;
    return clamp(Math.round(raw), 5, 100);
  }, [progressMeta]);

  /* -------------------------------------------------------
     Auth + credits (best-practice, resilient)
     - Keeps UI from "flashing logged out"
     - Avoids stale credit writes if refresh races
  ------------------------------------------------------- */

  const refreshCounter = useRef(0);

  async function refreshAuthAndCredits() {
    const callId = ++refreshCounter.current;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (callId !== refreshCounter.current) return;

      if (error) {
        console.warn("[Layout] getSession error:", error);
      }

      const nextSession = data.session ?? null;
      setSession(nextSession);
      setAuthReady(true);

      if (!nextSession) {
        setCredits(null);
        setCreditsLoading(false);
        return;
      }

      setCreditsLoading(true);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", nextSession.user.id)
        .single();

      if (callId !== refreshCounter.current) return;

      if (profileError) {
        console.warn("[Layout] Failed to fetch credits:", profileError);
        setCredits(null);
        setCreditsLoading(false);
        return;
      }

      setCredits(typeof profile?.credits === "number" ? profile.credits : 0);
      setCreditsLoading(false);
    } catch (e) {
      if (callId !== refreshCounter.current) return;
      console.warn("[Layout] refreshAuthAndCredits error:", e);
      setCreditsLoading(false);
      setAuthReady(true);
    }
  }

  useEffect(() => {
    refreshAuthAndCredits();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshAuthAndCredits();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If Stripe returns you to /pricing?success=1&restore=1
  // do an extra refresh loop so it never "feels logged out".
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const restore = params.get("restore") === "1";

    if (!restore) return;

    let cancelled = false;

    async function restoreLoop() {
      const delays = [0, 250, 600, 1100, 1700, 2400];

      for (const ms of delays) {
        if (cancelled) return;

        if (ms > 0) {
          await new Promise((r) => setTimeout(r, ms));
        }

        await refreshAuthAndCredits();
      }
    }

    restoreLoop();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  /* -------------------------------------------------------
     Resume pill
  ------------------------------------------------------- */
  useEffect(() => {
    const progress = loadProgress();
    setHasActiveScan(Boolean(progress?.step));
  }, [location.pathname]);

  function handlePrimaryAction() {
    setMobileOpen(false);

    if (hasActiveScan) {
      const progress = loadProgress();
      const safeRoute = getSafeResumeRoute(progress?.step);
      if (safeRoute) navigate(safeRoute);
      return;
    }

    navigate("/scan/in-person/start");
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
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <NavLink
                to="/start-scan"
                className="text-slate-300 hover:text-white"
              >
                Start scan
              </NavLink>
              <NavLink
                to="/my-scans"
                className="text-slate-300 hover:text-white"
              >
                My scans
              </NavLink>
              <NavLink
                to="/pricing"
                className="text-slate-300 hover:text-white"
              >
                Pricing
              </NavLink>
              <NavLink
                to="/what-to-expect"
                className="text-slate-300 hover:text-white"
              >
                What to expect
              </NavLink>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {!authReady ? null : isLoggedIn ? (
                <>
                  <span className="text-xs text-slate-400">
                    Credits:{" "}
                    <span className="tabular-nums">
                      {creditsLoading ? "…" : formatCredits(credits)}
                    </span>
                  </span>

                  <NavLink
                    to="/account"
                    className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-xs"
                  >
                    Account
                  </NavLink>

                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-xs"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <NavLink
                  to="/signin"
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

          {/* Premium in-person progress indicator (only in scan corridor) */}
          {progressMeta && progressPercent !== null && (
            <div className="border-t border-slate-800/70">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      In-person inspection
                    </p>
                    <p className="text-sm text-slate-200 truncate">
                      Step {progressMeta.index + 1} of {progressMeta.total} ·{" "}
                      {progressMeta.label}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400 tabular-nums">
                      {progressPercent}%
                    </span>
                    <div className="w-28 sm:w-40 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Scrim */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile control surface */}
      <aside
        className={[
          "fixed top-0 right-0 z-50 h-full w-[88%] max-w-sm",
          "bg-slate-950 border-l border-slate-800",
          "transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800">
          <span className="font-semibold">CarVerity</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-8 space-y-10">
          {/* Identity */}
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Buyer inspection assistant
            </p>

            <p className="text-sm text-slate-300">
              Credits available:{" "}
              <span className="tabular-nums">
                {!authReady ? "…" : creditsLoading ? "…" : formatCredits(credits)}
              </span>
            </p>

            <p className="text-sm text-slate-300">
              Inspection in progress: {hasActiveScan ? "Yes" : "No"}
            </p>
          </div>

          {/* Primary action */}
          <button
            onClick={handlePrimaryAction}
            className="w-full rounded-xl bg-emerald-500/90 hover:bg-emerald-500 text-black font-semibold py-4 text-base transition"
          >
            {hasActiveScan ? "Resume inspection" : "Start new inspection"}
          </button>

          {/* Secondary navigation */}
          <nav className="space-y-3 text-sm text-slate-300">
            <NavLink
              to="/my-scans"
              onClick={() => setMobileOpen(false)}
              className="block py-1"
            >
              My scans
            </NavLink>
            <NavLink
              to="/pricing"
              onClick={() => setMobileOpen(false)}
              className="block py-1"
            >
              Pricing
            </NavLink>
            <NavLink
              to="/what-to-expect"
              onClick={() => setMobileOpen(false)}
              className="block py-1"
            >
              What to expect
            </NavLink>
          </nav>

          {/* Account / Sign in */}
          {authReady && (
            <div className="pt-6 border-t border-slate-800 space-y-3 text-sm text-slate-400">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/account");
                    }}
                    className="block"
                  >
                    Account
                  </button>
                  <button onClick={handleLogout} className="block">
                    Log out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/signin");
                  }}
                  className="block"
                >
                  Sign in
                </button>
              )}
            </div>
          )}

          {/* Mobile footer links */}
          <div className="pt-6 border-t border-slate-800 space-y-3 text-xs text-slate-500">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <NavLink
                to="/terms"
                onClick={() => setMobileOpen(false)}
                className="hover:text-slate-200 underline underline-offset-4 decoration-white/10 hover:decoration-white/30"
              >
                Terms &amp; Conditions
              </NavLink>
              <NavLink
                to="/privacy"
                onClick={() => setMobileOpen(false)}
                className="hover:text-slate-200 underline underline-offset-4 decoration-white/10 hover:decoration-white/30"
              >
                Privacy
              </NavLink>
              <a
                href="mailto:support@carverity.com.au"
                className="hover:text-slate-200 underline underline-offset-4 decoration-white/10 hover:decoration-white/30"
              >
                support@carverity.com.au
              </a>
            </div>

            <p className="leading-relaxed">
              CarVerity provides decision-support guidance — it does not diagnose
              mechanical or electrical faults.
            </p>
          </div>
        </div>
      </aside>

      {/* Header spacer: 14 + optional progress bar height */}
      <div className={progressMeta ? "h-[104px]" : "h-14"} />

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Site footer (premium + trust-building) */}
      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">CarVerity</p>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Decision-support guidance for documenting visible observations
                during an in-person vehicle inspection.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              <NavLink
                to="/terms"
                className="hover:text-white underline underline-offset-4 decoration-white/10 hover:decoration-white/30"
              >
                Terms &amp; Conditions
              </NavLink>
              <NavLink
                to="/privacy"
                className="hover:text-white underline underline-offset-4 decoration-white/10 hover:decoration-white/30"
              >
                Privacy
              </NavLink>
              <a
                href="mailto:support@carverity.com.au"
                className="hover:text-white underline underline-offset-4 decoration-white/10 hover:decoration-white/30"
              >
                support@carverity.com.au
              </a>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} CarVerity. All rights reserved.
            </p>

            <p className="text-xs text-slate-600">
              Not affiliated with any dealer, manufacturer, or inspection
              service.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
