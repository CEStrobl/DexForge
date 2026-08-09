# DexForge — Fusion Comparison Tool: Implementation Guide

## Purpose
A plain (single-Pokémon) Compare page now exists and works — two search bars, an identity
card per side (sprite, name, dex number, type badges, Favorite/Add to List), a Base Stats
section with delta highlighting already built (colored +/- badges next to each stat, on the
side that's behind), and a Type Defenses grid starting below. Fusion Comparison is this same
page's fusion-specific sibling, not a rebuild: same card language, same delta-stat treatment,
same section rhythm — the only real difference is that each side takes a **head + body pair**
instead of a single Pokémon, and computes a fused result before rendering into that identical
layout. Evolve/devolve on either slot is already implemented per-side, so this doc no longer
needs to scope that as future work — it's done; what's left is wiring the fusion math and
adapting the existing Compare layout to a two-Pokémon-per-side input.

## Game mechanics needed
Two calculations feed this whole feature, and both need to be scraped/verified from a primary
source (the Infinite Fusion wiki's fusion mechanics page) rather than assumed, since fan
calculator sites online disagree with each other on the exact stat weighting:
- **Stat formula:** each fused stat is a weighted average of head and body, with the dominant
  side contributing roughly two-thirds and the recessive side one-third. The commonly-cited
  split is: HP/Sp.Atk/Sp.Def lean toward the **head**, Attack/Defense/Speed lean toward the
  **body** — but verify this against the wiki directly during scraping, since it's the one
  fact this entire feature is built on and third-party sources aren't consistent on it.
- **Type inheritance:** primary type from head, secondary type from body — with a documented
  edge case where if the body's secondary type would duplicate the head's primary type, the
  body contributes its *primary* type instead (e.g. two Poison-types fusing don't end up
  double-Poison). This edge case needs explicit test cases once scraped.
- **Ability inheritance:** which of the four possible abilities (head regular ×2, body
  regular ×2 slots, hidden ability from one side) actually carry over — this needs its own
  scrape-and-confirm pass, don't guess at it.
- **Evolve/devolve:** no new scraping needed here — this reuses the evolution-chain data
  already in `data/cache/evolution_chains.json` from the PokeAPI scraper. Evolving/devolving
  a head or body just substitutes a different base Pokémon into that slot and reruns the
  fusion calc; the fusion math itself doesn't need to know a species just evolved. Devolving
  needs the reverse-direction lookup (species → what it evolved from), which may not exist
  yet if the cache was only ever queried forward — check `cache_reader.py` for this before
  assuming it's free.

## Web scraping
Extends `scraper/infinite_fusion/` (currently an empty Stage-2 placeholder per CLAUDE.md).
- Source: Infinite Fusion wiki (mechanics/FAQ pages) for the formulas above, plus a fusion
  sprite source for the mixed-sprite art.
- Same pattern as the PokeAPI scraper: one-time (or occasional) pull, normalize, cache to
  `data/cache/` as JSON — the app should never compute against a live wiki fetch.
- Since the actual math is a formula (not per-Pokémon data), most of what's scraped here is
  the *ruleset* itself, which then gets encoded as logic in a new backend service — the
  sprite mapping is the one piece that's genuinely per-fusion data worth caching.
- **Revised** (superseded by the Fusion Sprite Scraping guide): artist credit and multi-variant
  art *are* now in scope — see `fusion-sprite-scraping-implementation-guide.md` for the full
  design. Popularity/vote counts from the source site are still out of scope; credit and
  variant selection are not.

## Backend
- New service, e.g. `backend/app/services/fusion.py` — computes stats/typing/abilities for
  a given head+body pair using the verified formulas, reusing the existing
  `services/typing.py` effectiveness logic once the fused type is determined (don't
  duplicate the weakness/resistance math, just feed it the fusion's resulting type pair).
- New endpoint, e.g. `GET /api/fusion/compare?head_a=...&body_a=...&head_b=...&body_b=...`
  (or a POST if the two-fusion payload gets unwieldy as a query string) returning both
  fusions' full computed data in one response, so the frontend does a single fetch rather
  than two round trips it then has to reconcile.
- Since any single change (swap orientation, evolve/devolve one slot) only affects one of the
  four Pokémon slots, consider whether the frontend should re-request the full comparison each
  time or whether the fusion-calc logic is cheap enough that it doesn't matter — likely the
  latter, given it's pure math over already-cached data, but worth confirming once evolve/
  devolve is wired up and the interaction feels sluggish or not.

## UI layout
This is now about adapting a real, already-built page rather than designing from scratch.
Keep any new pieces structural, not stylistic — the Google Stitch theme governs actual
colors/fonts/radii.

- **Reuse the existing Compare page component tree directly**: identity card, delta-highlighted
  stat rows, and Type Defenses grid are already built and working — don't recreate them.
  The one structural change each needs is swapping the single "Search Pokémon" input for a
  **head + body pair** of inputs per side (reuse List Builder's Search-tab autocomplete
  pattern for these, same as a plain Pokémon search).
- **Identity card**: currently shows sprite/name/dex/type badges/Favorite/Add to List for one
  Pokémon. For a fusion, this becomes the *computed fusion's* identity — fused name, fused
  sprite, fused typing — sourced from the head+body pair rather than a single lookup. Whether
  Favorite/Add to List apply the same way to a fusion (vs. to a Pokémon) is worth deciding
  now: "PC Heads" and "PC Bodies" already exist as saved lists per the sidebar, so Add to
  List for a fusion likely means something different from Add to List for a single Pokémon —
  flag this for the Fusion PC conversation rather than resolving it here.
- **Swap-orientation control**: new, since the plain Compare page has no equivalent — a
  small toggle per side near the identity card that flips that side's head/body and
  recomputes.
- **Base Stats / delta highlighting**: no new component needed — this already exists and
  already does exactly what a fusion comparison needs (colored +/- badge next to the value
  on the side that's behind, per stat, plus a BST total row). Feed it the fused stats instead
  of a single Pokémon's stats and it should work unchanged.
- **Type Defenses**: same story — reuse as-is, fed the fused type pair instead of a single
  Pokémon's type(s).
- **Abilities section**: doesn't exist on the plain Compare page yet (per the screenshot, it
  isn't visible above the fold, but confirm whether it's below). If it's not already part of
  Compare, this is the one genuinely new section Fusion Comparison needs — Regular/Hidden
  columns per side, per the original ability-inheritance mechanics above.

## Interaction
- Primary entry point is this page itself: the player types/selects head and body for each
  of the two fusions directly, independent of any other tool.
- Every control — orientation swap, evolve, devolve, on either slot of either side —
  recalculates and re-renders that side's stats/typing/abilities immediately. No manual
  "recalculate" step.
- Evolve/devolve is already built — worth a quick check that it already disables/hides
  itself at the top or bottom of an evolution line (rather than erroring), since that's the
  one edge case most likely to have been missed in an early implementation.
- Clicking either fusion's identity card could reasonably navigate back into the Fusion
  Calculator pre-loaded with that pairing — nice-to-have, not required for a first pass.

## States
- **Loading:** skeleton version of both columns, consistent with the skeleton-card pattern
  used elsewhere (e.g. Evolution Items) rather than a spinner.
- **Invalid/incomplete pairing** (e.g. only one fusion resolved successfully): show what
  loaded and a clear inline error for the side that didn't, rather than failing the whole page.
- **Error:** same error-card pattern used across the rest of the app.

## Explicitly out of scope for this pass
- Popularity/vote counts from the source community site — not applicable to a personal tool.
  Artist credit and variant art *are* in scope; see the Fusion Sprite Scraping guide.
- Move pool comparison — this page is stats/typing/abilities only; move pool belongs to the
  Fusion Calculator or a future dedicated page, not folded in here
- Editing/saving a comparison as a List Builder entry — comparisons are transient views, not
  persisted objects, at least for this first version