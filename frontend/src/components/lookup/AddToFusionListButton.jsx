import { useEffect, useRef, useState } from 'react';
import { ListPlus, Plus, Check } from 'lucide-react';
import { api } from '../../api/client';
import { useFusionLists } from '../../context/FusionListsContext';

// Same Outlook-style "move to folder" picker as AddToListButton, targeting fusion lists.
export function AddToFusionListButton({ headSlug, bodySlug }) {
  const { fusionLists, refresh } = useFusionLists();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | error
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setStatus('idle');
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const q = query.trim().toLowerCase();
  const matches = q ? fusionLists.filter((l) => l.name.toLowerCase().includes(q)) : fusionLists;
  const exactMatch = fusionLists.find((l) => l.name.toLowerCase() === q);

  function alreadyInList(list) {
    return list.entries.some((e) => e.head_slug === headSlug && e.body_slug === bodySlug);
  }

  async function addToList(list) {
    if (alreadyInList(list)) {
      setOpen(false);
      return;
    }
    setStatus('saving');
    try {
      await api.put(`/api/fusion-lists/${list.id}`, {
        name: list.name,
        visible_columns: list.visible_columns,
        column_widths: list.column_widths,
        labels: list.labels,
        entries: [
          ...list.entries.map((e) => ({ head_slug: e.head_slug, body_slug: e.body_slug, label_ids: e.label_ids })),
          { head_slug: headSlug, body_slug: bodySlug, label_ids: [] },
        ],
      });
      refresh();
      setOpen(false);
    } catch {
      setStatus('error');
    }
  }

  async function createAndAdd() {
    const name = query.trim();
    if (!name) return;
    setStatus('saving');
    try {
      await api.post('/api/fusion-lists', {
        name,
        entries: [{ head_slug: headSlug, body_slug: bodySlug, label_ids: [] }],
      });
      refresh();
      setOpen(false);
    } catch {
      setStatus('error');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (exactMatch) addToList(exactMatch);
    else if (matches.length > 0) addToList(matches[0]);
    else if (q) createAndAdd();
  }

  return (
    <div className="add-to-list-wrap" ref={containerRef}>
      <button type="button" className="action-btn" onClick={() => setOpen((prev) => !prev)}>
        <ListPlus size={16} />
        Add to Fusion List
      </button>
      {open && (
        <div className="add-to-list-popover">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or create a fusion list..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={status === 'saving'}
          />
          <div className="add-to-list-results">
            {matches.map((list) => (
              <button
                key={list.id}
                type="button"
                className="add-to-list-result-item"
                onClick={() => addToList(list)}
                disabled={status === 'saving'}
              >
                <span>{list.name}</span>
                {alreadyInList(list) ? (
                  <span className="text-muted add-to-list-already">
                    <Check size={12} /> Added
                  </span>
                ) : (
                  <span className="text-muted">{list.entries.length}</span>
                )}
              </button>
            ))}
            {q && !exactMatch && (
              <button
                type="button"
                className="add-to-list-result-item add-to-list-create"
                onClick={createAndAdd}
                disabled={status === 'saving'}
              >
                <Plus size={12} />
                Create "{query.trim()}"
              </button>
            )}
            {matches.length === 0 && !q && (
              <p className="text-muted add-to-list-empty">No fusion lists yet — type a name to create one.</p>
            )}
          </div>
          {status === 'error' && <span className="add-to-list-error">Failed — try again</span>}
        </div>
      )}
    </div>
  );
}
