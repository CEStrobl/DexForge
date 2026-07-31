import { Link } from 'react-router-dom';
import { toDisplayName } from '../../utils/format';

// Navigates to the destination Pokémon's Lookup page — the doorway this page is meant to
// be, not a dead end (Notes/EvoItems.md).
export function EvoPokemonEntry({ evolution, spriteBySlug }) {
  const { from, to, note } = evolution;
  return (
    <Link to={`/lookup/${to}`} className="evo-entry">
      <div className="evo-entry-chain">
        <span className="evo-entry-pokemon">
          {spriteBySlug[from] && <img src={spriteBySlug[from]} alt="" width={32} height={32} />}
          <span>{toDisplayName(from)}</span>
        </span>
        <span className="evo-entry-arrow">→</span>
        <span className="evo-entry-pokemon">
          {spriteBySlug[to] && <img src={spriteBySlug[to]} alt="" width={32} height={32} />}
          <span>{toDisplayName(to)}</span>
        </span>
      </div>
      {note && <span className="evo-entry-note">{note}</span>}
    </Link>
  );
}
