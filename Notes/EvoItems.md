# DexForge — Evolution Items Page: UI Guide

## Purpose
Answer the question that started this whole feature: **"I just found a Sun Stone — what can I
evolve with it?"** This is a reverse lookup (item → eligible Pokémon), not a forward one, which
should drive the layout: items are the primary browsing unit, not Pokémon.

## Data
Backed by `GET /api/evolution-items`, which returns the reverse index built in
`evolution_items.py` from the cached evolution-chain data. Shape per item:
```
{
  "item": "Sun Stone",
  "sprite_url": "...",
  "evolutions": [
    { "from": "Gloom", "to": "Bellossom", "note": null },
    { "from": "Sunkern", "to": "Sunflora", "note": null }
  ]
}
```
**Scope note to confirm with backend:** "evolution items" isn't one clean category in the source
data — it spans *used* items (Sun Stone, consumed on use), *held* items that evolve on level-up
(Razor Claw, King's Rock), and *held-during-trade* items (Metal Coat, DeepSeaTooth). Recommend
including all three under one page with a small "how it's used" tag per item (Use / Hold+Level /
Hold+Trade) rather than trying to exclude the held-item cases — a player finding a Metal Coat has
the same question as one finding a Sun Stone.

## Status
Built and mostly working — item cards render with sprite, name, and the eligible Pokémon list
inline (no collapse/expand needed in practice, simpler than originally spec'd, which is fine).
The one real problem: **default ordering is flat alphabetical by item name**, which means the
first things a player sees on opening the tab are whatever starts with A (Auspicious Armor,
per the screenshot) rather than anything actually useful to lead with. The fix below replaces
ordering, not the card design.

## The ordering fix
Alphabetical-by-item-name has no relationship to how a player actually thinks about this page.
Nobody opens Evolution Items already knowing the item's exact name — they know roughly *what
kind* of item they're holding. Group by the "how it's used" tag that was already spec'd (Use /
Hold+Level / Hold+Trade) and render it as **persistent section headers**, not a filter the
player has to apply — the grouping itself is the fix, not an optional view:

1. **Use** (consumed on use — stones like Sun Stone, Fire Stone, and similar) first: the most
   recognizable, most commonly-found category, so it should be what a player sees immediately.
2. **Hold + Level Up** next.
3. **Hold + Trade** last — and worth verifying before finalizing this order: does Infinite
   Fusion even support trade evolutions in a single-player context, or do trade-only items get
   an alternate solo trigger in this specific game? If trade isn't really a thing here, either
   relabel this category to match however the game actually handles it, or fold it into
   Hold+Level Up — don't keep a "Hold+Trade" section that doesn't apply to how the game is
   actually played.

Within each section, alphabetical by item name is completely fine as the secondary sort —
alphabetical only failed as the *primary* grouping, not as a tiebreaker once items are already
bucketed into something meaningful.

The existing search/filter bar stays, but its "how it's used" pill toggle should now act as a
**jump-to-section / narrow-to-section** control layered on top of the always-visible grouped
view, rather than being the only way to see items organized sensibly.

## Layout
- **Grid of item cards**, not a dense table — matches the Lookup/Compare visual language (big
  art, rounded cards) rather than the old spreadsheet's row-based feel.
- Each card, collapsed state: item sprite, item name, small "how it's used" pill (Use /
  Hold+Level / Hold+Trade), and a count badge ("3 Pokémon").
- Click/tap a card to expand it in place, revealing the eligible Pokémon as a horizontal
  scroll (desktop) / stacked list (mobile) of mini `PokemonCard` components — reuse the existing
  component from `common/`, don't build a new one.
- Each mini Pokémon entry shows: sprite, name, from → to (e.g. "Gloom → Bellossom"), and any
  `note` (e.g. "female only," "daytime only," "holding item") if present — this is where the
  game's fiddly evolution conditions surface, so don't drop them even though they're minor.

## Interaction
- One item expanded at a time is fine, or allow multiple — multiple is nicer here since the
  point is scanning across items ("I have three different stones, what do each of them do"),
  not focusing on one.
- Clicking a Pokémon entry inside an expanded card navigates to that Pokémon's Lookup page —
  this page should feel like a doorway into Lookup, not a dead end.
- Search/filter bar at the top: filter by item name (text), plus the "how it's used" control
  described in the ordering fix above (jump-to-section, not the only path to organization).
  No stat-range filtering needed here — that's List Builder's job, not this page's.

## States
- **Loading:** skeleton item cards (match count to a reasonable default, e.g. 6), not a spinner —
  consistent with how Lookup/Compare should be handling their own loads.
- **Empty search result:** friendly empty state ("No items match '____'"), not a blank grid.
- **Error:** same error-card pattern as the rest of the app, not a page-level crash.

## Styling
Pull all color/spacing/radius values from `styles/variables.css` — no hardcoded hex values in
this page's components, since the golden-era theme will need to reskin these cards later without
touching layout code. Item "how it's used" pills should reuse the same pill shape/treatment as
`TypeBadge`, just with a neutral (non-type) color token, so the visual language stays consistent
across the app rather than introducing a new badge style just for this page.

## Explicitly out of scope for this page
- Stat comparisons between pre/post evolution (that's Compare's job — link there instead of
  duplicating it)
- Any write/edit capability — this is a static reference page, not something tied to
  List Builder or SQLite
- Non-item evolutions (friendship, trade without item, level-up without item) — those don't
  belong on an *items* page; if a general "evolution methods" reference ever gets built, it's a
  separate page, not a scope expansion of this one