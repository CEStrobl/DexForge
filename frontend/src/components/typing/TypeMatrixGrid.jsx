import { TypeBadge } from '../common/TypeBadge';
import { TYPE_ORDER } from '../common/typeIcons';
import { formatMultiplier, multiplierClass } from '../../utils/typeEffectiveness';

const BANDS = [TYPE_ORDER.slice(0, 9), TYPE_ORDER.slice(9)];

export function TypeMatrixGrid({ effectiveness }) {
  return (
    <div className="type-matrix">
      {BANDS.map((band, i) => (
        <div key={i} className="type-matrix-band">
          {band.map((type) => {
            const multiplier = effectiveness[type] ?? 1;
            const cls = multiplierClass(multiplier);
            return (
              <div key={type} className="type-matrix-col">
                <TypeBadge type={type} />
                <span className={`type-matrix-value type-matrix-value-${cls}`}>
                  {formatMultiplier(multiplier)}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
