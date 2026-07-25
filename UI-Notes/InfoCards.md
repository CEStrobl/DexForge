## 🛑 P0: Card Architecture & Layout Restructuring

### 1. Remove Legacy Metadata Card

* [ ] **Deprecate Old Container:** Remove the current generic 4-item card (`Region`, `Capture Rate`, `Egg Group`, `Growth Rate`).

### 2. Implement 3-Card Grid System

* [ ] **Create Card Components:** Build three reusable card containers matching DexForge's card aesthetic (soft background fill, light drop shadows, rounded corners):
* **Card A:** `Training`
* **Card B:** `Breeding`
* **Card C:** `Pokedex Data`


* [ ] **Responsive Grid Layout:**
* **Desktop (`>1024px`):** Lay out the 3 new cards in a balanced 3-column row (or a 2-column stacked grid beneath the Hero card) so they maintain consistent height and alignment with the Base Stats / Abilities column.
* **Tablet/Mobile (`<1024px`):** Stack all three cards vertically (`flex-direction: column`) with standard 16px vertical spacing.



---

## ⚡ P1: Data Mapping & Metric Formatting

### 3. Build "Training" Card Data Structure

* [ ] **EV Yield:** Render primary effort value stat boosts (e.g., `3 Sp. Atk`).
* [ ] **Catch Rate:** Map the existing Capture Rate value (e.g., `45` or `5.9% with Pokeball at full HP`).
* [ ] **Growth Rate:** Map growth speed category (e.g., `Medium Slow`).
* [ ] **Base Friendship:** Display starting friendship stat value (e.g., `50 (normal)`).

### 4. Build "Breeding" Card Data Structure

* [ ] **Egg Group:** Map primary/secondary groups (e.g., `Monster, Dragon`).
* [ ] **Gender Ratio:** Display split percentage bar or text pill (e.g., `87.5% ♂ / 12.5% ♀`).
* [ ] **Egg Cycles:** Render base step/cycle requirements (e.g., `20 cycles`).
* [ ] **Avg Steps:** Calculate or display estimated hatching steps (e.g., `5,120 – 5,376 steps`).

### 5. Build "Pokedex Data" Card Data Structure

* [ ] **Species:** Render taxonomy classification string (e.g., `Flame Pokémon`).
* [ ] **Generation:** Render origin generation badge/text (e.g., `Generation I (Kanto)`).

---

## 🎨 P2: Visual Hierarchy & Label Formatting

### 6. Standardize Typography & Iconography

* [ ] **Section Headings:** Style card titles (`TRAINING`, `BREEDING`, `POKÉDEX DATA`) using small uppercase muted text (`font-size: 11px–12px`, `font-weight: 700`, `letter-spacing: 0.05em`) to match the existing card header design system.
* [ ] **2x2 Key-Value Alignment:** Within each card, arrange attributes in a clean 2x2 key-value grid system (`grid-template-columns: 1fr 1fr`).
* [ ] **Inline Vector Icons:** Pair each metadata label with a subtle, low-contrast 16px inline SVG icon (e.g., 🏋️/⚡ for EV Yield, 🥚 for Breeding, 📖 for Pokedex Data) to maintain visual continuity across the application.