import { Link, NavLink } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';
import { useSavedLists } from '../../context/SavedListsContext';
import { useFusionLists } from '../../context/FusionListsContext';
import { useInfiniteFusion } from '../../context/InfiniteFusionContext';

export function Sidebar() {
  const { savedLists } = useSavedLists();
  const { fusionLists } = useFusionLists();
  const { enabled: infiniteFusionEnabled } = useInfiniteFusion();

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-brand">
        DexForge
      </Link>

      <div className="sidebar-lists-groups">
        <div className="sidebar-lists">
          <div className="sidebar-lists-header">
            <span>Saved Lists</span>
            <NavLink to="/list-builder" className="sidebar-lists-new-btn" aria-label="New list" end>
              <Plus size={14} />
            </NavLink>
          </div>
          {savedLists.length === 0 ? (
            <p className="sidebar-lists-empty">No saved lists yet.</p>
          ) : (
            <div className="sidebar-lists-scroll">
              {savedLists.map((list) => (
                <NavLink
                  key={list.id}
                  to={`/list-builder/${list.id}`}
                  className={({ isActive }) => `sidebar-lists-link${isActive ? ' active' : ''}`}
                >
                  <span className="sidebar-lists-link-name">{list.name}</span>
                  <span className="sidebar-lists-link-count">{list.entries.length}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {infiniteFusionEnabled && (
          <div className="sidebar-lists">
            <div className="sidebar-lists-header">
              <span>Fusion Lists</span>
              <NavLink to="/fusion-list" className="sidebar-lists-new-btn" aria-label="New fusion list" end>
                <Plus size={14} />
              </NavLink>
            </div>
            {fusionLists.length === 0 ? (
              <p className="sidebar-lists-empty">No fusion lists yet.</p>
            ) : (
              <div className="sidebar-lists-scroll">
                {fusionLists.map((list) => (
                  <NavLink
                    key={list.id}
                    to={`/fusion-list/${list.id}`}
                    className={({ isActive }) => `sidebar-lists-link${isActive ? ' active' : ''}`}
                  >
                    <span className="sidebar-lists-link-name">{list.name}</span>
                    <span className="sidebar-lists-link-count">{list.entries.length}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <Settings size={18} strokeWidth={2} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
