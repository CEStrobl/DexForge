import { Plus, Trash2 } from 'lucide-react';

export function SavedListsPanel({ savedLists, activeListId, onSelect, onNew, onDelete }) {
  return (
    <div className="card">
      <h3 className="card-heading">Saved Lists</h3>
      <button type="button" className="action-btn saved-lists-new-btn" onClick={onNew}>
        <Plus size={16} />
        New List
      </button>
      {savedLists.length === 0 ? (
        <p className="text-muted">No saved lists yet.</p>
      ) : (
        <ul className="saved-lists-list">
          {savedLists.map((list) => (
            <li key={list.id} className={list.id === activeListId ? 'active' : ''}>
              <button type="button" className="saved-lists-item-btn" onClick={() => onSelect(list.id)}>
                <span>{list.name}</span>
                <span className="text-muted saved-lists-count">{list.entries.length}</span>
              </button>
              <button
                type="button"
                className="saved-lists-delete-btn"
                onClick={() => onDelete(list.id)}
                aria-label={`Delete ${list.name}`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
