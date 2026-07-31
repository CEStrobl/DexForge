# DexForge — Landing Page: Implementation Guide

## Purpose
The first thing you see on load shouldn't be a big empty hero with a tagline and a button —
that's a pattern for convincing a stranger to sign up for something, and you're not a
stranger to this app. The model here is closer to a wiki homepage (Bulbapedia/Serebii-style):
dense with actual content the moment it loads, so it feels alive and *yours* rather than
decorative. Every section below should be showing real data pulled from your own cache and
saved lists, not placeholder copy.

## Structural approach
- **No large hero banner.** Keep the top of the page compact — wordmark, and the same global
  search that already lives in the top bar elsewhere in the app. Don't duplicate it as a
  second giant search box; one search entry point, consistently placed.
- **Everything below is content**, arranged as a set of cards in the same visual language as
  the rest of the app (same card radius/shadow tokens, no new card style invented for this
  page specifically) — the landing page is a *view*, not a special zone with its own design
  language.

## Sections

### Featured Pokémon
A single spotlighted Pokémon card — sprite, name, type badges, and one stat or typing
highlight (e.g. its 4x weakness, or its BST) — that changes daily rather than being static.
Seed the pick deterministically by the day (so it's the same on every load today, different
tomorrow) rather than fully random per page-load — that "come back tomorrow for a different
one" quality is part of what makes a wiki homepage feel alive rather than decorative, and it's
free to compute client-side from the existing Pokémon cache with no backend call needed.
Clicking it goes straight to that Pokémon's Lookup page.

### At-a-glance stats
A compact strip of real numbers pulled from your own data: total Pokémon indexed, number of
saved lists, number of Fusion List entries, total entries across all lists combined. This is
the single biggest "wiki page, not business site" signal — a business landing page shows you
what the product *could* do; this shows you what you've *actually built* so far, immediately.
Small, understated presentation (a row of number+label pairs) — not styled as a big dashboard
KPI block, just a quiet fact strip.

### Tool cards — content previews, not just a menu
This is the part most worth getting right: instead of a generic icon+label grid duplicating
the sidebar nav, each tool's card shows a **live snippet of real content from that tool**, so
the homepage itself is browsable, not just a launcher:
- **Lookup**: no meaningful snippet without a "recently viewed" history (flag as future work
  if that doesn't exist yet — otherwise show the last-viewed Pokémon)
- **Compare**: skip a snippet here, or show a static "vs" illustration — there's no natural
  "recent" data to surface without view history either
- **Typing Calculator**: a rotating "type matchup of the day" fact (e.g. "Did you know: Ice
  is 4x weak to Fighting when paired with Rock") — same daily-seed approach as Featured
  Pokémon, computed from the existing type chart, no new data needed
- **Natures**: a rotating featured nature with its stat change shown
- **Evolution Items**: a rotating "did you know" teaser (e.g. "Auspicious Armor evolves
  Armarouge") — reuses the same reverse-index data already powering that page
- **List Builder**: show your 2 most recently modified saved lists by name, with entry counts
- **Fusion List**: show entry count and, if there's a most-recently-added fusion, its computed
  fused name/sprite as a teaser
Each card links through to its full tool. The point of the snippet isn't to replace the tool,
it's to make the homepage itself feel like it has something to say rather than being a static
directory.

### Rotating trivia (optional, lowest priority)
A small "did you know" strip unrelated to any specific tool — a fun fact drawn from your own
data (highest BST in the dex, rarest egg group, whatever's easy to compute from what's already
cached) that changes daily. Nice-to-have, not essential — build this last if at all, and skip
it entirely if the tool-card snippets above already make the page feel sufficiently alive.

## Navigation note
None of the sidebar screenshots so far show a "Home" entry — worth adding one at the top of
the nav (above Lookup) so there's an explicit way back to this page once you've navigated into
a tool, rather than relying on a logo click as the only way home.

## Styling
Same rule as every other page: pull all values from `styles/variables.css`, no hardcoded
colors/fonts. This page in particular should demonstrate the theme well, since it's the first
thing seen — but the *demonstration* is through real content density and card rhythm, not
through introducing page-specific colors or a hero treatment that the rest of the app doesn't
share.

## States
- **Loading**: skeleton cards for each section, same pattern as everywhere else.
- **Empty data** (e.g. no saved lists yet, brand-new install): tool cards should degrade
  gracefully to a plain label + short description instead of an awkward "0 lists" snippet —
  a fresh install still needs the page to feel inviting, not like it's reporting an absence.
- **Error**: standard error-card pattern, scoped per-section if possible (one section failing
  to load shouldn't take down the whole page — e.g. if the trivia fact fails to compute, the
  rest of the homepage should still render fine).

## Explicitly out of scope for this pass
- Any editing/writing from this page — it's a jumping-off point and a content surface, not a
  place to modify lists or Pokémon data directly
- Full "recently viewed" history tracking, if it doesn't already exist — the Lookup snippet
  above depends on it, so either scope that as a small prerequisite or drop that one snippet
  for now