import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Settings, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { QuickLinksSection } from './QuickLinksSection';
import { SidebarListsSection } from './SidebarListsSection';
import { SidebarAvatar } from '../profile/SidebarAvatar';

const COLLAPSE_KEY = 'dexforge:sidebar-collapsed';

export function Sidebar() {
  const { session, username, avatarHeadSlug, avatarBodySlug, avatarVariantId } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === 'true';
    } catch {
      return false;
    }
  });

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
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      <button
        type="button"
        className="sidebar-collapse-btn"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      <Link to="/" className="sidebar-brand" title="DexForge">
        {collapsed ? 'D' : 'DexForge'}
      </Link>

      <NavLink
        to={session ? '/profile' : '/sign-in'}
        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        title={session ? `Signed in as ${username || 'you'}` : 'Sign in'}
      >
        {session ? (
          <SidebarAvatar headSlug={avatarHeadSlug} bodySlug={avatarBodySlug} variantId={avatarVariantId} />
        ) : (
          <User size={18} strokeWidth={2} />
        )}
        {!collapsed && <span>{session ? username || 'Account' : 'Sign in'}</span>}
      </NavLink>

      {!collapsed && (
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
        >
          <Settings size={18} strokeWidth={2} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
