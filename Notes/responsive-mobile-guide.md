# DexForge — Responsive / Mobile Layout: Implementation Guide

## What the screenshot shows
The left sidebar (search bar, Sign in button) is rendering at its full desktop width even on a
phone screen, eating roughly half the viewport. The main content is squeezed into what's left
and its heading text is wrapping character-by-character ("Welcon / to / DexFo...") — a strong
sign the content area has no responsive width/typography rules at all, it's just the desktop
layout getting crushed into a narrower space rather than actually adapting to it. This is a
global-chrome problem, not a page-by-page one — fixing the sidebar's mobile behavior alone will
likely resolve most of what's visible here immediately.

## Priority order
Fix in this order, since each step's impact is broader than the next:
1. **Sidebar/nav responsiveness** — affects every single page, highest-impact fix by far.
2. **Landing page** — the first thing anyone sees, and the specific page in the screenshot.
3. **Two-column layouts** (Compare, Fusion Comparison) — stack vertically on narrow screens.
4. **Tables** (List Builder, Fusion List, Move Pool) — most involved, tackle after the above.
5. **Everything else** (modals, forms, the Search/Advanced Search redesign in progress) — apply
   the same breakpoint rules established in steps 1-4 rather than solving each in isolation.

## Breakpoints
Establish once, reuse everywhere — don't let each page invent its own thresholds:
- **Mobile**: below ~640px
- **Tablet**: ~640-1024px
- **Desktop**: above ~1024px
These are starting points, not sacred — adjust based on what actually looks right once you're
testing on a real device, but pick specific numbers and keep them consistent as CSS custom
properties/breakpoint variables rather than magic numbers scattered per-component.

## 1. Sidebar → collapsible drawer on mobile/tablet
Below the tablet breakpoint, the sidebar should not render inline at all. Standard pattern:
- A hamburger/menu icon in the top bar opens the sidebar as an **off-canvas drawer** (slides
  in over the content, with a dimmed backdrop) rather than sharing horizontal space with it.
- Closing the drawer (tap the backdrop, tap an X, or select a nav item) returns to the
  content-only view.
- The global search bar (already in the top bar per earlier design) stays visible in the top
  bar at all times — it shouldn't be hidden inside the drawer, since it's the fastest way to
  get anywhof on mobile too.
- Quick Links and Saved/Fusion Lists (currently sidebar content) move inside this same drawer
  — don't invent a second mobile-only navigation pattern for them.

## 2. Landing page
- Hero section ("Welcome to DexForge...") needs responsive typography — either a fluid
  `clamp()`-based font size or explicit smaller sizes at the mobile breakpoint, so headline
  text doesn't force a narrow wrapping column no matter how much width it's actually given.
- The tool-card grid (Lookup/Compare/Typing Calculator/etc. preview cards) should collapse
  from its multi-column desktop layout to a **single column, stacked** on mobile — no
  horizontal scrolling for the primary nav-equivalent content.
- Featured Pokémon card and stats strip: verify these read fine full-width at mobile size:
  card content, not just the container, needs to reflow (e.g. stat strip wrapping to 2 rows
  instead of staying forced onto one).

## 3. Two-column comparison pages (Compare, Fusion Comparison)
These are explicitly designed as side-by-side columns on desktop (mirrored layout, "face-off"
feel). On mobile, **stack vertically** — Pokémon/fusion A's full card, then B's full card
below it, rather than squeezing two columns into a width that fits neither. The delta-stat
highlighting (colors/badges showing which side is ahead) should still work stacked — that's a
color/label thing, not dependent on side-by-side positioning.

## 4. Tables (List Builder, Fusion List, Move Pool)
Tables with many columns are the hardest responsive case here — pick one consistent approach
rather than solving each table differently:
- **Horizontal scroll within the table container** (simplest, keeps the table structure
  intact, common and acceptable pattern for data-dense tables) — the table itself doesn't
  reflow, but it's contained and scrollable rather than breaking the page's overall width.
- Alternative, more work but nicer on mobile: a **responsive card view** at narrow widths,
  reusing the same "card gallery" rendering List Builder already has as an alternate view —
  worth checking whether that toggle could simply become the *default* view below the mobile
  breakpoint instead of building a third table treatment from scratch.
Whichever approach, keep it consistent across List Builder, Fusion List, and Move Pool's table
— a player shouldn't have to learn three different "how tables behave on my phone" patterns.

## 5. General rules to apply everywhere
- **Touch targets**: buttons, chips, and row actions should be comfortably tappable — roughly
  44px minimum in either dimension is the standard baseline, worth checking anywhere a control
  was sized for a mouse cursor's precision rather than a fingertip.
- **Modals** (Alternative Art picker, any others): must fit and be usable within a small
  viewport — verify none assume desktop width/height headroom.
- **Filter panels** (the Search/Advanced Search redesign already in progress): make sure chip
  rows wrap naturally and range sliders/rule-builder rows stack rather than overflow — this
  was already flagged as a requirement in that guide, reinforcing it here since it's part of
  the same overall mobile pass.
- **No fixed pixel widths** on layout containers where a percentage/flex/grid approach would
  adapt naturally — the crushed-hero-text bug in the screenshot is a symptom of exactly this
  kind of fixed-width assumption somewhere in the layout chain.

## Verification
- Browser dev tools' device emulation covers most iteration, but **confirm on an actual phone**
  before calling any page done — that's how this specific bug was caught, and emulation doesn't
  always catch everything (real touch behavior, real font rendering, real viewport quirks).
- Check at minimum: a small phone (~375px), a standard phone (~390-430px), a tablet (~768px),
  and desktop — not just "mobile" and "desktop" as two binary states.
- Re-check the landing page specifically against this exact screenshot once the sidebar fix
  lands, since it may resolve on its own — confirm before spending extra effort re-solving
  something the nav fix already fixed.
