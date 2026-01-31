// src/pages/InPersonResultsWrapped.tsx
//
// PURPOSE:
// Visual-only wrapper for InPersonResultsV2.
// - Verdict-colour emphasis
// - Perceptual severity weighting for AI bullets
// - Visual linking between AI interpretation and “Best next”
// - Contextual copy under “Best next” header
//
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

            /* ===============================
               AI INTERPRETATION — bullets
            =============================== */
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

            [&_section.rounded-xl_li:first-child]:before:h-2.5
            [&_section.rounded-xl_li:first-child]:before:w-2.5
            [&_section.rounded-xl_li:first-child]:before:opacity-100

            [&_section.rounded-xl_li:last-child]:before:h-1.5
            [&_section.rounded-xl_li:last-child]:before:w-1.5
            [&_section.rounded-xl_li:last-child]:before:opacity-50

            group-[.text-emerald-400]:[&_section.rounded-xl_li]:before:bg-emerald-400
            group-[.text-amber-400]:[&_section.rounded-xl_li]:before:bg-amber-400
            group-[.text-rose-400]:[&_section.rounded-xl_li]:before:bg-rose-400

            /* ===============================
               BEST NEXT — visual + copy link
            =============================== */

            [&_section.rounded-2xl]:relative
            [&_section.rounded-2xl]:before:absolute
            [&_section.rounded-2xl]:before:left-0
            [&_section.rounded-2xl]:before:top-0
            [&_section.rounded-2xl]:before:bottom-0
            [&_section.rounded-2xl]:before:w-1
            [&_section.rounded-2xl]:before:rounded-full

            group-[.text-emerald-400]:[&_section.rounded-2xl]:before:bg-emerald-400/60
            group-[.text-amber-400]:[&_section.rounded-2xl]:before:bg-amber-400/60
            group-[.text-rose-400]:[&_section.rounded-2xl]:before:bg-rose-400/75

            /* Contextual copy under Best Next header */
            [&_h2[data-best-next-title]]:relative
            [&_h2[data-best-next-title]]:after:block
            [&_h2[data-best-next-title]]:after:mt-1
            [&_h2[data-best-next-title]]:after:text-xs
            [&_h2[data-best-next-title]]:after:font-normal

            group-[.text-emerald-400]:[&_h2[data-best-next-title]]:after:text-emerald-300
            group-[.text-emerald-400]:[&_h2[data-best-next-title]]:after:content-['This_is_the_single_action_most_likely_to_strengthen_your_position.']

            group-[.text-amber-400]:[&_h2[data-best-next-title]]:after:text-amber-300
            group-[.text-amber-400]:[&_h2[data-best-next-title]]:after:content-['Resolving_this_reduces_uncertainty_before_committing.']

            group-[.text-rose-400]:[&_h2[data-best-next-title]]:after:text-rose-300
            group-[.text-rose-400]:[&_h2[data-best-next-title]]:after:content-['If_this_cannot_be_resolved_cleanly,_walking_away_is_the_safer_option.']
          "
        >
          <InPersonResultsV2 />
        </div>
      </div>
    </div>
  );
}
