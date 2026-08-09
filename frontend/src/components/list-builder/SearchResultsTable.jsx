import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { getOrderedActiveColumns, ALIGN_RIGHT_KEYS } from './columns';
import { cellValue } from './cellFormatters';
import { toDisplayName } from '../../utils/format';
import { ColumnPicker } from './ColumnPicker';
import { AddResultsToListButton } from './AddResultsToListButton';
import { useInfiniteFusion } from '../../context/InfiniteFusionContext';

// Search is intentionally standalone here — it doesn't assume there's a list
// "open" (see the Lists/Search split in ListBuilderPage). Every add goes through
// AddResultsToListButton's picker so the destination is always explicit.
export function SearchResultsTable({ results, columns, onColumnsChange }) {
  const { enabled: infiniteFusionEnabled } = useInfiniteFusion();
  const activeColumns = getOrderedActiveColumns(infiniteFusionEnabled, columns);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    setSelected(new Set());
  }, [results]);

  function toggleOne(name) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === results.length ? new Set() : new Set(results.map((p) => p.name))));
  }

  const allSelected = results != null && selected.size > 0 && selected.size === results.length;
  const targetList = results ? results.filter((p) => selected.size === 0 || selected.has(p.name)) : [];

  return (
    <div className="list-table-wrap">
      <div className="list-builder-table-header">
        {results != null && results.length > 0 && selected.size > 0 ? (
          <h3 className="card-heading">{selected.size} selected</h3>
        ) : (
          <h3 className="card-heading">
            {results == null ? 'Search Results' : `${results.length} Matches`}
          </h3>
        )}
        <div className="list-builder-table-header-controls">
          <ColumnPicker columns={columns} onChange={onColumnsChange} />
          {results != null && results.length > 0 && (
            <div className="search-results-bulk-actions">
              {selected.size > 0 && (
                <button type="button" className="action-btn action-btn-ghost" onClick={() => setSelected(new Set())}>
                  Clear
                </button>
              )}
              <AddResultsToListButton pokemonList={targetList} label="Add to List" />
            </div>
          )}
        </div>
      </div>

      {results == null && (
        <p className="text-muted">Check some criteria and hit Preview Matches to see results here.</p>
      )}

      {results != null && results.length === 0 && (
        <div className="list-table-empty-state">
          <SearchX size={28} />
          <p>No Pokémon match these criteria.</p>
          <p className="text-muted">Try loosening a filter or two.</p>
        </div>
      )}

      {results != null && results.length > 0 && (
        <table className="list-table list-table--search">
          <thead>
            <tr>
              <th className="list-table-checkbox-header">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all matches" />
              </th>
              <th className="list-table-index-header">#</th>
              <th className="list-table-name-sticky">Pokémon</th>
              {activeColumns.map((c) => (
                <th key={c.key} className={ALIGN_RIGHT_KEYS.has(c.key) ? 'list-table-cell-right' : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((p, i) => (
              <tr key={p.name} className={selected.has(p.name) ? 'list-table-row-selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(p.name)}
                    onChange={() => toggleOne(p.name)}
                    aria-label={`Select ${p.name}`}
                  />
                </td>
                <td className="list-table-index">{i + 1}</td>
                <td className="list-table-name-sticky">
                  <Link to={`/lookup/${p.name}`} className="list-table-pokemon">
                    <img src={p.sprite} alt="" width={32} height={32} />
                    <span>{toDisplayName(p.name)}</span>
                  </Link>
                </td>
                {activeColumns.map((c) => (
                  <td key={c.key} className={ALIGN_RIGHT_KEYS.has(c.key) ? 'list-table-cell-right' : undefined}>
                    {cellValue(p, c.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
