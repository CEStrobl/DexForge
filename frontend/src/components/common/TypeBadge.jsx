import { TYPE_ICONS, getTypeTextColor } from './typeIcons';

export function TypeBadge({ type }) {
  const Icon = TYPE_ICONS[type];
  return (
    <span
      className="type-badge"
      style={{ background: `var(--type-${type})`, color: getTypeTextColor(type) }}
    >
      {Icon && <Icon size={13} strokeWidth={2.5} />}
      {type}
    </span>
  );
}
