import { useState } from 'react';
import { Gem } from 'lucide-react';
import { toDisplayName } from '../../utils/format';
import { CATEGORY_META } from './evolutionItemCategories';
import { EvoPokemonEntry } from './EvoPokemonEntry';

const ITEM_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';

// Not every item (mostly newer Gen 8/9 evolution items) has a sprite at this
// path — fall back to a generic icon instead of showing a broken image.
function ItemIcon({ item }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span className="evo-item-icon-fallback">
        <Gem size={18} />
      </span>
    );
  }
  return <img src={`${ITEM_SPRITE_BASE}/${item}.png`} alt="" width={36} height={36} onError={() => setBroken(true)} />;
}

// Cards render their eligible-Pokémon list inline rather than behind a click-to-expand —
// simpler than the original spec and confirmed to work fine in practice (Notes/EvoItems.md).
export function EvoItemCard({ item, category, evolutions, spriteBySlug, highlighted }) {
  const meta = CATEGORY_META[category];
  return (
    <div className={`card evo-item-card${highlighted ? ' evo-item-card-highlighted' : ''}`} id={item}>
      <div className="evo-item-header">
        <ItemIcon item={item} />
        <div className="evo-item-header-info">
          <h3 className="evo-item-name">{toDisplayName(item)}</h3>
          <span className="evo-item-pill">{meta.label}</span>
        </div>
        <span className="evo-item-count">{evolutions.length}</span>
      </div>
      <div className="evo-item-entries">
        {evolutions.map((evo) => (
          <EvoPokemonEntry key={`${evo.from}-${evo.to}`} evolution={evo} spriteBySlug={spriteBySlug} />
        ))}
      </div>
    </div>
  );
}
