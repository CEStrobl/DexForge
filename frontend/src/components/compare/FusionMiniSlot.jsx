import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';
import { PokemonSearchSelect } from './PokemonSearchSelect';
import { FusionEvoMenu } from './FusionEvoMenu';

function useSlotData(slug) {
  const [pokemon, setPokemon] = useState(null);
  const [family, setFamily] = useState(null);

  useEffect(() => {
    if (!slug) {
      setPokemon(null);
      setFamily(null);
      return;
    }
    api
      .post('/api/pokemon/bulk', { slugs: [slug] })
      .then((r) => setPokemon(r[0] || null))
      .catch(() => setPokemon(null));
    api
      .get(`/api/pokemon/${slug}/evolution-family`)
      .then(setFamily)
      .catch(() => setFamily(null));
  }, [slug]);

  return { pokemon, family };
}

export function FusionMiniSlot({ roleLabel, slug, onSelect }) {
  const { pokemon, family } = useSlotData(slug);
  const [editing, setEditing] = useState(false);
  const containerRef = useRef(null);

  // Clicking away while editing (without picking anything) falls back to
  // whatever was already selected, instead of leaving a blank search box.
  useEffect(() => {
    if (!editing) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setEditing(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editing]);

  function handleSelect(name) {
    setEditing(false);
    onSelect(name);
  }

  const showSearch = editing || !slug || !pokemon;

  return (
    <div className="fusion-mini-slot" ref={containerRef}>
      <span className="fusion-mini-slot-label">{roleLabel}</span>
      {showSearch ? (
        <PokemonSearchSelect placeholder={`Search ${roleLabel}...`} onSelect={handleSelect} autoFocus={editing} />
      ) : (
        <div className="fusion-mini-slot-combo">
          <button type="button" className="fusion-mini-slot-chip" onClick={() => setEditing(true)}>
            <img src={pokemon.sprite} alt="" width={26} height={26} />
            <span>{toDisplayName(pokemon.name)}</span>
          </button>
          <FusionEvoMenu family={family} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
}
