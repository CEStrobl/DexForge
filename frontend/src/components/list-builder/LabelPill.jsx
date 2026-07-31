export function LabelPill({ label, onClick, className = '' }) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`label-pill ${className}`.trim()}
      style={{ background: label.color }}
      onClick={onClick}
    >
      {label.name}
    </Tag>
  );
}
