import { NavLink } from 'react-router-dom';

// Icon + always-visible label — each tool gets its own fixed accent color so the
// strip reads at a glance (see Notes on the top-bar nav redesign).
export function TopNavIcon({ icon: Icon, label, to, color }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `topbar-nav-icon${isActive ? ' active' : ''}`}
      style={{ '--nav-icon-color': color }}
    >
      <Icon size={17} strokeWidth={2} />
      <span className="topbar-nav-icon-label">{label}</span>
    </NavLink>
  );
}
