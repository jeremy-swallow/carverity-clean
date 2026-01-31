// src/pages/InPersonResultsWrapped.tsx
//
// PURPOSE:
// Visual-only wrapper for InPersonResultsV2.
// - Verdict-colour emphasis
// - Perceptual severity weighting for AI bullets
// - Visual linking between AI interpretation and “Best next”
// ZERO logic. ZERO data. Core file untouched.

import InPersonResultsV2 from "./InPersonResults.v2";

export default function InPersonResultsWrapped() {
  return (
    <div className="relative group">
      {/* Page-level verdict accent */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-y-0 left-0 w-1 rounded-full
          group-[.text-emerald-400]:bg-emerald-400/60
          group-[.text-amber-400]:bg-amber-400/60
          group-[.text-rose-400]:bg-rose-400/75
        "
      />

      <div className="pl-4">
        <div
          className="
            group

            /* =================================================
               AI INTERPRETATION — bullets
            ================================================= */
            [&_section.rounded-xl]:relative
            [&_section.rounded-xl]:overflow-hidden

            [&_section.rounded-xl_ul]:space-y-2
            [&_section.rounded-xl_li]:relative
            [&_section.rounded-xl_li]:pl-5
            [&_section.rounded-xl_li]:list-none

            [&_section.rounded-xl_li]:before:absolute
            [&_section.rounded-xl_li]:before:left-0
            [&_section.rounded-xl_li]:before:top-[0.55em]
            [&_section.rounded-xl_li]:before:rounded-full
            [&_section.rounded-xl_li]:before:h-2
            [&_section.rounded-xl_li]:before:w-2
            [&_section.rounded-xl_li]:before:opacity-80

            /* First bullet — strongest */
            [&_section.rounded-xl_li:first-child]:before:h-2.5
            [&_section.rounded-xl_li:first-child]:before:w-2.5
            [&_section.rounded-xl_li:first-child]:before:opacity-100

            /* Last bullet — softer */
            [&_section.rounded-xl_li:last-child]:before:h-1.5
            [&_section.rounded-xl_li:last-child]:before:w-1.5
            [&_section.rounded-xl_li:last-child]:before:opacity-50

            /* Verdict colours for AI bullets */
            group-[.text-emerald-400]:[&_section.rounded-xl_li]:before:bg-emerald-400
            group-[.text-amber-400]:[&_section.rounded-xl_li]:before:bg-amber-400
            group-[.text-rose-400]:[&_section.rounded-xl_li]:before:bg-rose-400

            /* =================================================
               BEST NEXT — visual link
            ================================================= */
            [&_h2:contains('What will improve your position most')]:relative

            /* Left accent bar on Best Next card */
            [&_h2:contains('What will improve your position most')]:before:absolute
            [&_h2:contains('What will improve your position most')]:before:-left-4
            [&_h2:contains('What will improve your position most')]:before:top-0
            [&_h2:contains('What will improve your position most')]:before:bottom-0
            [&_h2:contains('What will improve your position most')]:before:w-1
            [&_h2:contains('What will improve your position most')]:before:rounded-full

            group-[.text-emerald-400]:[&_h2:contains('What will improve your position most')]:before:bg-emerald-400/70
            group-[.text-amber-400]:[&_h2:contains('What will improve your position most')]:before:bg-amber-400/70
            group-[.text-rose-400]:[&_h2:contains('What will improve your position most')]:before:bg-rose-400/80
          "
        >
          <InPersonResultsV2 />
        </div>
      </div>
    </div>
  );
}
