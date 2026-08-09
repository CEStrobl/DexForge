# DexForge — Split "Search" into Its Own Page

## What's changing
The criteria-filter tool currently living as a pill/tab inside List Builder (alongside Lists)
becomes its own top-level nav entry and route. This is a relocation, not a rebuild — the
filter form, live-preview results table, and column picker all move as-is.

## What to do
- New top nav entry "Dex Filter", own route
- Remove the Lists/Search pill toggle from the Lists page — Lists becomes single-purpose
  (view/manage saved lists), same as it already mostly is
- Move the filter-form + results-table components to the new page's route; no internal
  logic changes needed

## The one real thing to solve: "Add to List" needs an explicit target now
Right now, "Add to List" likely relies on there being a Lists tab right next door with an
implied "current list" context. Once these are separate pages, that implicit connection is
gone — clicking "Add to List" needs its own explicit list picker (a small dropdown/modal:
pick an existing list, or create a new one on the spot) rather than assuming a destination.
This is the one piece that isn't just a copy-paste move.

## Everything else
No new states, no new styling — same components, same error/loading/empty behavior they
already have today.