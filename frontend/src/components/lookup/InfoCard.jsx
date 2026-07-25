import { AttributePill } from './AttributePill';

export function InfoCard({ title, items }) {
  return (
    <div className="card">
      <h3 className="card-heading">{title}</h3>
      <div className="attribute-grid">
        {items.map((item) => (
          <AttributePill key={item.label} icon={item.icon} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
}
