import { useState } from 'react';
import { TYPE_ICONS, TYPE_ORDER, getTypeTextColor } from '../common/typeIcons';
import { CollapsibleHeader } from '../common/CollapsibleHeader';
import { Tooltip } from '../common/Tooltip';
import { toDisplayName } from '../../utils/format';

const STORAGE_KEY = 'dexforge:type-defenses-open';

function formatMultiplier(multiplier) {
  if (multiplier === 0.25) return '¼×';
  if (multiplier === 0.5) return '½×';
  return `${multiplier}×`;
}

function multiplierClass(multiplier) {
  if (multiplier === 0) return 'immune';
  if (multiplier < 1) return 'resist';
  if (multiplier > 1) return 'weak';
  return 'neutral';
}

function tooltipText(type, multiplier) {
  const label = toDisplayName(type);
  if (multiplier === 0) return `Immune to ${label} moves.`;
  if (multiplier === 1) return `Takes normal damage from ${label} moves.`;
  return `Takes ${formatMultiplier(multiplier)} damage from ${label} moves.`;
}

export function TypeDefenses({ effectiveness }) {
  const [open, setOpen] = useState(() => {
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
      <CollapsibleHeader title="Type Defenses" open={open} onToggle={toggle} />

      {open && (
        <div className="type-defenses-grid">
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
