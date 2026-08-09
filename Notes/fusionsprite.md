# DexForge — Fusion Sprite Scraping & Alternate Art: Implementation Guide

## Note: this revises earlier guidance
The original Fusion Comparison guide explicitly excluded community submission metadata
(artist credit, variant counts) as out of scope. That's now reversed based on the reference
images — credit and multi-variant selection are wanted features. Popularity/vote counts from
the source site are still out of scope; everything else in this doc supersedes that earlier note.

## Purpose
Every fusion in Infinite Fusion can have multiple community-submitted sprite variants, each by
a different artist. Wherever a fused sprite renders (Lookup-style fusion view, Fusion
Comparison, Fusion List), show a small numbered badge in the sprite's corner indicating how
many variants exist; clicking it opens an "Alternative Art" picker so the player can choose
which one displays.

## Scale problem to solve before scraping anything
Infinite Fusion has roughly 900+ fusable Pokémon, meaning the head×body combination space is
in the hundreds of thousands — the overwhelming majority of which have no submitted art at
all, and pre-scraping the entire space is neither feasible nor useful. **Scrape lazily, per
fusion, on first view — not in bulk upfront.** The first time a specific head+body pair is
looked up anywhere in the app, fetch that fusion's art from the source site, cache the result
(images + artist credits) locally, and serve from cache on every subsequent view. This mirrors
the "pull once, don't hit it live" philosophy used elsewhere, just triggered on-demand instead
of as a single big batch job, because the batch here would be enormous and mostly wasted.

## What to scrape, per fusion
- All available sprite variants for that head+body pair (not just the primary/first one)
- Each variant's artist username (as shown under each thumbnail in the reference images)
- A stable variant identifier matching the site's own scheme (e.g. `339.441`, `339.441a`,
  `339.441b`, `339.441c` — reuse this exact ID scheme rather than inventing a new one, since
  it's already how the source site organizes multiple submissions for one fusion)

## Storage — download, don't hotlink
Unlike the PokeAPI sprites (an official, stable CDN, fine to reference by URL directly),
fan-hosted fusion art doesn't come with the same reliability guarantee, and repeatedly hitting
a community site's image hosting for every page load isn't good etiquette even at low volume.
**Download and store images locally** (e.g. `data/cache/fusion_sprites/<head>.<body>/<variant_id>.png`)
rather than hotlinking, with the artist-credit metadata kept alongside as JSON in the same
folder or a small per-fusion manifest file. This also means the app keeps working if the
source site is ever slow, down, or reorganizes its URLs.

## Backend
- New endpoint, e.g. `GET /api/fusion/{head}/{body}/art` — checks local cache first; if this
  fusion has never been requested before, triggers the scrape-and-cache flow, then returns the
  variant list (image paths + artist credits). Subsequent requests are pure cache reads.
- The scrape-on-first-request path should be async/non-blocking if at all possible — the
  player shouldn't sit on a spinner waiting for a scrape when they're used to instant loads
  from cached data everywhere else in the app. Worth checking how this feels once built; if
  it's noticeably slow, a background-fetch-then-refresh pattern (show a fallback/placeholder
  immediately, swap in real art when the scrape finishes) may be worth adding.
- Track which variant is currently **selected** per fusion. For a one-off Comparison view this
  can just default to the first variant with no persistence needed. For a **Fusion List entry**
  (an actually-saved fusion), the selection should persist — add a `selected_variant` field to
  `FusionListEntry` alongside the existing head/body/orientation/position fields.

## UI
- **Corner badge**: small numbered circle/rounded-square in the sprite card's corner (matching
  the reference image's placement and general shape) showing the variant count. If a fusion
  has only one variant, the badge can either show "1" or be hidden entirely — hiding it for
  single-variant fusions is probably cleaner, since there's nothing to switch between.
- **Alternative Art modal**: grid of variant thumbnails, each labeled with its variant ID and
  artist credit underneath (reuse the reference image's layout: dex-pair ID + fusion name above
  each thumbnail, artist username below it with a small edit-pencil-style icon preceding the
  name — that's just a stylistic credit-line treatment, not an actual edit affordance, so don't
  wire it as clickable/editable). Clicking a thumbnail selects it and closes the modal (or shows
  a clear "selected" state plus an explicit close/confirm — either is fine, pick whichever
  feels less fiddly once built).
- Selecting a variant updates the displayed sprite immediately wherever that fusion is shown
  on the current page.
- **Fallback state**: some (likely most) fusions will have zero community art. Fall back to
  whatever default fusion-sprite behavior already exists (silhouette, or the head/body's own
  sprites overlaid — whatever the current placeholder is) and don't show the variant badge at
  all in that case.

## States
- **Loading (first-time scrape)**: show existing placeholder art with a subtle loading
  indicator rather than a blank card, per the async note above.
- **No art available**: no badge, standard fallback sprite.
- **Error** (scrape failed, source unreachable): fall back silently to the placeholder sprite
  rather than surfacing an error for what's a nice-to-have visual layer, not core data.

## Explicitly out of scope for this pass
- Vote counts, popularity ranking, or any other engagement metadata from the source site
- Uploading/contributing art back to the source community — this is read-only consumption
- Any art selection syncing across devices beyond what's already covered by the existing
  SQLite persistence — a `selected_variant` field just needs to behave like every other
  persisted field already in the app, nothing new architecturally