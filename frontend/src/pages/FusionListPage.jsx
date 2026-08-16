import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table2, LayoutGrid, Bookmark, Copy } from 'lucide-react';
import { api } from '../api/client';
import { useFusionLists } from '../context/FusionListsContext';
import { usePinTarget } from '../context/PinTargetContext';
import { FusionPairAdd } from '../components/fusion-list/FusionPairAdd';
import { FusionColumnPicker } from '../components/fusion-list/FusionColumnPicker';
import { ListOptionsMenu } from '../components/list-builder/ListOptionsMenu';
import { FusionListTable } from '../components/fusion-list/FusionListTable';
import { FusionGalleryView } from '../components/fusion-list/FusionGalleryView';
import { EditableListName } from '../components/list-builder/EditableListName';
import { LabelManager } from '../components/list-builder/LabelManager';
import { SidebarAvatar } from '../components/profile/SidebarAvatar';
import { DEFAULT_FUSION_LIST_COLUMNS } from '../components/fusion-list/fusionColumns';
import '../styles/list-builder.css';
import '../styles/compare.css';
import '../styles/fusion-list.css';
import '../styles/fusion-art.css';

const VIEW_MODE_STORAGE_KEY = 'dexforge-list-view-mode';

function noop() {}

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
  const [meta, setMeta] = useState({ isOwner: false, isPublic: false, shareToken: null, owner: null });
  const [bookmarkStatus, setBookmarkStatus] = useState('idle');
  const dirtyRef = useRef(false);
  const hydratedForRef = useRef(null);

  usePinTarget(listId && name ? `/fusion-list/${listId}` : null, listId && name ? `Fusion List: ${name}` : null);

  // Fetches by :listId directly (not from the owned-lists cache) so a fusion list owned
  // by someone else — reached via a public share link — loads too. See ListBuilderPage's
  // identical hydration effect for the guard-against-own-autosave rationale.
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
      setMeta({ isOwner: true, isPublic: false, shareToken: null, owner: null });
      return;
    }

    hydratedForRef.current = listId;
    api
      .get(`/api/fusion-lists/${listId}`)
      .then((list) => {
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
        setMeta({
          isOwner: list.is_owner,
          isPublic: list.is_public,
          shareToken: list.share_token,
          owner: list.owner,
        });
      })
      .catch(() => {
        setEntries([]);
        navigate('/fusion-list', { replace: true });
      });
  }, [listId, navigate]);

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
        setMeta({ isOwner: true, isPublic: false, shareToken: null, owner: null });
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
    setEntries((prev) => {
      // Same duplicate-identity hazard as ListBuilderPage's swapEntry: evolving/devolving
      // a head into a pair that already exists elsewhere in the list would create two
      // entries with the same entryKey, breaking dnd-kit's sortable ids. Drop this slot
      // instead — the target pair already has its own entry.
      const wouldDuplicate = prev.some(
        (e) => e.head_slug === newHeadSlug && e.body_slug === prev.find((x) => entryKey(x) === key)?.body_slug && entryKey(e) !== key
      );
      if (wouldDuplicate) {
        return prev.filter((e) => entryKey(e) !== key);
      }
      return prev.map((e) => (entryKey(e) === key ? { ...e, head_slug: newHeadSlug } : e));
    });
  }

  function changeBody(key, newBodySlug) {
    dirtyRef.current = true;
    setEntries((prev) => {
      const wouldDuplicate = prev.some(
        (e) => e.body_slug === newBodySlug && e.head_slug === prev.find((x) => entryKey(x) === key)?.head_slug && entryKey(e) !== key
      );
      if (wouldDuplicate) {
        return prev.filter((e) => entryKey(e) !== key);
      }
      return prev.map((e) => (entryKey(e) === key ? { ...e, body_slug: newBodySlug } : e));
    });
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

  async function handleTogglePublic(nextPublic) {
    const result = await api.patch(`/api/fusion-lists/${listId}/visibility`, { is_public: nextPublic });
    setMeta((prev) => ({ ...prev, isPublic: result.is_public, shareToken: result.share_token }));
  }

  async function handleSaveToProfile() {
    setBookmarkStatus('saving');
    try {
      await api.post('/api/list-saves', { list_type: 'fusion', list_id: Number(listId) });
      setBookmarkStatus('saved');
      setTimeout(() => setBookmarkStatus('idle'), 1500);
    } catch {
      setBookmarkStatus('idle');
    }
  }

  async function handleCopyToProfile() {
    const result = await api.post(`/api/fusion-lists/${listId}/copy`);
    refresh();
    navigate(`/fusion-list/${result.id}`);
  }

  // See ListBuilderPage's identical guard: meta.isOwner defaults to false so owner-only
  // controls don't briefly flash for a non-owner while an existing list's fetch is in flight.
  const isOwner = !listId || meta.isOwner;
  const shareUrl = meta.shareToken ? `${window.location.origin}/fusion-list/${listId}` : '';

  return (
    <div className="list-builder-page">
      <div className="card list-builder-full">
        <div className="list-builder-name-row">
          {isOwner ? (
            <EditableListName name={name} onChange={updateName} />
          ) : (
            <h2 className="list-builder-readonly-name">{name}</h2>
          )}
          <div className="list-builder-name-row-controls">
            {isOwner && (
              <span className={`autosave-status${saveStatus === 'error' ? ' autosave-status-error' : ''}`}>
                {saveStatus === 'saving' && 'Saving…'}
                {saveStatus === 'saved' && 'Saved'}
                {saveStatus === 'error' && (saveError || 'Failed to save — will retry on next edit')}
              </span>
            )}
            {listId && isOwner && (
              <ListOptionsMenu
                isPublic={meta.isPublic}
                shareUrl={shareUrl}
                onTogglePublic={handleTogglePublic}
                onDelete={handleDeleteActiveList}
                deleteLabel="Delete fusion list"
              />
            )}
            {listId && !isOwner && (
              <>
                <button type="button" className="action-btn action-btn-ghost" onClick={handleSaveToProfile}>
                  <Bookmark size={14} />
                  {bookmarkStatus === 'saved' ? 'Saved!' : 'Save'}
                </button>
                <button type="button" className="action-btn" onClick={handleCopyToProfile}>
                  <Copy size={14} />
                  Copy to Profile
                </button>
              </>
            )}
          </div>
        </div>

        {listId && (
          <div className="list-builder-subheader">
            <span>{meta.isPublic ? 'Public' : 'Private'}</span>
            <span>·</span>
            <span>
              {entries.length} {entries.length === 1 ? 'Fusion' : 'Fusions'}
            </span>
            {!isOwner && meta.owner && (
              <Link to={`/profile/${meta.owner.username}`} className="list-builder-author">
                <SidebarAvatar
                  headSlug={meta.owner.avatar_head_slug}
                  bodySlug={meta.owner.avatar_body_slug}
                  variantId={meta.owner.avatar_variant_id}
                />
                by {meta.owner.username}
              </Link>
            )}
          </div>
        )}

        {isOwner && <FusionPairAdd onAdd={addFusion} />}

        {isOwner && <LabelManager labels={labels} onAdd={addLabel} onUpdate={updateLabel} onDelete={deleteLabel} />}

        <div className="list-builder-table-header">
          <h3 className="card-heading">
            {isOwner ? 'Your Fusions' : 'Fusions'} <span className="text-muted">({entries.length})</span>
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
            {isOwner && <FusionColumnPicker columns={columns} onChange={updateColumns} />}
          </div>
        </div>
        {viewMode === 'gallery' ? (
          <FusionGalleryView
            entries={entries}
            columns={columns}
            labels={labels}
            onRemove={isOwner ? removeFusion : noop}
            onReorder={isOwner ? reorderEntries : noop}
            onChangeHead={isOwner ? changeHead : noop}
            onChangeBody={isOwner ? changeBody : noop}
            onSwapOrientation={isOwner ? swapOrientation : noop}
            onToggleLabel={isOwner ? toggleEntryLabel : noop}
            onSelectVariant={isOwner ? selectVariant : noop}
            readOnly={!isOwner}
          />
        ) : (
          <FusionListTable
            entries={entries}
            columns={columns}
            columnWidths={columnWidths}
            labels={labels}
            onRemove={isOwner ? removeFusion : noop}
            onReorder={isOwner ? reorderEntries : noop}
            onChangeHead={isOwner ? changeHead : noop}
            onChangeBody={isOwner ? changeBody : noop}
            onSwapOrientation={isOwner ? swapOrientation : noop}
            onReorderColumns={isOwner ? reorderColumns : noop}
            onResizeColumn={isOwner ? resizeColumn : noop}
            onToggleLabel={isOwner ? toggleEntryLabel : noop}
            onSelectVariant={isOwner ? selectVariant : noop}
            readOnly={!isOwner}
          />
        )}
      </div>
    </div>
  );
}
