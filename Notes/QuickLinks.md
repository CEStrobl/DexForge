# DexForge — Quick Links: Implementation Guide

## Purpose
You're now using DexForge over the Google Sheet enough to notice a real friction point: jumping
back and forth between a handful of specific pages (a particular fusion comparison, a specific
saved list, a Pokémon you keep re-checking) using browser back/forward. Quick Links turns "the
page I keep returning to" into a one-click nav entry instead of a browser-history walk.

## What gets captured
The route plus its **core identifying params only** — not full transient UI state. E.g.:
- Lookup → the Pokémon slug
- Compare → both Pokémon slugs
- Fusion Comparison → both head/body slug pairs + orientation per side
- A saved list or Fusion List → which list ID
Things like current sort order, column picker selections, or open/collapsed card state are
**not** part of what's saved — pinning "jump back to this page's identity," not "restore this
exact moment of interaction." This matches the same philosophy already used for saved lists:
persist the minimum, rehydrate everything else live. Worth confirming this scope explicitly
before building, since it's tempting to capture more and it adds real complexity for a benefit
that's not obviously worth it (do you actually want a pinned list to remember it was sorted by
Speed last time, or is landing on the page with default state totally fine?).

## Storage
New table, e.g. `QuickLink`: label, route path, params (small JSON blob or query string),
position. Same "just enough to rehydrate, nothing snapshotted" pattern as `SavedListEntry` and
`FusionListEntry`.

## Trigger: the pin control
A single toggle control — pin/unpin — rather than a one-way "add" action, so it can live in one
consistent spot and reflect current state:
- Needs a consistent home visible on every page. Given the nav redesign we talked through
  earlier (search bar moving to a top bar) isn't built yet, this needs an interim placement in
  the current layout — most natural is near each page's title/header. If/when the top nav
  ships, this control likely relocates there alongside search, so don't over-invest in a
  placement that's explicitly temporary.
- Visual state should clearly show pinned vs not (filled vs outline icon is the standard
  pattern) — clicking it when already pinned removes it, rather than creating a duplicate
  entry. This also means the nav's own "+" doesn't need to be the only way to add one — the
  page-level pin control and a nav "+" (if you want one) both just toggle the same underlying
  state, not two different code paths.

## UI — left nav
- New **QUICK LINKS** section, same structural pattern as SAVED LISTS/FUSION LISTS (label,
  count, drag-reorder, per-row `⋮` menu for rename/remove). Where it sits relative to those two
  existing sections is a small call — I'd put it above them, since quick links are about
  frequent short-hop navigation (closer in spirit to the main tool nav above) while Saved
  Lists/Fusion Lists are curated content you deliberately built, but this is genuinely a
  preference call, not something with a clear right answer.
- **Default label**: auto-generated from the page's identity (e.g. "Lookup: Charizard",
  "Compare: Reshiram / Zekrom", "Fusion: Lapras+Typhlosion vs Typhlosion+Lapras") — editable via
  the same rename-pencil pattern already used on saved lists, in case an auto-generated label
  is too long or not descriptive enough for a specific case.
- Clicking a quick link navigates straight to that exact route+params — no intermediate step.

## Scope questions worth deciding before building
- **Cap on count / scroll behavior**: quick links are meant to stay small and fast to scan (a
  handful of "places I keep going back to"), not become a second saved-lists system. Worth
  either soft-capping the count with a nudge to remove old ones, or just letting the section
  scroll once it grows — either is fine, just pick one rather than letting it grow unbounded
  and start feeling cluttered.
- **Icon per entry**: a small type icon or thumbnail per quick link (matching what it points
  to) would help scanning at a glance, but adds real work for something this small — plain
  text labels are a reasonable, much simpler starting point.

## States
- **Empty** (no quick links saved yet): a brief inline hint under the section header (e.g.
  "Pin a page to see it here") rather than just an empty section with no explanation.
- **Stale link** (the underlying data a link points to no longer exists — e.g. an ID that was
  deleted): should fail gracefully into a normal "not found" state when clicked, same as
  navigating there any other way, not a broken nav item.

## Explicitly out of scope for this pass
- Capturing transient UI state beyond core route identity (see "What gets captured" above)
- Any sharing/export of quick links — this is personal navigation shorthand, not a feature
  meant to be sent to anyone else