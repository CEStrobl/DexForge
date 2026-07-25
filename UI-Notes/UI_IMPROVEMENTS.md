## 🛑 P0: Critical Hierarchy & Layout Structural Changes

### 1. Reorganize Header & App-Level Actions

* [ ] **Extract CTAs from Entity Box:** Move `Favorite` and `+ Add to List` out of Charizard's hero container card. Place them as clean primary/secondary action buttons in the top page header area (to the right of the main title).
* [ ] **Fix Pagination Spatial Order:** Split the navigation arrows to flank the header instead of grouping them together (`#006 #005 #007`). Place `< #005 Charmeleon` on the far left and `#007 Blastoise >` on the far right to reflect natural spatial direction (left = back, right = forward).
* [ ] **Clarify Search Scope:** Update top search bar placeholder text from "Search Pokémon..." to **"Search Pokémon, moves, abilities..."** to reflect global scope, or move the input down into the page header as a local lookup filter.

### 2. Reposition Type Badges & Hero Anchor

* [ ] **Move Type Badges:** Shift `Fire` and `Flying` type badges from above the CTAs down to directly **underneath Charizard’s sprite** inside his hero card (matching the layout of cards in the evolution chain).
* [ ] **Add Hero Grounding Element:** Add a subtle ambient radial glow or soft pedestal shadow directly under Charizard's feet so the sprite doesn't feel isolated or floating inside the container.

---

## ⚡ P1: Important Design System & Badge Fixes

### 3. Overhaul Badge Color Tokens & Icons

* [ ] **Fix Text Contrast on Dark Badges:** Update text color on dark/muddy background badges (like `Rock ×4`) to **white (`#FFFFFF`)** for high contrast and legibility.
* [ ] **Standardize Icon Sets:** Align icon shapes across all badge types (Type badges, Weakness badges) so they use a consistent icon set rather than mixing outlined and filled shapes (e.g., diamonds vs. drops vs. pills).

### 4. Optimize Evolution Chain Whitespace

* [ ] **Fill Layout Grid:** Refactor the Evolution Chain container so cards expand evenly across the available horizontal space (`flex: 1` per card), eliminating empty whitespace on the right.
* [ ] **Add Contextual Details (Optional):** Enhance evolution cards with rich metadata (e.g., evolution triggers like "Level 36" or mini stat callouts) to better utilize expanded card width.

---

## 🎨 P2: Minor Visual Polish

### 5. Sidebar Navigation Accessibility

* [ ] **Increase Inactive Contrast:** Darken text and icon colors for inactive sidebar items (`Compare`, `Typing Calculator`, `Natures`, etc.) from light gray to `#4A5568` to meet accessibility standards against the white background.