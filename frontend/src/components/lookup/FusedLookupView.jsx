import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ArrowUpRight, X } from 'lucide-react';
import { api } from '../../api/client';
import { TypeBadge } from '../common/TypeBadge';
import { StatBar } from '../common/StatBar';
import { Tooltip } from '../common/Tooltip';
import { CollapsibleHeader } from '../common/CollapsibleHeader';
import { FusionMiniSlot } from '../compare/FusionMiniSlot';
import { TypeDefenses } from './TypeDefenses';
import { WeaknessBadge } from './WeaknessBadge';
import { FavoriteButton } from './FavoriteButton';
import { AddToFusionListButton } from './AddToFusionListButton';
import { FusedEvolutionChains } from './FusedEvolutionChains';
import { STAT_FULL_LABELS, STAT_ORDER, toDisplayName } from '../../utils/format';
import { statTypeColor } from '../../utils/fusion';

const EVOLUTION_STORAGE_KEY = 'dexforge:evolution-open';

const STAT_VIEW_TABS = [
  { key: 'fusion', label: 'Base Stats' },
  { key: 'head', label: 'Head' },
  { key: 'body', label: 'Body' },
];

function useFusedData(headSlug, bodySlug) {
  const [head, setHead] = useState(null);
  const [body, setBody] = useState(null);
  const [fusion, setFusion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get(`/api/pokemon/${headSlug}`),
      api.get(`/api/pokemon/${bodySlug}`),
      api.get(`/api/fusion/compare?head_a=${headSlug}&body_a=${bodySlug}`),
    ])
      .then(([headData, bodyData, compareData]) => {
        if (cancelled) return;
        if (!compareData.a) {
          setError("Couldn't compute that fusion.");
          return;
        }
        setHead(headData);
        setBody(bodyData);
        setFusion(compareData.a);
      })
      .catch(() => {
        if (!cancelled) setError('Something went wrong.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [headSlug, bodySlug]);

  return { head, body, fusion, loading, error };
}

function AbilitySection({ title, abilities }) {
  return (
    <div className="info-card-section">
      <h4 className="info-card-section-heading">{title}</h4>
      <ul className="ability-list">
        {abilities.map((a) => (
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
  );
}

export function FusedLookupView({ headSlug, bodySlug, onChangeHead, onChangeBody, onSwap, onUnfuse }) {
  const { head, body, fusion, loading, error } = useFusedData(headSlug, bodySlug);
  const [statView, setStatView] = useState('fusion');
  const [evolutionOpen, setEvolutionOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(EVOLUTION_STORAGE_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  function toggleEvolution() {
    setEvolutionOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(EVOLUTION_STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className="card lookup-empty">
        <p>Loading fusion...</p>
      </div>
    );
  }

  if (error || !fusion || !head || !body) {
    return (
      <div className="card lookup-empty">
        <p>{error || 'Something went wrong.'}</p>
      </div>
    );
  }

  const weaknesses = Object.entries(fusion.type_effectiveness)
    .filter(([, multiplier]) => multiplier > 1)
    .sort((a, b) => b[1] - a[1]);

  // "Base Stats" is the true fused line (type-colored per contributing side); "Head"/"Body"
  // are just that Pokémon's own real stats, shown plainly like a normal Lookup page would.
  const statSource = statView === 'head' ? head : statView === 'body' ? body : null;
  const statTotalLabel = statView === 'head' ? 'Head Stat Total' : statView === 'body' ? 'Body Stat Total' : 'Base Stat Total';
  const statTotalValue = statSource ? statSource.base_stat_total : fusion.base_stat_total;

  return (
    <div className="lookup-page">
      <div className="page-header page-header-fused">
        <div className="page-header-center">
          <div className="fusion-slot-inputs">
            <div className="fusion-header-slot">
              <FusionMiniSlot roleLabel="Head" slug={headSlug} onSelect={onChangeHead} />
              <Link
                to={`/lookup/${headSlug}`}
                className="fusion-header-view-link"
                aria-label={`View ${toDisplayName(head.name)}'s page`}
                title="View Pokémon page"
              >
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="fusion-header-slot">
              <FusionMiniSlot roleLabel="Body" slug={bodySlug} onSelect={onChangeBody} />
              <Link
                to={`/lookup/${bodySlug}`}
                className="fusion-header-view-link"
                aria-label={`View ${toDisplayName(body.name)}'s page`}
                title="View Pokémon page"
              >
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <button type="button" className="fusion-swap-btn" onClick={onSwap} aria-label="Swap head and body">
              <ArrowLeftRight size={14} />
            </button>
          </div>
          <div className="page-header-actions">
            <FavoriteButton pokemonSlug={`${headSlug}|${bodySlug}`} />
            <AddToFusionListButton headSlug={headSlug} bodySlug={bodySlug} />
            <button type="button" className="action-btn" onClick={onUnfuse}>
              <X size={14} />
              Unfuse
            </button>
          </div>
        </div>
      </div>

      <div className="lookup-grid">
        <div className="lookup-area-hero hero-stack">
          <div className="card hero-card">
            <div className="hero-card-sprite-wrap">
              <div className="hero-fusion-sprite-pair">
                <img src={fusion.head.sprite} alt={fusion.head.name} width={150} height={150} />
                <img src={fusion.body.sprite} alt={fusion.body.name} width={150} height={150} />
              </div>
            </div>
          </div>
        </div>

        <div className="lookup-column lookup-area-stats">
          <div className="card">
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
            {STAT_ORDER.map((key) => (
              <StatBar
                key={key}
                label={STAT_FULL_LABELS[key]}
                value={statSource ? statSource.stats[key] : fusion.stats[key]}
                color={statSource ? null : statTypeColor(key, fusion.types)}
              />
            ))}
            <div className="stat-bar-total">
              <span>{statTotalLabel}</span>
              <span>{statTotalValue}</span>
            </div>
          </div>
          <div className="card">
            <h3 className="card-heading">Abilities</h3>
            <AbilitySection title={toDisplayName(head.name)} abilities={head.abilities} />
            <AbilitySection title={toDisplayName(body.name)} abilities={body.abilities} />
          </div>
        </div>

        <div className="lookup-column lookup-area-meta">
          <div className="card">
            <h3 className="card-heading">Type</h3>
            <div className="pokedex-type-badges">
              {fusion.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            <div className="info-card-section">
              <h4 className="info-card-section-heading">Weaknesses</h4>
              {weaknesses.length === 0 ? (
                <p className="text-muted">No notable weaknesses.</p>
              ) : (
                <div className="weakness-list">
                  {weaknesses.map(([t]) => (
                    <WeaknessBadge key={t} type={t} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TypeDefenses effectiveness={fusion.type_effectiveness} />

      <div className="card lookup-evolution">
        <CollapsibleHeader title="Evolution Chains" open={evolutionOpen} onToggle={toggleEvolution} />
        {evolutionOpen && (
          <FusedEvolutionChains
            headTree={head.evolution_chain}
            bodyTree={body.evolution_chain}
            headSlug={headSlug}
            bodySlug={bodySlug}
          />
        )}
      </div>
    </div>
  );
}
