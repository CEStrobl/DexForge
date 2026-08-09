import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, Table2, LayoutGrid } from 'lucide-react';
import { api } from '../api/client';
import { useSavedLists } from '../context/SavedListsContext';
import { usePinTarget } from '../context/PinTargetContext';
import { PokemonSearchAdd } from '../components/list-builder/PokemonSearchAdd';
import { ColumnPicker } from '../components/list-builder/ColumnPicker';
import { ListTable } from '../components/list-builder/ListTable';
import { GalleryView } from '../components/list-builder/GalleryView';
import { EditableListName } from '../components/list-builder/EditableListName';
import { LabelManager } from '../components/list-builder/LabelManager';
import { DEFAULT_COLUMNS } from '../components/list-builder/columns';
import '../styles/list-builder.css';

const VIEW_MODE_STORAGE_KEY = 'dexforge-list-view-mode';

// Single-purpose now: view/manage saved lists. The criteria-filter tool that used
// to live here as a "Search" tab is its own page — see Notes/dexfilter.md.
export default function ListBuilderPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { savedLists, refresh } = useSavedLists();

  const [name, setName] = useState('');
  const [criteria, setCriteria] = useState({});
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [columnWidths, setColumnWidths] = useState({});
  const [labels, setLabels] = useState([]);
  const [entries, setEntries] = useState([]);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem(VIEW_MODE_STORAGE_KEY) || 'table');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const dirtyRef = useRef(false);
  const hydratedForRef = useRef(null);

  usePinTarget(listId && name ? `/list-builder/${listId}` : null, listId && name ? `List: ${name}` : null);

  // Hydrate the editor from the route's :listId. Guarded by hydratedForRef so that
  // savedLists refreshing after our own autosave (same listId) doesn't re-hydrate and
  // stomp in-progress local state / re-fetch entries unnecessarily — only an actual
  // navigation to a different listId (or savedLists finishing its first load) does.
  useEffect(() => {
    if (hydratedForRef.current === listId) return;

    if (!listId) {
      hydratedForRef.current = listId;
      dirtyRef.current = false;
      setName('');
      setCriteria({});
      setColumns(DEFAULT_COLUMNS);
      setColumnWidths({});
      setLabels([]);
      setEntries([]);
      setSaveStatus('idle');
      return;
    }

    const list = savedLists.find((l) => l.id === Number(listId));
    if (!list) return; // savedLists hasn't loaded (yet) — effect re-runs when it does

    hydratedForRef.current = listId;
    dirtyRef.current = false;
    setName(list.name);
    setCriteria(list.criteria || {});
    setColumns(list.visible_columns?.length > 0 ? list.visible_columns : DEFAULT_COLUMNS);
    setColumnWidths(list.column_widths || {});
    setLabels(list.labels || []);
    setSaveStatus('idle');

    if (list.entries.length === 0) {
      setEntries([]);
      return;
    }
    const labelIdsBySlug = Object.fromEntries(list.entries.map((e) => [e.pokemon_slug, e.label_ids || []]));
    const slugs = list.entries.map((e) => e.pokemon_slug);
    api
      .post('/api/pokemon/bulk', { slugs })
      .then((mons) =>
        setEntries(mons.map((m) => ({ ...m, label_ids: labelIdsBySlug[m.selected_variant || m.name] || [] })))
      )
      .catch(() => setEntries([]));
  }, [listId, savedLists]);

  // Autosave: debounce any user-driven edit to name/criteria/columns/entries.
  // dirtyRef is only set by the mutating handlers below (not by the hydration effect),
  // so loading a list never triggers a spurious save.
  useEffect(() => {
    if (!dirtyRef.current) return;
    const timer = setTimeout(() => {
      dirtyRef.current = false;
      autosave();
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, criteria, columns, columnWidths, labels, entries]);

  function nextUntitledName() {
    const base = 'Untitled List';
    const existing = new Set(savedLists.map((l) => l.name));
    if (!existing.has(base)) return base;
    let i = 2;
    while (existing.has(`${base} ${i}`)) i++;
    return `${base} ${i}`;
  }

  async function autosave() {
    const finalName = name.trim() || nextUntitledName();
    setSaveStatus('saving');
    const payload = {
      name: finalName,
      criteria,
      visible_columns: columns,
      column_widths: columnWidths,
      labels,
      entries: entries.map((e) => ({ slug: e.selected_variant || e.name, label_ids: e.label_ids || [] })),
    };
    try {
      const result = listId
        ? await api.put(`/api/lists/${listId}`, payload)
        : await api.post('/api/lists', payload);
      if (!listId) {
        hydratedForRef.current = String(result.id);
        navigate(`/list-builder/${result.id}`, { replace: true });
      }
      if (!name.trim()) setName(finalName);
      setSaveStatus('saved');
      refresh();
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (err) {
      setSaveError(err.message || 'Failed to save');
      setSaveStatus('error');
    }
  }

  function addPokemon(pokemon) {
    dirtyRef.current = true;
    setEntries((prev) => (prev.some((e) => e.name === pokemon.name) ? prev : [...prev, pokemon]));
  }

  function removePokemon(slug) {
    dirtyRef.current = true;
    setEntries((prev) => prev.filter((e) => e.name !== slug));
  }

  function reorderEntries(newOrder) {
    dirtyRef.current = true;
    setEntries(newOrder);
  }

  function swapEntry(oldSlug, newPokemon) {
    dirtyRef.current = true;
    setEntries((prev) =>
      prev.map((e) => (e.name === oldSlug ? { ...newPokemon, label_ids: e.label_ids || [] } : e))
    );
  }

  function toggleEntryLabel(slug, labelId) {
    dirtyRef.current = true;
    setEntries((prev) =>
      prev.map((e) => {
        if ((e.selected_variant || e.name) !== slug) return e;
        const current = e.label_ids || [];
        const next = current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId];
        return { ...e, label_ids: next };
      })
    );
  }

  function addLabel(label) {
    dirtyRef.current = true;
    setLabels((prev) => [...prev, label]);
  }

  function updateLabel(labelId, patch) {
    dirtyRef.current = true;
    setLabels((prev) => prev.map((l) => (l.id === labelId ? { ...l, ...patch } : l)));
  }

  function deleteLabel(labelId) {
    dirtyRef.current = true;
    setLabels((prev) => prev.filter((l) => l.id !== labelId));
    setEntries((prev) =>
      prev.map((e) => ({ ...e, label_ids: (e.label_ids || []).filter((id) => id !== labelId) }))
    );
  }

  function reorderColumns(next) {
    dirtyRef.current = true;
    setColumns(next);
  }

  function resizeColumn(key, width) {
    dirtyRef.current = true;
    setColumnWidths((prev) => ({ ...prev, [key]: width }));
  }

  function updateName(next) {
    dirtyRef.current = true;
    setName(next);
  }

  function updateColumns(next) {
    dirtyRef.current = true;
    setColumns(next);
  }

  function updateViewMode(next) {
    setViewMode(next);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
  }

  async function handleDeleteActiveList() {
    if (!listId) return;
    if (!window.confirm('Delete this list? This cannot be undone.')) return;
    await api.delete(`/api/lists/${listId}`);
    refresh();
    navigate('/list-builder');
  }

  return (
    <div className="list-builder-page">
      <div className="card list-builder-full">
        <div className="list-builder-name-row">
          <EditableListName name={name} onChange={updateName} />
          <div className="list-builder-name-row-controls">
            <span className={`autosave-status${saveStatus === 'error' ? ' autosave-status-error' : ''}`}>
              {saveStatus === 'saving' && 'Saving…'}
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'error' && (saveError || 'Failed to save — will retry on next edit')}
            </span>
            {listId && (
              <button
                type="button"
                className="list-builder-delete-btn"
                onClick={handleDeleteActiveList}
                aria-label="Delete list"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <PokemonSearchAdd onAdd={addPokemon} />

        <LabelManager labels={labels} onAdd={addLabel} onUpdate={updateLabel} onDelete={deleteLabel} />

        <div className="list-builder-table-header">
          <h3 className="card-heading">
            Your List <span className="text-muted">({entries.length})</span>
          </h3>
          <div className="list-builder-table-header-controls">
            <div className="view-toggle">
              <button
                type="button"
                className={`view-toggle-btn${viewMode === 'table' ? ' active' : ''}`}
                onClick={() => updateViewMode('table')}
                aria-label="Table view"
                title="Table view"
              >
                <Table2 size={14} />
              </button>
              <button
                type="button"
                className={`view-toggle-btn${viewMode === 'gallery' ? ' active' : ''}`}
                onClick={() => updateViewMode('gallery')}
                aria-label="Gallery view"
                title="Gallery view"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
            <ColumnPicker columns={columns} onChange={updateColumns} />
          </div>
        </div>
        {viewMode === 'gallery' ? (
          <GalleryView
            entries={entries}
            columns={columns}
            labels={labels}
            onRemove={removePokemon}
            onReorder={reorderEntries}
            onSwap={swapEntry}
            onToggleLabel={toggleEntryLabel}
          />
        ) : (
          <ListTable
            entries={entries}
            columns={columns}
            columnWidths={columnWidths}
            labels={labels}
            onRemove={removePokemon}
            onReorder={reorderEntries}
            onSwap={swapEntry}
            onReorderColumns={reorderColumns}
            onResizeColumn={resizeColumn}
            onToggleLabel={toggleEntryLabel}
          />
        )}
      </div>
    </div>
  );
}
