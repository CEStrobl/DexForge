import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { COLUMN_OPTIONS } from './columns';
import { cellValue } from './cellFormatters';
import { toDisplayName } from '../../utils/format';

export function SearchResultsTable({ results, columns, onAdd, onAddAll }) {
  const activeColumns = COLUMN_OPTIONS.filter((c) => columns.includes(c.key));

  if (results == null) {
    return <p className="text-muted">Check some criteria and hit Preview Matches to see results here.</p>;
  }

  if (results.length === 0) {
    return <p className="text-muted">No Pokémon match these criteria.</p>;
  }

  return (
    <div className="list-table-wrap">
      <div className="list-builder-table-header">
        <h3 className="card-heading">
          {results.length} Matches
        </h3>
        <button type="button" className="action-btn" onClick={() => onAddAll(results)}>
          Add All
        </button>
      </div>
      <table className="list-table">
        <thead>
          <tr>
            <th className="list-table-index-header">#</th>
            <th>Pokémon</th>
            {activeColumns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            <th aria-label="Add" />
          </tr>
        </thead>
        <tbody>
          {results.map((p, i) => (
            <tr key={p.name}>
              <td className="list-table-index">{i + 1}</td>
              <td>
                <Link to={`/lookup/${p.name}`} className="list-table-pokemon">
                  <img src={p.sprite} alt="" width={32} height={32} />
                  <span>{toDisplayName(p.name)}</span>
                </Link>
              </td>
              {activeColumns.map((c) => (
                <td key={c.key}>{cellValue(p, c.key)}</td>
              ))}
              <td>
                <button type="button" className="criteria-add-btn" onClick={() => onAdd(p)} aria-label={`Add ${p.name}`}>
                  <Plus size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
