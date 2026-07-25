import { ChevronDown, ChevronUp } from 'lucide-react';

export function CollapsibleHeader({ title, open, onToggle }) {
  return (
    <button type="button" className="collapsible-header" onClick={onToggle} aria-expanded={open}>
      {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      <h3 className="card-heading collapsible-header-title">{title}</h3>
    </button>
  );
}
