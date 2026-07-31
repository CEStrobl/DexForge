export function DeltaBadge({ delta }) {
  if (delta == null) return null;
  const cls = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
  return (
    <span className={`stat-bar-delta stat-bar-delta-${cls}`}>
      {delta > 0 ? `+${delta}` : delta}
    </span>
  );
}
