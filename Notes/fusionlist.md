# DexForge — Fusion List: Implementation Guide

## Purpose
PC Heads and PC Bodies (already built) are **candidate pools** — single-Pokémon lists ranked
by their projected contribution as a head or body (the HEAD TOTAL / BODY TOTAL columns in the
screenshot are "what this Pokémon *would* contribute," not an actual fusion). Fusion List is
the next layer up: an actual roster of **assembled fusions** — head+body pairs you've committed
to — which is the original "IF PC" tracker from CLAUDE.md's Stage 2 scope (the spreadsheet tab
where you logged Pokémon actually caught and fused, not just candidates).

## Reuse from the existing Lists tab (List Builder)
Everything structural carries over directly — this should feel like the same tool, not a new
one:
- Header rename pattern (pencil icon) and delete icon
- Labels: removable chips (Attacker/Fast/etc.) with "+ Add Label" — same label system, applied
  to fusion rows the same way it's applied to single-Pokémon rows now
- Sortable/draggable row table with row numbers
- Shared column-picker pill pattern (Type/Total/Ability/stats/+More)
- Per-row `⋮` menu pattern, extended for fusion-specific actions (below)

## What's different
- **Add flow**: "Add a Pokémon by name" becomes "Add a Fusion" — a head + body pair, not a
  single search. Reuse the head/body input pair component from Fusion Comparison directly
  rather than building a second version of the same input.
- **Row identity**: each row shows the *computed fused* sprite and name (same computation
  Fusion Comparison already does for its identity cards), not a single Pokémon's sprite/name.
- **Columns**: PC Bodies' projection columns (HEAD TOTAL/BODY TOTAL — "potential if used this
  way") don't apply to a real fusion, since the fusion already exists. Swap them for the
  fusion's *actual* computed stats: fused HP/Att/Def/SpA/SpD/Speed/Total, fused type, fused
  ability — same fields Fusion Comparison already computes, just rendered as a table row
  instead of a comparison card. Column picker options update to match.
- **Per-row menu**: evolve/devolve needs to apply per-slot now (a fusion has two evolvable
  halves), so this becomes two actions — "Evolve/Devolve Head" and "Evolve/Devolve Body" —
  rather than the single generic evolve action a Pokémon-only row has. Also worth adding a
  **swap orientation** action per row (reusing Fusion Comparison's toggle), so a saved fusion
  can be flipped without deleting and re-adding it.

## Backend/storage
- New table pair, e.g. `FusionList` / `FusionListEntry`, alongside the existing
  `SavedList`/`SavedListEntry` — each entry stores **head slug + body slug + orientation +
  position** only. Same philosophy as the existing lists: nothing else persisted, full stats
  rehydrate live from cache + the fusion-calc service on load, so a Fusion List never goes
  stale even after a scraper re-run.
- Reuse the fusion-calc service already built for Comparison to compute each row's display
  values — this is the second consumer of that service (Comparison being the first), which is
  a good sign it was scoped at the right level rather than embedded directly in the
  Comparison page.

## Open questions worth deciding before building
- **Seeding from PC Heads/PC Bodies**: should there be a shortcut like "use this Pokémon as a
  body in a new fusion" directly from a PC Bodies row, linking the candidate pools to the
  actual roster? Nice workflow, but real added complexity — worth deciding whether v1 needs
  it or whether starting a Fusion List entry from a plain search is enough for now.
- **Labels sharing**: confirm the label system isn't scoped per-list-type in the data model
  in a way that would stop the same "Attacker"/"Fast" labels from being usable on both a
  single-Pokémon list and a Fusion List — for consistency they should be one shared set, not
  two parallel ones.

## States
Same pattern as the existing Lists tab: skeleton rows while loading, an empty state when a
new Fusion List has no entries yet, and the app's standard error-card pattern on failure.