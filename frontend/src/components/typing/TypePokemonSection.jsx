import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { CollapsibleHeader } from '../common/CollapsibleHeader';
import { toDisplayName } from '../../utils/format';

// Filters to Pokémon carrying every selected type at once (a Bug/Dark search should show
// Bug+Dark dual-types, not every Bug or every Dark Pokémon individually) — the backend's
// /api/lists/preview criteria matches on ANY overlap, so the AND-narrowing happens here
// rather than changing that endpoint's shared OR semantics (Dex Filter relies on those).
export function TypePokemonSection({ types }) {
  const [open, setOpen] = useState(false);
  const [pokemon, setPokemon] = useState(null);

  useEffect(() => {
    setPokemon(null);
  }, [types.join(',')]);

  useEffect(() => {
    if (!open || pokemon !== null || types.length === 0) return;
    api
      .post('/api/lists/preview', { types })
      .then((results) => {
        setPokemon(results.filter((p) => types.every((t) => p.types.includes(t))));
      })
      .catch(() => setPokemon([]));
  }, [open, pokemon, types]);

  return (
    <div className="card type-pokemon-section">
      <CollapsibleHeader title="Pokémon of this Type" open={open} onToggle={() => setOpen((prev) => !prev)} />
      {open && (
        <div className="type-pokemon-body">
          {pokemon === null ? (
            <p className="text-muted">Loading...</p>
          ) : pokemon.length === 0 ? (
            <p className="text-muted">None found.</p>
          ) : (
            <div className="type-pokemon-grid">
              {pokemon.map((p) => (
                <Link key={p.name} to={`/lookup/${p.name}`} className="type-pokemon-chip">
                  <img src={p.sprite} alt="" width={26} height={26} />
                  <span>{toDisplayName(p.name)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
