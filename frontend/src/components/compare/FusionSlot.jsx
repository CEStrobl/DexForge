import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import { TypeBadge } from '../common/TypeBadge';
import { StatBar } from '../common/StatBar';
import { DeltaBadge } from '../common/DeltaBadge';
import { FitText } from '../common/FitText';
import { CollapsibleHeader } from '../common/CollapsibleHeader';
import { TypeDefenses } from '../lookup/TypeDefenses';
import { FusionMiniSlot } from './FusionMiniSlot';
import { STAT_FULL_LABELS, STAT_ORDER, toDisplayName } from '../../utils/format';

function AbilityColumn({ title, pool }) {
  return (
    <div className="fusion-ability-column">
      <span className="fusion-ability-source">{title}</span>
      {pool.length === 0 ? (
        <span className="text-muted">None</span>
      ) : (
        <ul className="ability-list">
          {pool.map((a) => (
            <li key={a}>{toDisplayName(a)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FusionSlot({ label, head, body, onSetHead, onSetBody, onSwap, fusion, otherFusion, loading, mirrored }) {
  const [statsOpen, setStatsOpen] = useState(true);
  const [abilitiesOpen, setAbilitiesOpen] = useState(true);
  const totalDelta = fusion && otherFusion ? fusion.base_stat_total - otherFusion.base_stat_total : null;
  const hasHiddenOptions = fusion && (fusion.abilities.head.hidden.length > 0 || fusion.abilities.body.hidden.length > 0);

  return (
    <div className={`compare-slot fusion-slot${mirrored ? ' compare-slot-mirrored' : ''}`}>
      <div className="fusion-slot-inputs">
        <FusionMiniSlot roleLabel="Head" slug={head} onSelect={onSetHead} />
        <FusionMiniSlot roleLabel="Body" slug={body} onSelect={onSetBody} />
        <button
          type="button"
          className="fusion-swap-btn"
          onClick={onSwap}
          disabled={!head || !body}
          aria-label={`Swap ${label} head and body`}
        >
          <ArrowLeftRight size={14} />
        </button>
      </div>

      {(!head || !body) && (
        <div className="card compare-slot-empty">
          <p className="text-muted">Pick a head and body Pokémon to see the fusion.</p>
        </div>
      )}

      {head && body && loading && (
        <div className="card compare-slot-empty">
          <p className="text-muted">Loading...</p>
        </div>
      )}

      {head && body && !loading && !fusion && (
        <div className="card compare-slot-empty">
          <p className="text-muted">Couldn't compute that fusion.</p>
        </div>
      )}

      {fusion && !loading && (
        <>
          <div className="card compare-hero">
            <div className="compare-hero-row">
              <div className="fusion-sprite-pair">
                <img src={fusion.head.sprite} alt={fusion.head.name} width={84} height={84} />
                <img src={fusion.body.sprite} alt={fusion.body.name} width={84} height={84} />
              </div>
              <div className="compare-hero-info">
                <div className="compare-hero-name">
                  <FitText as="h2">
                    {toDisplayName(fusion.head.name)} / {toDisplayName(fusion.body.name)}
                  </FitText>
                </div>
                <div className="pokedex-type-badges">
                  {fusion.types.map((t) => (
                    <TypeBadge key={t} type={t} />
                  ))}
                </div>
              </div>
            </div>
            <Link
              to={`/lookup/${head}?head=${head}&body=${body}`}
              className="fusion-view-page-link"
              aria-label="View fusion page"
              title="View fusion page"
            >
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="card">
            <CollapsibleHeader title="Base Stats" open={statsOpen} onToggle={() => setStatsOpen((v) => !v)} />
            {statsOpen && (
              <>
                {STAT_ORDER.map((key) => (
                  <StatBar
                    key={key}
                    label={STAT_FULL_LABELS[key]}
                    value={fusion.stats[key]}
                    delta={otherFusion ? fusion.stats[key] - otherFusion.stats[key] : null}
                  />
                ))}
                <div className="stat-bar-total">
                  <span>Base Stat Total</span>
                  <span className="stat-bar-total-value">
                    <span className="stat-bar-value">{fusion.base_stat_total}</span>
                    <DeltaBadge delta={totalDelta} />
                  </span>
                </div>
              </>
            )}
          </div>

          <TypeDefenses effectiveness={fusion.type_effectiveness} compact />

          <div className="card">
            <CollapsibleHeader title="Possible Abilities" open={abilitiesOpen} onToggle={() => setAbilitiesOpen((v) => !v)} />
            {abilitiesOpen && (
              <>
                <div className="fusion-ability-columns">
                  <AbilityColumn title={`Head (${toDisplayName(fusion.head.name)})`} pool={fusion.abilities.head.regular} />
                  <AbilityColumn title={`Body (${toDisplayName(fusion.body.name)})`} pool={fusion.abilities.body.regular} />
                </div>
                {hasHiddenOptions && (
                  <div className="fusion-ability-hidden">
                    <h4 className="info-card-section-heading">Hidden Ability Options (Super Splicer)</h4>
                    <div className="fusion-ability-columns">
                      <AbilityColumn title={`Head (${toDisplayName(fusion.head.name)})`} pool={fusion.abilities.head.hidden} />
                      <AbilityColumn title={`Body (${toDisplayName(fusion.body.name)})`} pool={fusion.abilities.body.hidden} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
