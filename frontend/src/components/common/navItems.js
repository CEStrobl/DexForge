import { GitCompare, Calculator, Heart, Package, Filter } from 'lucide-react';

// Shared between TopBar (desktop icon strip) and Sidebar (mobile drawer) — the strip hides
// below the tablet breakpoint since there's no room for it next to search + the hamburger
// button, so the drawer is where these become reachable on mobile instead.
export const NAV_ITEMS = [
  { to: '/compare', label: 'Compare', icon: GitCompare, color: 'var(--nav-compare)' },
  { to: '/typing-calculator', label: 'Typing', icon: Calculator, color: 'var(--nav-typing)' },
  { to: '/natures', label: 'Natures', icon: Heart, color: 'var(--nav-natures)' },
  { to: '/evolution-items', label: 'Items', icon: Package, color: 'var(--nav-evolution-items)' },
  { to: '/dex-filter', label: 'Filter', icon: Filter, color: 'var(--nav-dex-filter)' },
];
