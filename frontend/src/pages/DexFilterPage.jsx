import { useState } from 'react';
import { CriteriaPanel } from '../components/list-builder/CriteriaPanel';
import { SearchResultsTable } from '../components/list-builder/SearchResultsTable';
import { DEFAULT_COLUMNS } from '../components/list-builder/columns';
import '../styles/list-builder.css';

// Relocated out of List Builder's "Search" tab (see Notes/dexfilter.md) — same
// filter form + live-preview results table, now a standalone tool with its own
// criteria/columns state instead of implicitly sharing whichever list was open.
export default function DexFilterPage() {
  const [criteria, setCriteria] = useState({});
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [matches, setMatches] = useState(null);

  return (
    <div className="dex-filter-page">
      <h1 className="page-title">Dex Filter</h1>
      <div className="dex-filter-stack">
        <CriteriaPanel criteria={criteria} onCriteriaChange={setCriteria} onResults={setMatches} />

        <div className="card">
          <SearchResultsTable results={matches} columns={columns} onColumnsChange={setColumns} />
        </div>
      </div>
    </div>
  );
}
