import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Target,
  Egg,
  TrendingUp,
  Dumbbell,
  Heart,
  Users,
  RotateCw,
  Footprints,
} from 'lucide-react';
import { api } from '../api/client';
import { TypeBadge } from '../components/common/TypeBadge';
import { StatBar } from '../components/common/StatBar';
import { InfoCard } from '../components/lookup/InfoCard';
import { WeaknessBadge } from '../components/lookup/WeaknessBadge';
import { TypeDefenses } from '../components/lookup/TypeDefenses';
import { EvolutionChain } from '../components/lookup/EvolutionChain';
import { Tooltip } from '../components/common/Tooltip';
import { CollapsibleHeader } from '../components/common/CollapsibleHeader';
import { DexNavLink } from '../components/lookup/DexNav';
import { FavoriteButton } from '../components/lookup/FavoriteButton';
import { AddToListButton } from '../components/lookup/AddToListButton';
import {
  STAT_FULL_LABELS,
  STAT_ORDER,
  formatGrowthRate,
  formatEvYield,
  formatCatchRate,
  formatFriendship,
  formatGenderRatio,
  formatEggCycles,
  formatAvgSteps,
  toDisplayName,
} from '../utils/format';
import '../styles/lookup.css';

export default function LookupPage() {
  const { slug } = useParams();
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evolutionOpen, setEvolutionOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('dexforge:evolution-open');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  function toggleEvolution() {
    setEvolutionOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('dexforge:evolution-open', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  useEffect(() => {
    if (!slug) {
      setPokemon(null);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get(`/api/pokemon/${slug}`)
      .then(setPokemon)
      .catch(() => setError(`No data found for "${slug}"`))
      .finally(() => setLoading(false));
  }, [slug]);

  if (!slug) {
    return (
      <div className="card lookup-empty">
        <h2>Lookup</h2>
        <p>Search a Pokémon above to see stats, typing, abilities, and its evolution chain.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card lookup-empty">
        <p>Loading {toDisplayName(slug)}...</p>
      </div>
    );
  }

  if (error || !pokemon) {
    return (
      <div className="card lookup-empty">
        <p>{error || 'Something went wrong.'}</p>
      </div>
    );
  }

  const weaknesses = Object.entries(pokemon.type_effectiveness)
    .filter(([, multiplier]) => multiplier > 1)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="lookup-page">
      <div className="page-header">
        <DexNavLink neighbor={pokemon.neighbors.prev} direction="prev" />

        <div className="page-header-center">
          <div className="page-header-title">
            <h1>{toDisplayName(pokemon.name)}</h1>
            <span className="lookup-hero-id">#{String(pokemon.id).padStart(3, '0')}</span>
          </div>
          <div className="page-header-actions">
            <FavoriteButton pokemonSlug={pokemon.name} />
            <AddToListButton pokemonSlug={pokemon.name} />
          </div>
        </div>

        <DexNavLink neighbor={pokemon.neighbors.next} direction="next" />
      </div>

      <div className="lookup-grid">
        <div className="lookup-area-hero hero-stack">
          <div className="card hero-card">
            <div className="hero-card-sprite-wrap">
              <img src={pokemon.sprite} alt={pokemon.name} width={200} height={200} />
            </div>
          </div>
        </div>

        <div className="lookup-column lookup-area-stats">
          <div className="card">
            <h3 className="card-heading">Base Stats</h3>
            {STAT_ORDER.map((key) => (
              <StatBar key={key} label={STAT_FULL_LABELS[key]} value={pokemon.stats[key]} />
            ))}
            <div className="stat-bar-total">
              <span>Base Stat Total</span>
              <span>{pokemon.base_stat_total}</span>
            </div>
          </div>
          <InfoCard
            title="Training"
            items={[
              { icon: Dumbbell, label: 'EV Yield', value: formatEvYield(pokemon.ev_yield) },
              { icon: Target, label: 'Catch Rate', value: formatCatchRate(pokemon.species.capture_rate) },
              { icon: TrendingUp, label: 'Growth Rate', value: formatGrowthRate(pokemon.species.growth_rate) },
              { icon: Heart, label: 'Base Friendship', value: formatFriendship(pokemon.species.base_happiness) },
            ]}
          />
          <InfoCard
            title="Breeding"
            items={[
              {
                icon: Egg,
                label: 'Egg Group',
                value: pokemon.species.egg_groups.map(toDisplayName).join(', ') || '—',
              },
              { icon: Users, label: 'Gender Ratio', value: formatGenderRatio(pokemon.species.gender_rate) },
              { icon: RotateCw, label: 'Egg Cycles', value: formatEggCycles(pokemon.species.hatch_counter) },
              { icon: Footprints, label: 'Avg Steps', value: formatAvgSteps(pokemon.species.hatch_counter) },
            ]}
          />
        </div>

        <div className="lookup-column lookup-area-meta">
          <div className="card">
            <h3 className="card-heading">Type</h3>
            <div className="pokedex-type-badges">
              {pokemon.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            <div className="info-card-section">
              <h4 className="info-card-section-heading">Weaknesses</h4>
              {weaknesses.length === 0 ? (
                <p className="text-muted">No notable weaknesses.</p>
              ) : (
                <div className="weakness-list">
                  {weaknesses.map(([type]) => (
                    <WeaknessBadge key={type} type={type} />
                  ))}
                </div>
              )}
            </div>
          </div>
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
        </div>
      </div>

      <TypeDefenses effectiveness={pokemon.type_effectiveness} />

      <div className="card lookup-evolution">
        <CollapsibleHeader title="Evolution Chain" open={evolutionOpen} onToggle={toggleEvolution} />
        {evolutionOpen && (
          <EvolutionChain tree={pokemon.evolution_chain} currentSlug={pokemon.name} />
        )}
      </div>
    </div>
  );
}
