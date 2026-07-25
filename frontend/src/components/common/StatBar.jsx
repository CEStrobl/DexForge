import { getStatColor } from '../../utils/statColor';

export function StatBar({ label, value, max = 200 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="stat-bar-row">
      <span className="stat-bar-label">{label}</span>
      <span className="stat-bar-track">
        <span
          className="stat-bar-fill"
          style={{ width: `${pct}%`, background: getStatColor(value) }}
        />
      </span>
      <span className="stat-bar-value">{value}</span>
    </div>
  );
}
