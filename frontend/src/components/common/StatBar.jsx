import { getStatColor } from '../../utils/statColor';
import { DeltaBadge } from './DeltaBadge';

export function StatBar({ label, value, max = 200, dimmed = false, delta, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`stat-bar-row${dimmed ? ' stat-bar-row-dimmed' : ''}`}>
      <span className="stat-bar-label">{label}</span>
      <span className="stat-bar-track">
        <span
          className="stat-bar-fill"
          style={{ width: `${pct}%`, background: dimmed ? 'var(--color-border)' : color || getStatColor(value) }}
        />
      </span>
      <span className="stat-bar-value-wrap">
        <span className="stat-bar-value">{value}</span>
        <DeltaBadge delta={delta} />
      </span>
    </div>
  );
}
