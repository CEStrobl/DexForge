Here is a prioritized, step-by-step implementation guide to design and build the **Type Defenses** feature while seamlessly fitting the established visual language of DexForge.

---

## 🛑 P0: Layout & Collapsible Container Architecture

### 1. Build Collapsible Container Card

* [ ] **Match Layout Style:** Create a full-width container card at the bottom of the page (matching the **Evolution Chain** container style with soft rounded corners, light border, and subtle drop shadow).
* [ ] **Header Accordion Controls:** Add a card header titled **"TYPE DEFENSES"** in uppercase muted text (`font-size: 12px`, bold). Include a standard expansion chevron toggle (`▼` / `▲`) on the far right.
* [ ] **State Persistence:** Default the accordion state to collapsed on page load (to prevent vertical clutter) while preserving the user's toggle preference via `localStorage` or session state.

### 2. Single-Row Responsive Matrix Layout

* [ ] **Single Horizontal Row:** Arrange all 18 Pokémon types into a single horizontal flexbox/grid layout (`grid-template-columns: repeat(18, minmax(0, 1fr))`) instead of two stacked rows.
* [ ] **Overflow & Compact Mode:** On standard desktop viewports, set type cells to a compact width. Ensure mobile/narrow screens use a clean horizontal scroll container (`overflow-x: auto`) with scroll-snapping, or automatically stack into a 9×2 grid below `768px`.

---

## ⚡ P1: Design System Alignment & Type Typography

### 3. Replace Legacy Visuals with DexForge Tokens

* [ ] **Remove Heavy Table Lines:** Eliminate the harsh gray borders, drop shadows on text, and rigid table grids shown in the raw visual reference.
* [ ] **Align Badge Styling:** Style each type header cell using DexForge’s pill/badge aesthetic (rounded corners `border-radius: 6px–8px`, smooth flat background fills, white text `#FFFFFF`).
* [ ] **Use Full/Standard Type Labels:** If width permits on desktop, display standard type names (e.g., `NOR`, `FIR`, `WAT` or short 3-letter caps) matching the typography font family used across the app (`Inter` / `Plus Jakarta Sans`).

### 4. Normalize Effectiveness Multiplier Indicators

* [ ] **Hide Neutral Multipliers (`1×`):** Leave neutral cells (`1×`) visually empty with a light neutral background (`#F8FAFC`) to reduce visual noise and highlight only meaningful defenses/weaknesses.
* [ ] **Semantic Multiplier Styling:** Apply clear color coding and typography to defense values:
* **Super Effective (`2×`, `4×`):** Soft red/orange background fill with bold white or dark red text.
* **Not Very Effective (`½×`, `¼×`):** Soft green background fill with bold white or dark green text.
* **Immune (`0×`):** Muted dark gray/slate background fill with bold white text.



---

## 🎨 P2: Micro-Interactions & Usability Refinements

### 5. Interactive Highlights & Tooltips

* [ ] **Hover Column Highlights:** Highlight the entire active column (Type Badge + Multiplier Cell) on hover with a subtle border stroke or background glow to make scanning single types effortless.
* [ ] **Explanatory Tooltips:** Add hover/tap tooltips on each column (e.g., *"Takes 2× damage from Fire moves"*) so users don't have to decipher raw numbers in isolation.
* [ ] **Subheading Description:** Add a subtle, muted subtitle underneath the section title matching the app style: *"Damage multipliers when Charizard is attacked."*