import { Link } from 'react-router-dom';
import { Plus, GitMerge } from 'lucide-react';
import { useSavedLists } from '../context/SavedListsContext';
import { useFusionLists } from '../context/FusionListsContext';
import { useInfiniteFusion } from '../context/InfiniteFusionContext';
import '../styles/lists-home.css';

// Fusion lists are lists too — same shape, just fancier entries — so this page shows both
// kinds together in one combined, recency-sorted view rather than two partitioned sections.
export default function ListsHomePage() {
  const { savedLists } = useSavedLists();
  const { fusionLists } = useFusionLists();
  const { enabled: infiniteFusionEnabled } = useInfiniteFusion();

  const combined = [
    ...savedLists.map((l) => ({ ...l, kind: 'saved', to: `/list-builder/${l.id}` })),
    ...(infiniteFusionEnabled ? fusionLists.map((l) => ({ ...l, kind: 'fusion', to: `/fusion-list/${l.id}` })) : []),
  ].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  return (
    <div className="lists-home-page">
      <div className="lists-home-header">
        <h1>Lists</h1>
        <div className="lists-home-header-actions">
          <Link to="/list-builder" className="action-btn">
            <Plus size={14} />
            New List
          </Link>
          {infiniteFusionEnabled && (
            <Link to="/fusion-list" className="action-btn">
              <Plus size={14} />
              New Fusion List
            </Link>
          )}
        </div>
      </div>

      {combined.length === 0 ? (
        <div className="card lists-home-empty">
          <p className="text-muted">No lists yet — create one to get started.</p>
        </div>
      ) : (
        <div className="lists-home-grid">
          {combined.map((l) => (
            <Link key={`${l.kind}-${l.id}`} to={l.to} className="card lists-home-card">
              <div className="lists-home-card-header">
                <span className="lists-home-card-name">{l.name}</span>
                {l.kind === 'fusion' && (
                  <span className="lists-home-card-badge">
                    <GitMerge size={12} />
                    Fusion
                  </span>
                )}
              </div>
              <span className="text-muted">
                {l.entries.length} {l.entries.length === 1 ? 'entry' : 'entries'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
