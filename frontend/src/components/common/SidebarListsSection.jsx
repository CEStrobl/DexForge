import { Link, NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSavedLists } from '../../context/SavedListsContext';
import { useFusionLists } from '../../context/FusionListsContext';
import { useInfiniteFusion } from '../../context/InfiniteFusionContext';

export function SidebarListsSection() {
  const { session } = useAuth();
  const { savedLists } = useSavedLists();
  const { fusionLists } = useFusionLists();
  const { enabled: infiniteFusionEnabled } = useInfiniteFusion();

  if (!session) return null;

  return (
    <>
      <div className="sidebar-lists">
        <div className="sidebar-lists-header">
          <span>Lists</span>
          <Link to="/list-builder" className="sidebar-lists-new-btn" title="New list" aria-label="New list">
            <Plus size={13} />
          </Link>
        </div>
        {savedLists.length === 0 ? (
          <p className="sidebar-lists-empty">No saved lists yet.</p>
        ) : (
          <div className="sidebar-lists-scroll">
            {savedLists.map((l) => (
              <NavLink
                key={l.id}
                to={`/list-builder/${l.id}`}
                className={({ isActive }) => `sidebar-lists-link${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-lists-link-name">{l.name}</span>
                <span className="sidebar-lists-link-count">{l.entries.length}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>

      {infiniteFusionEnabled && (
        <div className="sidebar-lists">
          <div className="sidebar-lists-header">
            <span>Fusion Lists</span>
            <Link to="/fusion-list" className="sidebar-lists-new-btn" title="New fusion list" aria-label="New fusion list">
              <Plus size={13} />
            </Link>
          </div>
          {fusionLists.length === 0 ? (
            <p className="sidebar-lists-empty">No fusion lists yet.</p>
          ) : (
            <div className="sidebar-lists-scroll">
              {fusionLists.map((l) => (
                <NavLink
                  key={l.id}
                  to={`/fusion-list/${l.id}`}
                  className={({ isActive }) => `sidebar-lists-link${isActive ? ' active' : ''}`}
                >
                  <span className="sidebar-lists-link-name">{l.name}</span>
                  <span className="sidebar-lists-link-count">{l.entries.length}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
