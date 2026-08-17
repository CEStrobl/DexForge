# DexForge — Search / Advanced Search Split: Implementation Guide

## Structure: two distinct entry points
- **Search** (the default, redesigned per the clothing-filter reference): fast, visual,
  click-to-toggle. No typing required for most filters.
- **Advanced Search** (the query-builder references): structured field/operator/value rows,
  chainable with AND/OR — the "UI-driven SQL" you described. Reached via a clearly-placed
  toggle/tab right next to Search, not buried — research backs this placement specifically:
  advanced search should sit close to basic search, available on request, not presented as
  the default experience.

## Part 1: Search (default) — chip-driven, no checkboxes
The reference image's real insight isn't "use pills instead of checkboxes" — it's that **the
toggle control and the filter control are the same thing.** There's no separate checkbox that
reveals a picker; clicking "Jackets" both selects it and shows it's selected, in one motion.
Apply that throughout:

- **Type** — stays exactly as it already is (chip grid, already doing this right).
- **Generation, Growth Rate, Egg Group, Legendary/Mythical** — become the same pattern:
  a row of clickable chips per category, toggle on/off by clicking, selected state shown by
  fill/border (matching the reference's checkmark treatment, restyled to DexForge's own chip
  language rather than copied verbatim).
- **Numeric filters (all 6 stats, BST, Catch Rate, Base Friendship, Egg Cycles, EV Yield)** —
  drop the checkbox-then-slider pattern entirely. Each is just a **range slider, always
  visible, defaulting to full range** (no filter applied) — exactly like the reference's Price
  Range. Dragging it *is* turning the filter on; there's no separate toggle to manage. This is
  both simpler to build and simpler to use than the collapse-until-checked approach from the
  earlier redesign pass — worth this correction now that a cleaner reference pattern exists.
- **Ability** — the one filter that can't be a chip grid (~300+ values, too many to lay out).
  Keep this as a searchable combobox: type to filter the list, click to add, selected
  abilities shown as small removable chips underneath — same visual chip language as
  everything else, just populated via search instead of a fixed grid.
- **Live results**: results/count update as filters change, no "Preview Matches" button click
  required — matches both the research (real-time evaluation beats explicit run) and the
  pattern already used in List Builder's Search tab.

## Part 2: Advanced Search — flat AND/OR chain, not full nested grouping
The two query-builder references show different levels of power: one supports nested
**Filter Groups** joined by AND/OR (groups of rules, each group internally AND/OR'd, then
groups combined) — genuinely powerful but meaningfully more complex to build and to use
correctly. The other uses a single flat list of rules under one global "Any/All" toggle —
simpler, but less expressive than what you described (mixing AND and OR in one query).

**Recommend starting with a middle ground: one flat list of rules, each joined to the next by
an explicit AND/OR selector** — no nested groups (yet). This directly matches what you asked
for ("[attribute] [is/not/has] [value], then [and/or] it from there") without taking on full
group-nesting complexity in a first pass:

```
[Field ▾] [Operator ▾] [Value] 
  AND ▾
[Field ▾] [Operator ▾] [Value]
  OR ▾
[Field ▾] [Operator ▾] [Value]
[+ Add Rule]
```

Evaluated strictly left-to-right (no operator-precedence cleverness) — the simplest mental
model, and honestly close enough to how most people actually think through a chain of
conditions. Full parenthetical grouping (the more powerful reference) is worth flagging as a
**stretch feature for later**, not part of this pass — most filtering needs won't require it,
and adding it retroactively to a flat-chain UI is a straightforward extension, not a rebuild.

### Field/Operator/Value behavior — operators depend on the field's type
This is the part that makes it feel "SQL-like" without requiring actual SQL knowledge — the
Value input and available Operators should change based on which Field is selected, same idea
as how a real query builder validates input, not free-text SQL:

| Field type | Fields | Operators | Value input |
|---|---|---|---|
| Categorical (single) | Growth Rate | is / is not | dropdown |
| Categorical (multi-capable) | Type, Generation, Egg Group, Ability | is / is not / has any of / has none of | chip multi-select (reuse the same searchable combobox from Search's Ability filter for Ability specifically) |
| Boolean | Legendary, Mythical | is | Yes/No toggle |
| Numeric | HP, Att, Def, SpA, SpD, Speed, BST, Catch Rate, Base Friendship, Egg Cycles, EV Yield | is / is not / greater than / less than / between | number input (two inputs for "between") |

Reuse the same underlying components across both Search and Advanced Search wherever possible
— the chip multi-select, the type dropdown, the number inputs — so this isn't two separate
component sets to maintain, just two different arrangements of the same pieces.

### Live evaluation here too
Same principle as Search: results update as rules are added/changed, not on a submit click.
A running match count next to the rule list (or wherever felt natural in Search) reinforces
that the query is "live" rather than something you build blind and then fire.

## What to explicitly avoid (per the research, common failure modes)
- Don't make Advanced Search the only way to filter, or hide it somewhere non-obvious — it
  should be one clear click away from Search at all times.
- Don't let an empty/no-match state look broken — a genuinely empty result set needs a clear
  "no Pokémon match these filters" message, not just a blank table.
- Both views need to work at narrow widths — chips wrapping and sliders/rule-rows stacking
  vertically, not a layout that only works desktop-wide.

## Explicitly out of scope for this pass
- Nested filter groups / parenthetical logic (flagged above as a later addition)
- Natural-language query input ("show me fast dragon types") — a genuinely different feature,
  not implied by what was asked here
- Saving an Advanced Search query as a reusable named filter — worth considering eventually,
  not part of this redesign