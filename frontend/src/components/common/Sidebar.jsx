import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Settings, ChevronLeft, ChevronRight, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { QuickLinksSection } from './QuickLinksSection';
import { SidebarListsSection } from './SidebarListsSection';
import { SidebarAvatar } from '../profile/SidebarAvatar';
import { NAV_ITEMS } from './navItems';

const COLLAPSE_KEY = 'dexforge:sidebar-collapsed';

// Below the tablet breakpoint this renders as an off-canvas drawer (base.css) instead of the
// desktop rail — `mobileOpen`/`onClose` come from AppShell (App.jsx), which owns that state
// since the toggle button lives in TopBar, not here.
export function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const { session, username, avatarHeadSlug, avatarBodySlug, avatarVariantId } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // The desktop "collapsed rail" concept doesn't apply once this is an off-canvas drawer —
  // a drawer is either fully open (full content) or fully hidden, never a narrow icon-only
  // strip. Without this override, a rail collapsed on desktop would reopen on mobile with
  // Quick Links/Saved Lists missing (that block is unmounted, not just hidden, when
  // collapsed) since `collapsed` itself is a separate, persisted piece of state.
  const isCollapsedRail = collapsed && !mobileOpen;

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar${isCollapsedRail ? ' sidebar-collapsed' : ''}${mobileOpen ? ' sidebar-mobile-open' : ''}`}>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        <button type="button" className="sidebar-mobile-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>

        <Link to="/" className="sidebar-brand" title="DexForge">
          {isCollapsedRail ? 'D' : 'DexForge'}
        </Link>

        <NavLink
          to={session ? '/profile' : '/sign-in'}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          title={session ? `Signed in as ${username || 'you'}` : 'Sign in'}
          onClick={onClose}
        >
          {session ? (
            <SidebarAvatar headSlug={avatarHeadSlug} bodySlug={avatarBodySlug} variantId={avatarVariantId} />
          ) : (
            <User size={18} strokeWidth={2} />
          )}
          {!isCollapsedRail && <span>{session ? username || 'Account' : 'Sign in'}</span>}
        </NavLink>

        {/* TopBar's Compare/Typing/Natures/Items/Filter icon strip hides below the tablet
            breakpoint (no room next to search + hamburger) — this mirrors it into the drawer
            so those tools stay reachable on mobile. display:none above that breakpoint via
            CSS, not JS, so it's driven purely by viewport width like the strip it mirrors. */}
        {!isCollapsedRail && (
          <nav className="sidebar-mobile-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                onClick={onClose}
              >
                <item.icon size={18} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        {!isCollapsedRail && (
          <div className="sidebar-lists-groups">
            {session && <QuickLinksSection />}
            <SidebarListsSection />
          </div>
        )}

        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            title="Settings"
            onClick={onClose}
          >
            <Settings size={18} strokeWidth={2} />
            {!isCollapsedRail && <span>Settings</span>}
          </NavLink>
        </div>
      </aside>
    </>
  );
}
