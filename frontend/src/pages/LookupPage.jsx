import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useLastPokemon } from '../context/LastPokemonContext';
import { useInfiniteFusion } from '../context/InfiniteFusionContext';
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
import { FuseButton } from '../components/lookup/FuseButton';
import { FusedLookupView } from '../components/lookup/FusedLookupView';
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
import { HEAD_STAT_KEYS, BODY_STAT_KEYS, sumStats } from '../utils/fusion';
import '../styles/lookup.css';
// FusedLookupView reuses FusionMiniSlot/fusion-swap-btn/etc. from the Compare page's
// fusion tab (same pattern FusionListPage follows for the same components).
import '../styles/compare.css';

const STAT_VIEW_TABS = [
  { key: 'all', label: 'Base Stats' },
  { key: 'head', label: 'Head' },
  { key: 'body', label: 'Body' },
];

const TYPE_VIEW_TABS = [
  { key: 'type', label: 'Type' },
  { key: 'head', label: 'Head' },
  { key: 'body', label: 'Body' },
];

export default function LookupPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setLastSlug } = useLastPokemon();
  const { enabled: infiniteFusionEnabled } = useInfiniteFusion();
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statView, setStatView] = useState('all');
  const [typeView, setTypeView] = useState('type');
  const [splitTypeEffectiveness, setSplitTypeEffectiveness] = useState(null);
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

  const headParam = searchParams.get('head');
  const bodyParam = searchParams.get('body');
  const isFused = Boolean(infiniteFusionEnabled && headParam && bodyParam);

  useEffect(() => {
    if (!slug || isFused) {
      setPokemon(null);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get(`/api/pokemon/${slug}`)
      .then((data) => {
        setPokemon(data);
        setLastSlug(data.name);
      })
      .catch(() => setError(`No data found for "${slug}"`))
      .finally(() => setLoading(false));
  }, [slug, isFused, setLastSlug]);

  // Head/Body type tabs recompute weaknesses for a single type via the same
  // effectiveness chart the Typing Calculator would use, rather than duplicating it.
  useEffect(() => {
    const showTypeTabs = infiniteFusionEnabled && pokemon?.types.length > 1;
    if (!showTypeTabs || typeView === 'type') {
      setSplitTypeEffectiveness(null);
      return;
    }
    const type = pokemon.types[typeView === 'head' ? 0 : 1];
    if (!type) {
      setSplitTypeEffectiveness(null);
      return;
    }
    let cancelled = false;
    api.get(`/api/typing?type=${type}`).then((data) => {
      if (!cancelled) setSplitTypeEffectiveness(data);
    });
    return () => {
      cancelled = true;
    };
  }, [infiniteFusionEnabled, typeView, pokemon]);

  function selectVariant(variantSlug) {
    api.get(`/api/pokemon/${variantSlug}`).then(setPokemon);
  }

  function startFusion(partnerSlug) {
    setSearchParams({ head: slug, body: partnerSlug });
  }

  if (isFused) {
    return (
      <FusedLookupView
        headSlug={headParam}
        bodySlug={bodyParam}
        onChangeHead={(newHead) => setSearchParams({ head: newHead, body: bodyParam }, { replace: true })}
        onChangeBody={(newBody) => setSearchParams({ head: headParam, body: newBody }, { replace: true })}
        onSwap={() => setSearchParams({ head: bodyParam, body: headParam }, { replace: true })}
        onUnfuse={() => setSearchParams({}, { replace: true })}
      />
    );
  }

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

  const showTypeTabs = infiniteFusionEnabled && pokemon.types.length > 1;
  const effectiveTypeView = showTypeTabs ? typeView : 'type';
  const displayedTypes =
    effectiveTypeView === 'type'
      ? pokemon.types
      : [pokemon.types[effectiveTypeView === 'head' ? 0 : 1]].filter(Boolean);
  const displayedEffectiveness =
    effectiveTypeView === 'type' ? pokemon.type_effectiveness : splitTypeEffectiveness || pokemon.type_effectiveness;
  const weaknessesHeading =
    effectiveTypeView === 'head' ? 'Head Weaknesses' : effectiveTypeView === 'body' ? 'Body Weaknesses' : 'Weaknesses';

  const weaknesses = Object.entries(displayedEffectiveness)
    .filter(([, multiplier]) => multiplier > 1)
    .sort((a, b) => b[1] - a[1]);

  const statTotalLabel = statView === 'head' ? 'Head Stat Total' : statView === 'body' ? 'Body Stat Total' : 'Base Stat Total';
  const statTotalValue =
    statView === 'head'
      ? sumStats(pokemon.stats, HEAD_STAT_KEYS)
      : statView === 'body'
        ? sumStats(pokemon.stats, BODY_STAT_KEYS)
        : pokemon.base_stat_total;

  function isStatDimmed(dataKey) {
    if (!infiniteFusionEnabled || statView === 'all') return false;
    if (statView === 'head') return !HEAD_STAT_KEYS.includes(dataKey);
    return !BODY_STAT_KEYS.includes(dataKey);
  }

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
            {infiniteFusionEnabled && <FuseButton onFuse={startFusion} />}
          </div>
        </div>

        <DexNavLink neighbor={pokemon.neighbors.next} direction="next" />
      </div>

      <div className="lookup-grid">
        <div className="lookup-area-hero hero-stack">
          <div className="card hero-card">
            {pokemon.variants?.length > 1 && (
              <select
                className="lookup-variant-select"
                value={pokemon.selected_variant}
                onChange={(e) => selectVariant(e.target.value)}
              >
                {pokemon.variants.map((v) => (
                  <option key={v.slug} value={v.slug}>
                    {toDisplayName(v.slug)}
                  </option>
                ))}
              </select>
            )}
            <div className="hero-card-sprite-wrap">
              <img src={pokemon.sprite} alt={pokemon.name} width={200} height={200} />
            </div>
          </div>
        </div>

        <div className="lookup-column lookup-area-stats">
          <div className="card">
            {infiniteFusionEnabled ? (
              <div className="lookup-inline-tabs">
                {STAT_VIEW_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`lookup-inline-tab${statView === tab.key ? ' active' : ''}`}
                    onClick={() => setStatView(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : (
              <h3 className="card-heading">Base Stats</h3>
            )}
            {STAT_ORDER.map((key) => (
              <StatBar key={key} label={STAT_FULL_LABELS[key]} value={pokemon.stats[key]} dimmed={isStatDimmed(key)} />
            ))}
            <div className="stat-bar-total">
              <span>{statTotalLabel}</span>
              <span>{statTotalValue}</span>
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
            {showTypeTabs ? (
              <div className="lookup-inline-tabs">
                {TYPE_VIEW_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`lookup-inline-tab${typeView === tab.key ? ' active' : ''}`}
                    onClick={() => setTypeView(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : (
              <h3 className="card-heading">Type</h3>
            )}
            <div className="pokedex-type-badges">
              {displayedTypes.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            <div className="info-card-section">
              <h4 className="info-card-section-heading">{weaknessesHeading}</h4>
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
