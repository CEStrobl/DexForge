import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, Table2, LayoutGrid } from 'lucide-react';
import { api } from '../api/client';
import { useFusionLists } from '../context/FusionListsContext';
import { usePinTarget } from '../context/PinTargetContext';
import { FusionPairAdd } from '../components/fusion-list/FusionPairAdd';
import { FusionColumnPicker } from '../components/fusion-list/FusionColumnPicker';
import { FusionListTable } from '../components/fusion-list/FusionListTable';
import { FusionGalleryView } from '../components/fusion-list/FusionGalleryView';
import { EditableListName } from '../components/list-builder/EditableListName';
import { LabelManager } from '../components/list-builder/LabelManager';
import { DEFAULT_FUSION_LIST_COLUMNS } from '../components/fusion-list/fusionColumns';
import '../styles/list-builder.css';
import '../styles/compare.css';
import '../styles/fusion-list.css';
import '../styles/fusion-art.css';

const VIEW_MODE_STORAGE_KEY = 'dexforge-list-view-mode';

function entryKey(entry) {
  return `${entry.head_slug}|${entry.body_slug}`;
}

export default function FusionListPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { fusionLists, refresh } = useFusionLists();

  const [name, setName] = useState('');
  const [columns, setColumns] = useState(DEFAULT_FUSION_LIST_COLUMNS);
  const [columnWidths, setColumnWidths] = useState({});
  const [labels, setLabels] = useState([]);
  const [entries, setEntries] = useState([]);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem(VIEW_MODE_STORAGE_KEY) || 'table');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const dirtyRef = useRef(false);
  const hydratedForRef = useRef(null);

  usePinTarget(listId && name ? `/fusion-list/${listId}` : null, listId && name ? `Fusion List: ${name}` : null);

  // Same hydrate-from-route pattern as ListBuilderPage: guarded so that fusionLists
  // refreshing after our own autosave doesn't stomp in-progress local state.
  useEffect(() => {
    if (hydratedForRef.current === listId) return;

    if (!listId) {
      hydratedForRef.current = listId;
      dirtyRef.current = false;
      setName('');
      setColumns(DEFAULT_FUSION_LIST_COLUMNS);
      setColumnWidths({});
      setLabels([]);
      setEntries([]);
      setSaveStatus('idle');
      return;
    }

    const list = fusionLists.find((l) => l.id === Number(listId));
    if (!list) return;

    hydratedForRef.current = listId;
    dirtyRef.current = false;
    setName(list.name);
    setColumns(list.visible_columns?.length > 0 ? list.visible_columns : DEFAULT_FUSION_LIST_COLUMNS);
    setColumnWidths(list.column_widths || {});
    setLabels(list.labels || []);
    setEntries(
      list.entries.map((e) => ({
        head_slug: e.head_slug,
        body_slug: e.body_slug,
        label_ids: e.label_ids || [],
        selected_variant: e.selected_variant || null,
      }))
    );
    setSaveStatus('idle');
  }, [listId, fusionLists]);

  useEffect(() => {
    if (!dirtyRef.current) return;
    const timer = setTimeout(() => {
      dirtyRef.current = false;
      autosave();
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, columns, columnWidths, labels, entries]);

  function nextUntitledName() {
    const base = 'Untitled Fusion List';
    const existing = new Set(fusionLists.map((l) => l.name));
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
      visible_columns: columns,
      column_widths: columnWidths,
      labels,
      entries: entries.map((e) => ({
        head_slug: e.head_slug,
        body_slug: e.body_slug,
        label_ids: e.label_ids || [],
        selected_variant: e.selected_variant || null,
      })),
    };
    try {
      const result = listId
        ? await api.put(`/api/fusion-lists/${listId}`, payload)
        : await api.post('/api/fusion-lists', payload);
      if (!listId) {
        hydratedForRef.current = String(result.id);
        navigate(`/fusion-list/${result.id}`, { replace: true });
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

  function addFusion(headSlug, bodySlug) {
    dirtyRef.current = true;
    setEntries((prev) =>
      prev.some((e) => e.head_slug === headSlug && e.body_slug === bodySlug)
        ? prev
        : [...prev, { head_slug: headSlug, body_slug: bodySlug, label_ids: [] }]
    );
  }

  function removeFusion(key) {
    dirtyRef.current = true;
    setEntries((prev) => prev.filter((e) => entryKey(e) !== key));
  }

  function reorderEntries(newOrder) {
    dirtyRef.current = true;
    setEntries(newOrder);
  }

  function changeHead(key, newHeadSlug) {
    dirtyRef.current = true;
    setEntries((prev) => prev.map((e) => (entryKey(e) === key ? { ...e, head_slug: newHeadSlug } : e)));
  }

  function changeBody(key, newBodySlug) {
    dirtyRef.current = true;
    setEntries((prev) => prev.map((e) => (entryKey(e) === key ? { ...e, body_slug: newBodySlug } : e)));
  }

  function swapOrientation(key) {
    dirtyRef.current = true;
    setEntries((prev) =>
      prev.map((e) => (entryKey(e) === key ? { ...e, head_slug: e.body_slug, body_slug: e.head_slug } : e))
    );
  }

  function toggleEntryLabel(key, labelId) {
    dirtyRef.current = true;
    setEntries((prev) =>
      prev.map((e) => {
        if (entryKey(e) !== key) return e;
        const current = e.label_ids || [];
        const next = current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId];
        return { ...e, label_ids: next };
      })
    );
  }

  function selectVariant(key, variantId) {
    dirtyRef.current = true;
    setEntries((prev) => prev.map((e) => (entryKey(e) === key ? { ...e, selected_variant: variantId } : e)));
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
    if (!window.confirm('Delete this fusion list? This cannot be undone.')) return;
    await api.delete(`/api/fusion-lists/${listId}`);
    refresh();
    navigate('/fusion-list');
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
                aria-label="Delete fusion list"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <FusionPairAdd onAdd={addFusion} />

        <LabelManager labels={labels} onAdd={addLabel} onUpdate={updateLabel} onDelete={deleteLabel} />

        <div className="list-builder-table-header">
          <h3 className="card-heading">
            Your Fusions <span className="text-muted">({entries.length})</span>
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
            <FusionColumnPicker columns={columns} onChange={updateColumns} />
          </div>
        </div>
        {viewMode === 'gallery' ? (
          <FusionGalleryView
            entries={entries}
            columns={columns}
            labels={labels}
            onRemove={removeFusion}
            onReorder={reorderEntries}
            onChangeHead={changeHead}
            onChangeBody={changeBody}
            onSwapOrientation={swapOrientation}
            onToggleLabel={toggleEntryLabel}
            onSelectVariant={selectVariant}
          />
        ) : (
          <FusionListTable
            entries={entries}
            columns={columns}
            columnWidths={columnWidths}
            labels={labels}
            onRemove={removeFusion}
            onReorder={reorderEntries}
            onChangeHead={changeHead}
            onChangeBody={changeBody}
            onSwapOrientation={swapOrientation}
            onReorderColumns={reorderColumns}
            onResizeColumn={resizeColumn}
            onToggleLabel={toggleEntryLabel}
            onSelectVariant={selectVariant}
          />
        )}
      </div>
    </div>
  );
}
