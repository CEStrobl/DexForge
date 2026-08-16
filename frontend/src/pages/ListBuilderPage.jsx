import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table2, LayoutGrid, Bookmark, Copy } from 'lucide-react';
import { api } from '../api/client';
import { useSavedLists } from '../context/SavedListsContext';
import { usePinTarget } from '../context/PinTargetContext';
import { PokemonSearchAdd } from '../components/list-builder/PokemonSearchAdd';
import { ColumnPicker } from '../components/list-builder/ColumnPicker';
import { ListOptionsMenu } from '../components/list-builder/ListOptionsMenu';
import { ListTable } from '../components/list-builder/ListTable';
import { GalleryView } from '../components/list-builder/GalleryView';
import { EditableListName } from '../components/list-builder/EditableListName';
import { LabelManager } from '../components/list-builder/LabelManager';
import { SidebarAvatar } from '../components/profile/SidebarAvatar';
import { DEFAULT_COLUMNS } from '../components/list-builder/columns';
import '../styles/list-builder.css';

const VIEW_MODE_STORAGE_KEY = 'dexforge-list-view-mode';

function noop() {}

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
  const [meta, setMeta] = useState({ isOwner: false, isPublic: false, shareToken: null, owner: null });
  const [bookmarkStatus, setBookmarkStatus] = useState('idle');
  const dirtyRef = useRef(false);
  const hydratedForRef = useRef(null);

  usePinTarget(listId && name ? `/list-builder/${listId}` : null, listId && name ? `List: ${name}` : null);

  // Fetches by :listId directly (not from the owned-lists cache) so a list owned by
  // someone else — reached via a public share link — loads too. Guarded to fetch once
  // per distinct listId, so our own autosave round-trip (which briefly navigates from no
  // id to a fresh one) doesn't re-fetch and stomp in-progress local state.
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
      setMeta({ isOwner: true, isPublic: false, shareToken: null, owner: null });
      return;
    }

    hydratedForRef.current = listId;
    api
      .get(`/api/lists/${listId}`)
      .then((list) => {
        dirtyRef.current = false;
        setName(list.name);
        setCriteria(list.criteria || {});
        setColumns(list.visible_columns?.length > 0 ? list.visible_columns : DEFAULT_COLUMNS);
        setColumnWidths(list.column_widths || {});
        setLabels(list.labels || []);
        setSaveStatus('idle');
        setMeta({
          isOwner: list.is_owner,
          isPublic: list.is_public,
          shareToken: list.share_token,
          owner: list.owner,
        });

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
      })
      .catch(() => {
        setEntries([]);
        navigate('/list-builder', { replace: true });
      });
  }, [listId, navigate]);

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
        setMeta({ isOwner: true, isPublic: false, shareToken: null, owner: null });
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

  async function handleTogglePublic(nextPublic) {
    const result = await api.patch(`/api/lists/${listId}/visibility`, { is_public: nextPublic });
    setMeta((prev) => ({ ...prev, isPublic: result.is_public, shareToken: result.share_token }));
  }

  async function handleSaveToProfile() {
    setBookmarkStatus('saving');
    try {
      await api.post('/api/list-saves', { list_type: 'saved', list_id: Number(listId) });
      setBookmarkStatus('saved');
      setTimeout(() => setBookmarkStatus('idle'), 1500);
    } catch {
      setBookmarkStatus('idle');
    }
  }

  async function handleCopyToProfile() {
    const result = await api.post(`/api/lists/${listId}/copy`);
    refresh();
    navigate(`/list-builder/${result.id}`);
  }

  // A brand-new (no listId yet) list is always owned by whoever's creating it; an
  // existing listId's ownership isn't known until the fetch resolves, so meta.isOwner
  // defaults to false — showing owner-only controls before that would briefly expose
  // them to a non-owner/anonymous visitor on someone else's public list.
  const isOwner = !listId || meta.isOwner;
  const shareUrl = meta.shareToken ? `${window.location.origin}/list-builder/${listId}` : '';

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
                deleteLabel="Delete list"
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
              {entries.length} {entries.length === 1 ? 'Pokémon' : 'Pokémon'}
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

        {isOwner && <PokemonSearchAdd onAdd={addPokemon} />}

        {isOwner && <LabelManager labels={labels} onAdd={addLabel} onUpdate={updateLabel} onDelete={deleteLabel} />}

        <div className="list-builder-table-header">
          <h3 className="card-heading">
            {isOwner ? 'Your List' : 'List'} <span className="text-muted">({entries.length})</span>
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
            {isOwner && <ColumnPicker columns={columns} onChange={updateColumns} />}
          </div>
        </div>
        {viewMode === 'gallery' ? (
          <GalleryView
            entries={entries}
            columns={columns}
            labels={labels}
            onRemove={isOwner ? removePokemon : noop}
            onReorder={isOwner ? reorderEntries : noop}
            onSwap={isOwner ? swapEntry : noop}
            onToggleLabel={isOwner ? toggleEntryLabel : noop}
            readOnly={!isOwner}
          />
        ) : (
          <ListTable
            entries={entries}
            columns={columns}
            columnWidths={columnWidths}
            labels={labels}
            onRemove={isOwner ? removePokemon : noop}
            onReorder={isOwner ? reorderEntries : noop}
            onSwap={isOwner ? swapEntry : noop}
            onReorderColumns={isOwner ? reorderColumns : noop}
            onResizeColumn={isOwner ? resizeColumn : noop}
            onToggleLabel={isOwner ? toggleEntryLabel : noop}
            readOnly={!isOwner}
          />
        )}
      </div>
    </div>
  );
}
