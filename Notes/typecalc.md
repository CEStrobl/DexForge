# DexForge — Typing Calculator: Redesign Implementation Guide

## Purpose
The calculator already surfaces the right data — this is a visual hierarchy problem, not a
missing-feature problem. Currently the type name (something the player already knows, since
they picked it) is the loud, saturated element, and the multiplier (the actual answer they
came here for) is small and muted. The fix inverts that relationship and reduces visual noise,
without changing what data is shown or removing the per-type breakdown, which already works.

## Design principles driving these changes
- **Pre-attentive processing**: color/size/contrast register before conscious reading does.
  The multiplier should own that channel, not the type label — the multiplier is the answer,
  the type name is just identification.
- **Data-ink ratio**: every colored pixel should carry a distinct signal. Don't color-code the
  same fact twice (e.g. a tinted card background *and* a colored pill inside it saying the
  same thing) — pick one carrier per signal.
- **Suppress the uninformative majority**: roughly half of any type's matchups are neutral
  (1×) and carry no real information. Give them minimal visual weight — blank/muted — so
  actual exceptions (weaknesses, resistances, immunities) are what draws the eye.
- **Redundant coding, not color-only**: color-coding alone is a real accessibility gap for
  colorblind users. Magnitude should also read through size/weight/bold, so the hierarchy
  survives even without color.
- **Small multiples**: a consistent, repeated cell structure (same shape/size for all 18
  types) lets the eye learn the pattern once and scan fast — this part of the current layout
  already works and shouldn't be restructured, just re-weighted per the points above.

## Summary grid (Defense Stats section) — revised direction after prototyping
The banded "Weak To / Resists / Immune To" grouping got built and tested, and two real
problems came out of it: severity within a band was hard to distinguish (a 4× and a 2× sitting
in the same "Weak To" bucket read as similar weight), and burying neutral matchups at the
bottom made the page worse for a common real use case — checking your defense against one
*specific* type you're worried about, where you want to find that type fast regardless of its
multiplier. Grouping by severity actively works against fast lookup-by-type, since a type's
position moves depending on the combo selected instead of staying put.

**New direction: back to a full flat grid (all types shown, fixed positions), but with
sharper severity tiering and a cleaner, more "data sheet" aesthetic** — closer to a spec chart
or periodic table than either the original cluttered version or the banded one:
- **All types render in the same grid, every time**, same relative position regardless of
  which combo is selected — like a periodic table, where an element's position never moves.
  This is what actually serves "I want to check a specific type" — you learn the grid once and
  can jump straight to where a type lives instead of hunting through re-sorted bands.
- **Sharper tier distinction, this is the direct fix for the 4×-vs-2× complaint**: each
  multiplier tier gets a genuinely distinct color depth, not just a shared hue family —
  4× should look meaningfully more intense/saturated than 2×, ¼× more intense than ½×, and 0×
  (immune) gets its own distinct treatment entirely rather than reading as "just a darker
  resist." Pair this with a secondary weight cue (4× bolder/larger than 2×) so the tiers don't
  rely on color alone.
- **Neutral (1×) cells stay in the grid, in place, but visually quiet** — closer to reference
  image 2's approach: a blank or near-blank cell (thin border, muted/no fill, small type icon)
  rather than the fully-suppressed/hidden treatment from the banded version. Findable by
  position, doesn't compete for attention. This is the actual compromise between "decluttered"
  and "everything's still where I expect it."
- **Data-sheet aesthetic**: consistent fixed-size cells, thin uniform grid lines between them
  (rule lines, not card shadows/gaps — a grid should look assembled, not like a pile of
  separate cards), and tabular/monospace figures for the multiplier number so columns of
  numbers align cleanly the way a spec sheet's would. Reuse the existing `TypeBadge` icon at
  small size for identification within each cell rather than switching to text-only
  abbreviations — keeps this consistent with how type is represented everywhere else in the
  app, even while the overall feel leans more precise/technical than before.
- A small legend (tier → color swatch) near the grid reinforces the "reference chart" feel and
  gives the color-coding a documented meaning, rather than expecting it to be self-evident.

This replaces the banded/grouped approach entirely for the summary grid — the per-type
breakdown cards below (Bug/Dark style) are a different, separate piece of the page and their
guidance (below) is unaffected by this change.

## Per-type breakdown cards — keep the structure, quiet the noise
- **Drop the full-quadrant background tint.** Currently each quadrant (2× Damage To, ½ Damage
  From, etc.) has both a tinted background *and* colored pills inside — redundant ink per the
  data-ink principle. Keep the pills as the sole color carrier; let the card background stay
  neutral.
- **Sort within each quadrant by magnitude**, not alphabetically — 4× before 2×, ¼× before ½×
  — so severity reads top-to-bottom within a group, not just "these are all in the weak bucket
  somewhere."
- Keep the existing "Immune to" callout treatment (the dark full-width bar) — that one already
  has strong, singular visual weight and doesn't need changing.
- Two-column (Bug / Dark) side-by-side layout stays — this part of the current design already
  works, it's specifically the color/weight distribution inside each card that needs the fix.

## Scope question to confirm before building
Reference image 1 (the fan-made Gen 6 chart) shows **both** offensive ("2× Damage To") and
defensive ("½ Damage From") matchups per type. DexForge's calculator has always been scoped as
**defense-only** ("what is my type combo weak to"), matching the original ask from the very
start of this project. The per-type breakdown cards already show both directions for a
*single* type, so the offensive angle isn't entirely absent — but the top summary grid is
defense-only. Worth explicitly confirming that stays defense-focused rather than doubling the
grid to cover offense too, since offense-coverage would reintroduce exactly the density problem
this redesign is trying to solve.

## Styling
As always: values from `styles/variables.css`, no hardcoded colors. This page needs a slightly
richer palette than a simple two-tone (weak/resist) — likely 4 or 5 distinct color tokens for
4×/2×/neutral(muted)/½×/¼×/0×-immune — worth adding these as named tokens in the theme file
rather than one-off values in this page's components, since the golden-era theme will need its
own version of this same tier system later.

## States
Unchanged from current behavior — this is a visual redesign, not a new data flow. Loading/
empty/error states stay whatever they already are.

## Explicitly out of scope for this pass
- Adding offensive coverage to the summary grid (see scope question above)
- Any change to how Type 1/Type 2 selection works — this guide only touches presentation of
  the results, not the input controls