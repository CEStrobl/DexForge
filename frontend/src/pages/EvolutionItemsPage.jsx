import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../api/client';
import { toDisplayName } from '../utils/format';
import { CATEGORY_ORDER, CATEGORY_META } from '../components/evolution-items/evolutionItemCategories';
import { EvoItemCard } from '../components/evolution-items/EvoItemCard';
import '../styles/evolution-items.css';

function SkeletonCard() {
  return (
    <div className="card evo-item-card evo-item-card-skeleton">
      <div className="evo-item-header">
        <span className="evo-skeleton-block evo-skeleton-icon" />
        <div className="evo-item-header-info">
          <span className="evo-skeleton-block evo-skeleton-line" style={{ width: '60%' }} />
          <span className="evo-skeleton-block evo-skeleton-pill" />
        </div>
      </div>
      <div className="evo-item-entries">
        <span className="evo-skeleton-block evo-skeleton-entry" />
        <span className="evo-skeleton-block evo-skeleton-entry" />
      </div>
    </div>
  );
}

export default function EvolutionItemsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [spriteBySlug, setSpriteBySlug] = useState({});
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [highlightedItem, setHighlightedItem] = useState(null);

  useEffect(() => {
    api
      .get('/api/evolution-items')
      .then((data) => {
        setItems(data);
        const allSlugs = [...new Set(data.flatMap((i) => i.evolutions.flatMap((e) => [e.from, e.to])))];
        if (allSlugs.length === 0) return;
        api
          .post('/api/pokemon/bulk', { slugs: allSlugs })
          .then((mons) => setSpriteBySlug(Object.fromEntries(mons.map((m) => [m.name, m.sprite]))))
          .catch(() => setSpriteBySlug({}));
      })
      .catch(() => setError('Could not load evolution items.'));
  }, []);

  // Deep link from an evolution chain's item trigger (e.g. /evolution-items#sun-stone) —
  // scroll to that card once the real cards exist. Highlighting is driven from state rather
  // than relying on CSS :target, since client-side (pushState) navigation doesn't reliably
  // retrigger :target in Chromium.
  useEffect(() => {
    if (!items) return;
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) return;
    setHighlightedItem(hash);
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [items]);

  const groupedSections = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    const filtered = q ? items.filter((i) => i.item.toLowerCase().includes(q) || toDisplayName(i.item).toLowerCase().includes(q)) : items;
    return CATEGORY_ORDER.filter((cat) => !activeCategory || activeCategory === cat).map((cat) => ({
      category: cat,
      items: filtered.filter((i) => i.category === cat).sort((a, b) => a.item.localeCompare(b.item)),
    }));
  }, [items, query, activeCategory]);

  const totalVisible = groupedSections.reduce((sum, s) => sum + s.items.length, 0);

  function toggleCategory(cat) {
    setActiveCategory((prev) => (prev === cat ? null : cat));
  }

  return (
    <div className="evolution-items-page">
      <div className="evo-items-toolbar">
        <div className="topbar-search evo-items-search">
          <Search size={16} className="topbar-search-icon" />
          <input
            type="text"
            placeholder="Search items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="evo-items-category-pills">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`evo-category-filter-pill${activeCategory === cat ? ' active' : ''}`}
              onClick={() => toggleCategory(cat)}
            >
              {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card">
          <p className="text-muted">{error}</p>
        </div>
      )}

      {!error && !items && (
        <div className="evo-item-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!error && items && totalVisible === 0 && (
        <div className="card evo-items-empty-state">
          <p>{query ? `No items match "${query}".` : 'No items in this category.'}</p>
        </div>
      )}

      {!error &&
        items &&
        totalVisible > 0 &&
        groupedSections.map(
          (section) =>
            section.items.length > 0 && (
              <div key={section.category} className="evo-items-section">
                <div className="evo-items-section-header">
                  <h2>{CATEGORY_META[section.category].label}</h2>
                  <p className="text-muted">{CATEGORY_META[section.category].description}</p>
                </div>
                <div className="evo-item-grid">
                  {section.items.map(({ item, category, evolutions }) => (
                    <EvoItemCard
                      key={item}
                      item={item}
                      category={category}
                      evolutions={evolutions}
                      spriteBySlug={spriteBySlug}
                      highlighted={item === highlightedItem}
                    />
                  ))}
                </div>
              </div>
            )
        )}
    </div>
  );
}
