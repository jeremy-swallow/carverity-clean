// src/pages/InPersonDecisionWrapped.tsx
//
// PURPOSE:
// Visual wrapper for InPersonDecision.
// Applies verdict-colour emphasis ONLY to guidance & decision sections.
// Walk-away verdict is intentionally heavier and calmer.
// No logic, no data, no behavioural changes.

import InPersonDecision from "./InPersonDecision";

export default function InPersonDecisionWrapped() {
  return (
    <div className="relative">
      {/* ==================================================
          Verdict-colour emphasis for decision guidance only
      ================================================== */}
      <div
        className={[
          "relative",

          // Proceed (green)
          "[&:has(.text-emerald-300)]:border-l-4",
          "[&:has(.text-emerald-300)]:border-emerald-400/40",

          // Caution (amber)
          "[&:has(.text-amber-300)]:border-l-4",
          "[&:has(.text-amber-300)]:border-amber-400/40",

          // Walk-away (rose) — heavier + calmer
          "[&:has(.text-rose-300)]:border-l-6",
          "[&:has(.text-rose-300)]:border-rose-400/60",
          "[&:has(.text-rose-300)]:pl-5",

          // Base spacing & motion
          "pl-4 transition-all duration-300 ease-out",
        ].join(" ")}
      >
        <InPersonDecision />
      </div>
    </div>
  );
}
