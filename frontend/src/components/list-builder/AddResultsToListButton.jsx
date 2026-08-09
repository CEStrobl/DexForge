import { useEffect, useRef, useState } from 'react';
import { ListPlus, Plus } from 'lucide-react';
import { api } from '../../api/client';
import { useSavedLists } from '../../context/SavedListsContext';

// Bulk sibling of Lookup's AddToListButton — same Outlook-style "move to folder"
// picker, but merges a whole set of search-result Pokémon into the chosen list at
// once rather than a single slug. Used by the Dex Filter page, which is its own
// standalone tool now (see Notes/dexfilter.md) rather than sharing state with
// whichever list happens to be open in List Builder.
export function AddResultsToListButton({ pokemonList, label = 'Add to List', disabled }) {
  const { savedLists, refresh } = useSavedLists();
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
  const matches = q ? savedLists.filter((l) => l.name.toLowerCase().includes(q)) : savedLists;
  const exactMatch = savedLists.find((l) => l.name.toLowerCase() === q);

  function newEntries() {
    return pokemonList.map((p) => ({ slug: p.selected_variant || p.name, label_ids: [] }));
  }

  async function addToList(list) {
    setStatus('saving');
    const existingSlugs = new Set(list.entries.map((e) => e.pokemon_slug));
    const additions = newEntries().filter((e) => !existingSlugs.has(e.slug));
    try {
      await api.put(`/api/lists/${list.id}`, {
        name: list.name,
        criteria: list.criteria,
        visible_columns: list.visible_columns,
        column_widths: list.column_widths,
        labels: list.labels,
        entries: [...list.entries.map((e) => ({ slug: e.pokemon_slug, label_ids: e.label_ids })), ...additions],
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
      await api.post('/api/lists', { name, entries: newEntries() });
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
      <button type="button" className="action-btn" onClick={() => setOpen((prev) => !prev)} disabled={disabled}>
        <ListPlus size={14} />
        {label}
      </button>
      {open && (
        <div className="add-to-list-popover">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or create a list..."
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
                <span className="text-muted">{list.entries.length}</span>
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
              <p className="text-muted add-to-list-empty">No lists yet — type a name to create one.</p>
            )}
          </div>
          {status === 'error' && <span className="add-to-list-error">Failed — try again</span>}
        </div>
      )}
    </div>
  );
}
