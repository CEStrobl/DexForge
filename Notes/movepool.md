# DexForge — Move Pool Section (Lookup Page): Implementation Guide

## Purpose
Add a move-pool view to each Pokémon's Lookup page — what it learns, by what method, at what
level/TM, across generations. This is the "Moves" tab from the original spreadsheet (name,
type, category, power, accuracy, PP, effect) finally connected to *which Pokémon actually
learns each move and when*, which the spreadsheet never had wired together. The reference
image (Bulbapedia-style) is good functionally but visually dense — the goal here is the same
information with DexForge's existing, calmer card/table language, not a port of that exact look.

## Data — this needs new scraping, not just new UI
The current cache (`pokemon.json`, `species.json`, etc.) doesn't include per-generation
learnsets. PokeAPI *does* have this data (each Pokémon's `moves` field includes
`version_group_details` — learn method, level learned at, and which version group/generation
it applies to), it's just not pulled yet. Two things to add to `scraper/pokeapi/`:
- Extend `fetch_all.py` to pull each Pokémon's `moves` data, not just species/stats
- A new `moves.json` cache — one entry per move with its own type/category/power/accuracy/PP/
  effect text (the "core" move data the original spreadsheet's Moves tab had), separate from
  the per-Pokémon learnset data, so move details aren't duplicated across every Pokémon that
  learns them

## Scope question to confirm before building
Which generations actually matter here? Building for all 9 like the reference image is a lot
of surface area, and DexForge's data has generally been scoped around what's actually usable
in Infinite Fusion, which is unlikely to need the full modern range. Worth deciding the target
generation window explicitly (e.g. "through whichever generation Infinite Fusion's base game
data reflects") rather than defaulting to "all of them" just because the reference does.

## Layout
- New collapsible section on the Lookup page, same collapsible-card pattern already used for
  Type Defenses — collapsed or expanded by default is a small open call, but consistency with
  that existing pattern matters more than which default is picked.
- **Generation selector**: a compact tab/segmented control at the top of the section, scoped
  to whatever generation range gets confirmed above — simpler than the reference's long row of
  numbered links, since DexForge likely doesn't need all 9.
- **One unified, sortable table instead of the reference's separate Level-up/TM tables.** Add
  a **Method** column (Level / TM / Egg / Tutor) alongside a Level column (blank when the
  method isn't level-up) — this is the actual "simpler" translation of the reference: same
  information, one table instead of two side-by-side ones, filterable by method if that's
  useful, rather than requiring two separate reads to see everything a Pokémon can learn.
  Reuse the sortable-column header pattern already built for List Builder's table — don't
  reimplement sorting from scratch.
- **Columns**: Method, Level/TM#, Move (name), Type (reuse `TypeBadge`, small), Category
  (small icon — physical/special/status, one consistent icon set, not text), Power, Accuracy,
  PP. Keep it to one row per learnable move per generation — no wrapped multi-line cells.
- **Effect text**: don't give it a permanent column (that's what makes the reference feel
  dense) — put it behind a click/expand on the move name, or a tooltip, consistent with
  however "extra detail on demand" is already handled elsewhere in the app if that pattern
  exists yet.

## Interaction
- Switching generation re-queries/re-filters the same table rather than navigating away —
  should feel instant, since this is all cached local data, no network round trip per switch.
- Sorting behaves like the existing List Builder table sort (click header, toggle direction).
- Clicking a move name could reasonably show its effect text inline (see above) — doesn't need
  to navigate anywhere else; a move isn't a page-level entity elsewhere in the app yet, so
  don't build a "move detail page" just for this.

## Styling
Same rule as everywhere: `styles/variables.css` tokens only. Category icons should read
clearly at small size — reuse whatever icon treatment already exists for something similar
(e.g. if the app has any existing small-icon-in-a-circle pattern) rather than introducing a
new icon style just for this section.

## States
- **Loading**: skeleton table rows, consistent with the rest of the app.
- **No moves for a selected generation** (a Pokémon that doesn't exist yet in an older gen,
  or has no learnset data for some other reason): a clear "not available in this generation"
  message, not an empty-looking broken table.
- **Error**: standard error-card pattern.

## Explicitly out of scope for this pass
- Egg moves and Tutor moves, if that data turns out to be significantly messier to scrape than
  Level/TM — fine to ship Level+TM first and add these as a fast follow rather than blocking
  the whole section on the hardest data to get right
- A dedicated "move detail" page — effect text inline/on-click is enough for now
- Any interaction with List Builder or move-based filtering there — this section is read-only
  reference data on the Lookup page, same boundary as every other reference feature so far