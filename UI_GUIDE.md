web application/stitch/projects/17331100717704595898/screens/f3420531cc2641bf93f4454fbc3ba84e or GoogleStitch.png
# Project Brief: DexForge - Modern Pokémon Data Dashboard

## 1. Project Overview
A high-fidelity, data-dense dashboard designed for Pokémon trainers to analyze species-specific data, including base stats, growth patterns, and evolution paths. The aesthetic focuses on a clean, modern minimalist "menu" vibe, drawing inspiration from contemporary Pokémon UI (Pokémon GO/Let's Go).

## 2. Design System: Kinetic Dex Light
The project utilizes a light-mode-first approach with high-contrast elements for readability.

- **Background:** Off-white surfaces (#F8F9FA) with soft-elevated containers.
- **Typography:** 
  - **Headlines:** Bold Sans-Serif (Inter) for impact.
  - **Body:** Clean Sans-Serif for readability.
  - **Data:** Monospace/Pixel fonts for IDs (#004) and numeric stat values.
- **Color Palette:**
  - **Primary:** High-contrast dark charcoal for primary text.
  - **Accents:** Pokémon Type-specific colors (e.g., Fire Red, Water Blue).
  - **Stat Bars:** Muted Teal (HP), Cyan (ATK), Amber (DEF), Light Blue (SP. ATK), Light Green (SP. DEF), Green (SPD).

## 3. Page Architecture (Desktop)
The layout is structured around a multi-column grid above a full-width interactive footer.

### A. Header (Global)
- **Top Navigation:** Brand logo (POKÉDEX PRO), primary navigation links (Dashboard, Teams, Market, Compare), and a right-aligned global search bar for species lookup.
- **Sidebar:** Navigation tabs (Home, Pokedex, Items, Moves, Battles) with a Master Trainer profile and a "Sync Data" call-to-action.

### B. Hero Section (Species Header)
- **Species Identity:** Displayed with National Dex number (#ID), Name (e.g., CHARMANDER), and rounded Type Pills.

### C. Main Dashboard (3-Column Layout)
- **Column 1 (Visuals):**
  - **3D Viewport:** A container hosting an interactive 3D model (Three.js) of the Pokémon.
  - **Attribute Grid:** Pills for Biome (Forest), Time (Day), Rarity (Uncommon), and Condition (Healthy).
- **Column 2 (Base Stats):**
  - **Stats Panel:** Color-coded horizontal progress bars for all six base stats (HP, Attack, Defense, Special Attack, Special Defense, Speed).
  - **BST Highlight:** A prominent "Base Stat Total" summary at the bottom.
- **Column 3 (Supplementary Data):**
  - **Abilities:** Dedicated section for primary and hidden abilities.
  - **Weaknesses:** Multiplier-based type badges showing vulnerabilities (e.g., Water x2).
  - **Growth Data:** Technical specs including Final Evolution, Growth Rate, and Capture Rate.

### D. Footer (Evolution Chain)
- **Evolution Sequence:** A full-width horizontal flow showing the progression (e.g., Charmander → Charmeleon → Charizard).
- **Interactive States:** Glowing border on the active Pokémon, with level requirements (e.g., Lv. 16) indicated on directional arrows.

## 4. Technical Constraints
- **Responsive Design:** The 3-column layout must collapse into a stacked single-column view for mobile devices.
- **Interactive Elements:** Smooth transitions for search focus, hover states on navigation, and animated 3D model viewport.
- **Accessibility:** High color contrast for data points and legible typography across all device types.