# DexForge — Project Brief

## What this is
A consolidation of a large, elaborate Pokémon Google Sheet (1000+ dex entries across stats,
evolutions, typing, moves, ~500 manually-uploaded photos, plus lookup/compare/team tools,
a Cobblemon section, and a Pokémon Infinite Fusion section) into one modular web app.
**Goal: fully replace the Google Sheet.** No voice features on this project.

## Data sources
- **PokeAPI** (free, public REST API) for all base-game data: stats, typing, moves, abilities,
  evolution chains, natures, items, and sprites (this also solves the "only ~500 photos"
  problem — PokeAPI has art for all of them). Pull once, cache locally as JSON — don't hit
  the live API on every page load.
- **Python scraper** (requests + BeautifulSoup, Playwright if a page needs JS rendering) for
  data PokeAPI doesn't have: Cobblemon spawn data (biomes, levels, rarity, conditions, route
  spawn rates) and Pokémon Infinite Fusion specifics (fusion typing/stat rules, fusion sprites).
  This is a one-time (or occasional) scrape-and-cache job, not a live dependency.

## Persistence (saved lists/teams)
Long-term persistence, not just session-based. Approach: a lightweight local Python backend
(Flask or FastAPI) backed by **SQLite**, so saved lists/teams survive across sessions without
needing a hosted service or account. Pairs naturally with the scraper, since both run in Python.

## Core feature: list/team builder
User can save named "lists" of 6+ Pokémon to compare (e.g. "Gen 1 ghost types, head stat
total > 200" for Infinite Fusion). Needs:
- Manual add/remove
- Criteria-based auto-populate (filter by gen, type, stat thresholds, etc. — a small query
  builder)
- Modular column display — user picks which stats/fields show for a given list that day

## Staged scope

**Stage 1 (build first):**
- Unified data layer (PokeAPI pull + cache)
- Lookup tool, Compare tool (patterned after the user's previous project, Voice Dex)
- Typing calculator showing *specific* weaknesses/resistances (not just counts)
- Natures reference table
- Evolution items reference (what evolves with what item)
- Filterable list/team builder with save/load + criteria-based auto-populate

**Stage 2:**
- Infinite Fusion PC tracker + fusion calculator (head/body typing + stat-split math, custom
  typing-score formula)
- Cobblemon mounts + spawning tables
- Route spawn-rate lookup

**Stage 3 (hardest, do last):**
- Infinite Fusion gallery with interactive evolve/devolve on a fusion (e.g. click to evolve
  Pikachu within a Clefairy/Pikachu fusion and see Clefairy/Raichu recalculate live) — needs
  real state management
- Fusion sprite art (community fusion sprite sources exist but need reliable wiring)

## UI direction
Default theme: modern and vibrant, inspired by Pokémon GO and Let's Go Eevee — rounded cards
(not spreadsheet-style grids), big Pokémon art per entry, pill-shaped color-coded type badges,
soft shadows/depth, generous whitespace, playful rounded typography.

Build all components theme-agnostic (colors/borders/fonts driven by CSS variables) so a second
theme can be added later without rebuilding components: a "golden era" theme inspired by
DPP/BW/HGSS — crisp vector recreations of that era's dialogue-box chrome and high-contrast
stat bars, modern-retro rather than literal pixel art. Theme toggle is a stretch goal, not
required for Stage 1.

## Status
Planning complete. No code written yet. Next step: plan file/folder structure and confirm the
Stage 1 build order before writing anything.