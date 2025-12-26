import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children?: ReactNode;
}

// Placeholder user + account info (later: hook into real auth)
const USER_NAME = "Jeremy Swallow";
const USER_EMAIL = "jeremy@example.com";
const USER_ROLE = "Founder";

// Placeholder product state (later: from backend)
const SCAN_CREDITS = 3;          // change to 0/1 to see low-credit warning
const UNREAD_NOTIFICATIONS = 2;  // change as needed

/** Generate initials from a full name */
function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}

/** Generate a stable gradient colour from the name */
function colorFromName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;

  return `
    linear-gradient(
      135deg,
      hsl(${hue}, 70%, 55%),
      hsl(${(hue + 30) % 360}, 70%, 45%)
    )
  `;
}

export default function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const location = useLocation();

  const initials = getInitials(USER_NAME);
  const avatarStyle = { background: colorFromName(USER_NAME) };

  const isLowCredits = SCAN_CREDITS <= 1;

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    `
      relative pb-1 text-sm tracking-wide transition
      ${isActive(path)
        ? "text-indigo-300"
        : "text-slate-300 hover:text-white"
      }
    `;

  const underlineClass = (path: string) =>
    `
      absolute left-0 -bottom-0.5 h-[2px] rounded-full
      transition-all duration-300
      ${isActive(path)
        ? "w-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.7)]"
        : "w-0 bg-white/60 group-hover:w-full"
      }
    `;

  function handleBuyCredits() {
    alert("🛒 Buy Credits flow coming soon — this will open Stripe checkout.");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">

      {/* GLASS NAVBAR */}
      <header className="
        sticky top-0 z-50
        border-b border-white/10
        bg-slate-900/70 backdrop-blur-xl
        shadow-[inset_0_1px_0_rgba(255,255,255,.08)]
      ">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="CarVerity logo" className="h-8" />
            <span className="font-bold text-lg tracking-wide">CarVerity</span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex gap-6 items-center">

            <div className="group relative">
              <Link to="/start-scan" className={linkClass("/start-scan")}>
                Start scan
              </Link>
              <span className={underlineClass("/start-scan")} />
            </div>

            <div className="group relative">
              <Link to="/my-scans" className={linkClass("/my-scans")}>
                My scans
              </Link>
              <span className={underlineClass("/my-scans")} />
            </div>

            <div className="group relative">
              <Link to="/pricing" className={linkClass("/pricing")}>
                Pricing
              </Link>
              <span className={underlineClass("/pricing")} />
            </div>

            <div className="group relative">
              <Link to="/faq" className={linkClass("/faq")}>
                FAQ
              </Link>
              <span className={underlineClass("/faq")} />
            </div>

            <div className="group relative">
              <Link
                to="/credits-history"
                className={linkClass("/credits-history")}
              >
                Credits history
              </Link>
              <span className={underlineClass("/credits-history")} />
            </div>

            {/* CREDITS BADGE (GREEN OR AMBER WHEN LOW) */}
            <span
              className={`
                px-3 py-1 rounded-full text-xs font-medium shadow-sm border
                ${isLowCredits
                  ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
                  : "bg-emerald-500/15 text-emerald-300 border-emerald-400/20"
                }
              `}
            >
              {isLowCredits
                ? `Low credits — ${SCAN_CREDITS} remaining`
                : `Scan credits: ${SCAN_CREDITS}`}
            </span>

            {/* BUY CREDITS BUTTON */}
            <button
              onClick={handleBuyCredits}
              className="
                px-3 py-1 rounded-full text-xs font-semibold
                bg-indigo-500/20 text-indigo-200
                border border-indigo-400/30
                hover:bg-indigo-500/30
                transition
              "
            >
              Buy more credits
            </button>

            {/* NOTIFICATION BELL */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="
                  relative h-9 w-9 rounded-xl
                  border border-white/20
                  bg-white/10 hover:bg-white/20
                  flex items-center justify-center
                  transition
                "
              >
                <span className="text-lg">🔔</span>

                {UNREAD_NOTIFICATIONS > 0 && (
                  <span
                    className="
                      absolute -top-1 -right-1
                      h-4 min-w-4 px-1 flex items-center justify-center
                      rounded-full bg-red-500 text-[10px] font-bold
                    "
                  >
                    {UNREAD_NOTIFICATIONS}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className="
                    absolute right-0 mt-2 w-64
                    bg-slate-900/90 backdrop-blur-xl
                    border border-white/10 rounded-xl
                    shadow-lg
                  "
                >
                  <div className="px-3 py-2 text-sm font-medium">
                    Notifications
                  </div>

                  <div className="h-px bg-white/10" />

                  <div className="p-3 text-sm text-slate-300">
                    • Scan report ready for your last vehicle
                    <br />
                    • You earned 1 bonus scan credit
                  </div>

                  <div className="h-px bg-white/10" />

                  <button
                    className="w-full px-3 py-2 text-xs text-indigo-300 hover:bg-white/10"
                    onClick={() => alert("Notifications page coming soon")}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>

            {/* AVATAR + ACCOUNT DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="
                  h-9 w-9 rounded-full
                  border border-white/20
                  flex items-center justify-center
                  text-sm font-semibold
                  text-white shadow
                  hover:scale-[1.03] transition
                "
                style={avatarStyle}
              >
                {initials}
              </button>

              {accountOpen && (
                <div
                  className="
                    absolute right-0 mt-2 w-56
                    bg-slate-900/90 backdrop-blur-xl
                    border border-white/10 rounded-xl
                    shadow-lg
                  "
                >
                  <div className="px-3 pt-3">
                    <div className="text-sm font-medium">{USER_NAME}</div>
                    <div className="text-xs text-slate-400">{USER_EMAIL}</div>

                    <span
                      className="
                        inline-block mt-2 px-2 py-1 text-[10px]
                        rounded-md bg-indigo-500/20 text-indigo-300
                        border border-indigo-400/20
                      "
                    >
                      {USER_ROLE}
                    </span>
                  </div>

                  <div className="h-px bg-white/10 my-2" />

                  <nav className="flex flex-col p-2 text-sm">
                    <Link
                      to="/account"
                      className="px-3 py-2 rounded hover:bg-white/10"
                      onClick={() => setAccountOpen(false)}
                    >
                      My account
                    </Link>

                    <Link
                      to="/my-scans"
                      className="px-3 py-2 rounded hover:bg-white/10"
                      onClick={() => setAccountOpen(false)}
                    >
                      My scans
                    </Link>

                    <Link
                      to="/credits-history"
                      className="px-3 py-2 rounded hover:bg-white/10"
                      onClick={() => setAccountOpen(false)}
                    >
                      Credits history
                    </Link>

                    <button
                      className="px-3 py-2 text-left rounded hover:bg-white/10 text-slate-300"
                      onClick={() => alert("Settings coming soon")}
                    >
                      Settings
                    </button>

                    <button
                      className="px-3 py-2 text-left rounded hover:bg-red-500/20 text-red-300"
                      onClick={() => alert("Sign out coming soon")}
                    >
                      Sign out
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="
              md:hidden p-2 rounded-xl
              border border-white/20
              bg-white/5 hover:bg-white/10
              transition
            "
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-900/80 backdrop-blur-xl">
            <nav className="flex flex-col p-3 gap-3">

              <span
                className={`
                  px-3 py-2 rounded-lg text-xs font-medium border
                  ${isLowCredits
                    ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-400/20"
                  }
                `}
              >
                {isLowCredits
                  ? `Low credits — ${SCAN_CREDITS} remaining`
                  : `Scan credits: ${SCAN_CREDITS}`}
              </span>

              <button
                onClick={handleBuyCredits}
                className="
                  px-3 py-2 rounded-lg text-xs font-semibold
                  bg-indigo-500/20 text-indigo-200
                  border border-indigo-400/30
                  hover:bg-indigo-500/30
                  transition
                "
              >
                Buy more credits
              </button>

              <Link
                to="/start-scan"
                onClick={() => setMenuOpen(false)}
              >
                Start scan
              </Link>

              <Link
                to="/my-scans"
                onClick={() => setMenuOpen(false)}
              >
                My scans
              </Link>

              <Link
                to="/pricing"
                onClick={() => setMenuOpen(false)}
              >
                Pricing
              </Link>

              <Link
                to="/faq"
                onClick={() => setMenuOpen(false)}
              >
                FAQ
              </Link>

              <Link
                to="/credits-history"
                onClick={() => setMenuOpen(false)}
              >
                Credits history
              </Link>

              <Link
                to="/account"
                onClick={() => setMenuOpen(false)}
              >
                Account
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
