import { NavLink } from 'react-router-dom';
import {
  Search,
  GitCompare,
  Calculator,
  Heart,
  Package,
  ClipboardList,
} from 'lucide-react';

const NAV_LINKS = [
  { to: '/lookup', label: 'Lookup', icon: Search },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/typing-calculator', label: 'Typing Calculator', icon: Calculator },
  { to: '/natures', label: 'Natures', icon: Heart },
  { to: '/evolution-items', label: 'Evolution Items', icon: Package },
  { to: '/list-builder', label: 'List Builder', icon: ClipboardList },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">DexForge</div>
      <nav className="sidebar-nav">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
