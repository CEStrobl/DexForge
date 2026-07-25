export function AttributePill({ icon: Icon, label, value }) {
  const isRich = typeof value !== 'string' && typeof value !== 'number';
  return (
    <div className="attribute-pill">
      <Icon size={16} strokeWidth={2} />
      <div>
        <div className="attribute-pill-label">{label}</div>
        <div className={`attribute-pill-value${isRich ? ' attribute-pill-value-rich' : ''}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
