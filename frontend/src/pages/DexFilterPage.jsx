import { useState } from 'react';
import { Tabs } from '../components/common/Tabs';
import { CriteriaPanel } from '../components/list-builder/CriteriaPanel';
import { AdvancedSearchPanel } from '../components/list-builder/AdvancedSearchPanel';
import { SearchResultsTable } from '../components/list-builder/SearchResultsTable';
import { DEFAULT_COLUMNS } from '../components/list-builder/columns';
import { DEFAULT_CRITERIA } from '../components/list-builder/criteria';
import '../styles/list-builder.css';

const MODE_TABS = [
  { key: 'search', label: 'Search' },
  { key: 'advanced', label: 'Advanced Search' },
];

// Relocated out of List Builder's "Search" tab (see Notes/dexfilter.md) — standalone tool
// with its own criteria/columns state. Search vs Advanced Search (Notes/dexfilter3.md) is a
// tab right next to each other, not buried, sharing the same results table below.
export default function DexFilterPage() {
  const [mode, setMode] = useState('search');
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [matches, setMatches] = useState(null);

  return (
    <div className="dex-filter-page">
      <h1 className="page-title">Dex Filter</h1>
      <Tabs tabs={MODE_TABS} active={mode} onChange={setMode} />
      <div className="dex-filter-stack">
        {mode === 'search' ? (
          <CriteriaPanel criteria={criteria} onCriteriaChange={setCriteria} onResults={setMatches} />
        ) : (
          <AdvancedSearchPanel onResults={setMatches} />
        )}

        <div className="card">
          <SearchResultsTable results={matches} columns={columns} onColumnsChange={setColumns} />
        </div>
      </div>
    </div>
  );
}
