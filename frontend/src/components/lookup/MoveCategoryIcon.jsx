import { Sword, Sparkles, Shield } from 'lucide-react';

const CATEGORY_ICONS = { physical: Sword, special: Sparkles, status: Shield };

// Small-icon-in-a-circle, same neutral treatment used elsewhere for non-type-colored
// icons (e.g. evolution item fallback icons) — shape alone differentiates category,
// no separate color-per-category since these aren't type-semantic.
export function MoveCategoryIcon({ category }) {
  const Icon = CATEGORY_ICONS[category] || Shield;
  return (
    <span className="movepool-category-icon" title={category}>
      <Icon size={12} strokeWidth={2.5} />
    </span>
  );
}
