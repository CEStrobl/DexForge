import { TypeBadge } from '../common/TypeBadge';
import { StatBar } from '../common/StatBar';
import { DeltaBadge } from '../common/DeltaBadge';
import { TypeDefenses } from '../lookup/TypeDefenses';
import { Tooltip } from '../common/Tooltip';
import { FavoriteButton } from '../lookup/FavoriteButton';
import { AddToListButton } from '../lookup/AddToListButton';
import { PokemonSearchSelect } from './PokemonSearchSelect';
import { STAT_FULL_LABELS, STAT_ORDER, toDisplayName } from '../../utils/format';

export function CompareSlot({ label, pokemon, otherPokemon, loading, onSelectSlug, mirrored }) {
  const totalDelta = pokemon && otherPokemon ? pokemon.base_stat_total - otherPokemon.base_stat_total : null;

  return (
    <div className={`compare-slot${mirrored ? ' compare-slot-mirrored' : ''}`}>
      <PokemonSearchSelect placeholder={`Search Pokémon ${label}...`} onSelect={onSelectSlug} />

      {!pokemon && !loading && (
        <div className="card compare-slot-empty">
          <p className="text-muted">Search a Pokémon to compare.</p>
        </div>
      )}

      {loading && (
        <div className="card compare-slot-empty">
          <p className="text-muted">Loading...</p>
        </div>
      )}

      {pokemon && !loading && (
        <>
          <div className="card compare-hero">
            <div className="compare-hero-row">
              <img src={pokemon.sprite} alt={pokemon.name} width={140} height={140} />
              <div className="compare-hero-info">
                <div className="compare-hero-name">
                  <h2>{toDisplayName(pokemon.name)}</h2>
                  <span className="lookup-hero-id">#{String(pokemon.id).padStart(3, '0')}</span>
                </div>
                <div className="pokedex-type-badges">
                  {pokemon.types.map((t) => (
                    <TypeBadge key={t} type={t} />
                  ))}
                </div>
                <div className="page-header-actions">
                  <FavoriteButton pokemonSlug={pokemon.name} />
                  <AddToListButton pokemonSlug={pokemon.name} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-heading">Base Stats</h3>
            {STAT_ORDER.map((key) => (
              <StatBar
                key={key}
                label={STAT_FULL_LABELS[key]}
                value={pokemon.stats[key]}
                delta={otherPokemon ? pokemon.stats[key] - otherPokemon.stats[key] : null}
              />
            ))}
            <div className="stat-bar-total">
              <span>Base Stat Total</span>
              <span className="stat-bar-total-value">
                <span className="stat-bar-value">{pokemon.base_stat_total}</span>
                <DeltaBadge delta={totalDelta} />
              </span>
            </div>
          </div>

          <TypeDefenses effectiveness={pokemon.type_effectiveness} compact collapsible={false} />

          <div className="card">
            <h3 className="card-heading">Abilities</h3>
            <ul className="ability-list">
              {pokemon.abilities.map((a) => (
                <li key={a.name}>
                  <Tooltip content={a.description}>
                    <span>
                      {toDisplayName(a.name)}
                      {a.is_hidden && <span className="text-muted"> (Hidden)</span>}
                    </span>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
