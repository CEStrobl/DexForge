import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '../api/client';
import { Tabs } from '../components/common/Tabs';
import { SavedListsPanel } from '../components/list-builder/SavedListsPanel';
import { CriteriaPanel } from '../components/list-builder/CriteriaPanel';
import { SearchResultsTable } from '../components/list-builder/SearchResultsTable';
import { PokemonSearchAdd } from '../components/list-builder/PokemonSearchAdd';
import { ColumnPicker } from '../components/list-builder/ColumnPicker';
import { ListTable } from '../components/list-builder/ListTable';
import { EditableListName } from '../components/list-builder/EditableListName';
import { DEFAULT_COLUMNS } from '../components/list-builder/columns';
import '../styles/list-builder.css';

const TABS = [
  { key: 'lists', label: 'Lists' },
  { key: 'search', label: 'Search' },
];

export default function ListBuilderPage() {
  const [activeTab, setActiveTab] = useState('lists');
  const [savedLists, setSavedLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [name, setName] = useState('');
  const [criteria, setCriteria] = useState({});
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [entries, setEntries] = useState([]);
  const [matches, setMatches] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    loadSavedLists();
  }, []);

  function loadSavedLists() {
    api
      .get('/api/lists')
      .then(setSavedLists)
      .catch(() => setSavedLists([]));
  }

  function selectList(id) {
    const list = savedLists.find((l) => l.id === id);
    if (!list) return;
    setActiveListId(id);
    setName(list.name);
    setCriteria(list.criteria || {});
    setColumns(list.visible_columns?.length > 0 ? list.visible_columns : DEFAULT_COLUMNS);
    setSaveStatus('idle');

    const slugs = list.entries.map((e) => e.pokemon_slug);
    if (slugs.length === 0) {
      setEntries([]);
      return;
    }
    api
      .post('/api/pokemon/bulk', { slugs })
      .then(setEntries)
      .catch(() => setEntries([]));
  }

  function newList() {
    setActiveListId(null);
    setName('');
    setCriteria({});
    setColumns(DEFAULT_COLUMNS);
    setEntries([]);
    setSaveStatus('idle');
  }

  function addPokemon(pokemon) {
    setEntries((prev) => (prev.some((e) => e.name === pokemon.name) ? prev : [...prev, pokemon]));
  }

  function addAllMatches(matchList) {
    setEntries((prev) => {
      const existing = new Set(prev.map((e) => e.name));
      return [...prev, ...matchList.filter((m) => !existing.has(m.name))];
    });
  }

  function removePokemon(slug) {
    setEntries((prev) => prev.filter((e) => e.name !== slug));
  }

  function reorderEntries(newOrder) {
    setEntries(newOrder);
  }

  function swapEntry(oldSlug, newPokemon) {
    setEntries((prev) => prev.map((e) => (e.name === oldSlug ? newPokemon : e)));
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaveStatus('saving');
    const payload = {
      name: name.trim(),
      criteria,
      visible_columns: columns,
      pokemon_slugs: entries.map((e) => e.name),
    };
    try {
      const result = activeListId
        ? await api.put(`/api/lists/${activeListId}`, payload)
        : await api.post('/api/lists', payload);
      setActiveListId(result.id);
      setSaveStatus('saved');
      loadSavedLists();
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this list? This cannot be undone.')) return;
    await api.delete(`/api/lists/${id}`);
    if (id === activeListId) newList();
    loadSavedLists();
  }

  return (
    <div className="list-builder-page">
      <div className="list-builder-toolbar">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        <ColumnPicker columns={columns} onChange={setColumns} />
      </div>

      <div className="list-builder-tab-panel" style={{ display: activeTab === 'lists' ? undefined : 'none' }}>
        <div className="list-builder-grid">
          <div className="list-builder-column">
            <SavedListsPanel
              savedLists={savedLists}
              activeListId={activeListId}
              onSelect={selectList}
              onNew={newList}
              onDelete={handleDelete}
            />
          </div>

          <div className="list-builder-column list-builder-main">
            <div className="card">
              <div className="list-builder-name-row">
                <EditableListName name={name} onChange={setName} />
                <button
                  type="button"
                  className="action-btn"
                  onClick={handleSave}
                  disabled={saveStatus === 'saving' || !name.trim()}
                >
                  {saveStatus === 'saved' ? <Check size={16} /> : saveStatus === 'saving' ? 'Saving...' : 'Save List'}
                </button>
              </div>
              {saveStatus === 'error' && <span className="add-to-list-error">Failed to save — try again</span>}

              <PokemonSearchAdd onAdd={addPokemon} />

              <h3 className="card-heading">
                Your List <span className="text-muted">({entries.length})</span>
              </h3>
              <ListTable
                entries={entries}
                columns={columns}
                onRemove={removePokemon}
                onReorder={reorderEntries}
                onSwap={swapEntry}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="list-builder-tab-panel" style={{ display: activeTab === 'search' ? undefined : 'none' }}>
        <div className="list-builder-grid">
          <div className="list-builder-column">
            <CriteriaPanel criteria={criteria} onCriteriaChange={setCriteria} onResults={setMatches} />
          </div>

          <div className="list-builder-column list-builder-main">
            <div className="card">
              <SearchResultsTable results={matches} columns={columns} onAdd={addPokemon} onAddAll={addAllMatches} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
