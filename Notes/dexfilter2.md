# DexForge — Dex Filter Redesign: Implementation Guide

## The actual problem
Not information density in the "too much text" sense — it's **reserved empty space**. Every
filter (Generation, Base Stat Total, Weakness, Ability, all 6 Stats, all of "More Filters")
occupies a full grid cell sized to accommodate content that only appears once toggled on. With
most filters off (the common state — nobody starts a session with 15 filters pre-enabled), the
page is mostly blank cells with a checkbox floating in each. Type is the one filter that
already works well, precisely because it's not follows this reserve-space-just-in-case pattern
— it's a compact chip grid that's fully "on" all the time.

## The fix: collapse-until-active, everywhere
Every filter becomes a single compact row by default — checkbox/toggle + label, minimal
height, nothing else. **Only when a filter is checked does it grow** to show its actual control
(range slider, chip picker, dropdown), and it grows *inline*, directly under that one row —
not into a pre-allocated section of the grid. An unused filter and a used filter should look
completely different in footprint, not just in checkbox state.

- **Numeric-range filters** (Base Stat Total, all 6 individual Stats, Catch Rate, Base
  Friendship, Egg Cycles, EV Yield): one shared compact range-slider component, reused across
  all of them rather than each having its own bespoke control. Appears only when that filter's
  row is checked.
- **Enum/multi-select filters** (Generation, Ability, Egg Group, Growth Rate): a small
  dropdown or compact chip-picker appears inline when checked — same idea as Type's existing
  chip grid, just triggered per-filter instead of always visible.
- **Boolean filters** (Legendary, Mythical): these need nothing extra when checked — no reason
  to reserve space for content that will never appear. These are the simplest case and should
  visually read as the lightest-weight rows on the page.
- **Type** stays exactly as it is — it's the one filter already doing this correctly (always
  visible, dense chip grid, no wasted reserved space around it).

## Layout structure
- Drop the current 4-column grid-of-cells approach. Replace with a **single-column list of
  compact filter rows** (or two columns of rows if horizontal space allows, but rows — not a
  sparse grid where most cells are empty).
- The three current sections (Search Filters / Stats / More Filters) can stay as collapsible
  section headers if that grouping is still useful for scanning, but each section's *content*
  should be the compact row list above, not another instance of the current spaced-out grid.
  If, once built, having three separate accordion sections still feels repetitive, consider
  flattening into one continuous list — worth judging once the row-collapse fix alone is in
  place, since that might resolve most of the "nightmare" feeling on its own.
- **Applied filters summary**: with filters now collapsing to almost nothing when off, it
  becomes harder to see at a glance what's currently active while scrolling past a long list.
  Worth adding a small persistent strip (top of the panel, or a sidebar if space allows)
  showing active filters as removable chips — "Type: Dark, Fairy ×" style — so the current
  filter state is visible without scanning the whole list for checked boxes.

## Secondary, optional improvement worth considering
"Preview Matches" is currently a button you click to see results. Given the app's established
pattern elsewhere (List Builder's Search tab already does live-preview results as you type/
toggle criteria), consider making this live too — results update as filters change, no button
needed. This isn't required to fix the layout problem, but it's a natural pairing: a compact
filter panel plus instant feedback reinforces "this is fast and light" instead of "fill out a
form, then submit." Flag as optional — worth doing if it doesn't complicate performance, not
worth blocking the layout fix on.

## What stays unchanged
- All existing filter logic/criteria matching — this is purely a presentation change
- The Type chip component — reuse as-is, it's already the right pattern
- Column picker / results table on the results side of Dex Filter, if that's a separate area
  from what's shown in this screenshot — not in scope here unless it has the same
  reserved-space problem