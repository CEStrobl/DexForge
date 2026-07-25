import { TYPE_ICONS, getTypeTextColor } from '../common/typeIcons';

export function WeaknessBadge({ type }) {
  const Icon = TYPE_ICONS[type];
  return (
    <span
      className="weakness-badge"
      style={{ background: `var(--type-${type})`, color: getTypeTextColor(type) }}
    >
      {Icon && <Icon size={13} strokeWidth={2.5} />}
      {type}
    </span>
  );
}
