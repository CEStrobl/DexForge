import { TypeBadge } from '../common/TypeBadge';
import { TYPE_ORDER } from '../common/typeIcons';
import { formatMultiplier, multiplierTier } from '../../utils/typeEffectiveness';

const LEGEND = [
  { tier: 'weak4', label: '4× Weak' },
  { tier: 'weak2', label: '2× Weak' },
  { tier: 'neutral', label: '1× Neutral' },
  { tier: 'resist2', label: '½× Resist' },
  { tier: 'resist4', label: '¼× Resist' },
  { tier: 'immune', label: '0× Immune' },
];

// Fixed grid, every type in the same position every time (periodic-table style) —
// lets you jump straight to a specific type instead of hunting through re-sorted
// severity bands. See Notes/typecalc.md for the full rationale.
export function TypeMatrixGrid({ effectiveness }) {
  return (
    <div className="type-matrix">
      <div className="type-matrix-grid">
        {TYPE_ORDER.map((type) => {
          const multiplier = effectiveness[type] ?? 1;
          const tier = multiplierTier(multiplier);
          return (
            <div key={type} className={`type-matrix-cell type-matrix-cell-${tier}`}>
              <TypeBadge type={type} />
              <span className="type-matrix-cell-value">{formatMultiplier(multiplier)}</span>
            </div>
          );
        })}
      </div>

      <div className="type-matrix-legend">
        {LEGEND.map(({ tier, label }) => (
          <span key={tier} className="type-matrix-legend-item">
            <span className={`type-matrix-legend-swatch type-matrix-cell-${tier}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
