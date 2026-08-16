import { TYPE_ICONS, getTypeTextColor } from './typeIcons';

export function TypeBadge({ type, iconOnly = false }) {
  const Icon = TYPE_ICONS[type];
  return (
    <span
      className={`type-badge${iconOnly ? ' type-badge-icon-only' : ''}`}
      style={{ background: `var(--type-${type})`, color: getTypeTextColor(type) }}
      title={iconOnly ? type : undefined}
      aria-label={iconOnly ? type : undefined}
    >
      {Icon && <Icon size={13} strokeWidth={2.5} />}
      {!iconOnly && type}
    </span>
  );
}
