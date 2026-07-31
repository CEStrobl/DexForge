import { TYPE_ORDER, getTypeTextColor } from '../common/typeIcons';
import { toDisplayName } from '../../utils/format';

export function TypeSelect({ label, value, onChange, allowNone = false }) {
  const style = value
    ? { background: `var(--type-${value})`, borderColor: `var(--type-${value})`, color: getTypeTextColor(value) }
    : undefined;

  return (
    <label className="type-select">
      <span className="type-select-label">{label}</span>
      <select value={value || ''} onChange={(e) => onChange(e.target.value || null)} style={style}>
        {allowNone && <option value="">None</option>}
        {TYPE_ORDER.map((t) => (
          <option key={t} value={t}>
            {toDisplayName(t)}
          </option>
        ))}
      </select>
    </label>
  );
}
