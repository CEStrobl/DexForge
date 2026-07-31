import { useState } from 'react';
import { TYPE_ICONS, TYPE_ORDER, getTypeTextColor } from '../common/typeIcons';
import { CollapsibleHeader } from '../common/CollapsibleHeader';
import { Tooltip } from '../common/Tooltip';
import { toDisplayName } from '../../utils/format';
import { formatMultiplier, multiplierClass } from '../../utils/typeEffectiveness';

const STORAGE_KEY = 'dexforge:type-defenses-open';

function tooltipText(type, multiplier) {
  const label = toDisplayName(type);
  if (multiplier === 0) return `Immune to ${label} moves.`;
  if (multiplier === 1) return `Takes normal damage from ${label} moves.`;
  return `Takes ${formatMultiplier(multiplier)} damage from ${label} moves.`;
}

export function TypeDefenses({ effectiveness, compact = false, collapsible = true }) {
  const [open, setOpen] = useState(() => {
    if (!collapsible) return true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  return (
    <div className="card type-defenses">
      {collapsible ? (
        <CollapsibleHeader title="Type Defenses" open={open} onToggle={toggle} />
      ) : (
        <h3 className="card-heading">Type Defenses</h3>
      )}

      {open && (
        <div className={`type-defenses-grid${compact ? ' type-defenses-grid--compact' : ''}`}>
          {TYPE_ORDER.map((type) => {
            const multiplier = effectiveness[type] ?? 1;
            const Icon = TYPE_ICONS[type];
            const cls = multiplierClass(multiplier);
            return (
              <Tooltip key={type} content={tooltipText(type, multiplier)}>
                <div className={`type-defense-cell type-defense-cell-${cls}`}>
                  <div
                    className="type-defense-badge"
                    style={{ background: `var(--type-${type})`, color: getTypeTextColor(type) }}
                  >
                    {Icon && <Icon size={16} strokeWidth={2.5} />}
                  </div>
                  {cls !== 'neutral' && (
                    <span className={`type-defense-multiplier ${cls}`}>
                      {formatMultiplier(multiplier)}
                    </span>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>
      )}
    </div>
  );
}
