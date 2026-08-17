import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getOrderedActiveColumns, ALIGN_RIGHT_KEYS } from './columns';
import { cellValue } from './cellFormatters';
import { toDisplayName } from '../../utils/format';
import { ColumnPicker } from './ColumnPicker';
import { AddResultsToListButton } from './AddResultsToListButton';
import { useInfiniteFusion } from '../../context/InfiniteFusionContext';

// Column drag handle — same "whole <th> is the drag target" pattern List Builder's
// ListTable/SortableColumnHeader uses, just without the sort-click/resize-handle baggage
// that component bakes in (this table doesn't sort or resize columns, only reorders them).
function SortableColumnTh({ column }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`list-table-sortable-header${ALIGN_RIGHT_KEYS.has(column.key) ? ' list-table-cell-right' : ''}`}
      {...attributes}
      {...listeners}
    >
      {column.label}
    </th>
  );
}

// Search is intentionally standalone here — it doesn't assume there's a list
// "open" (see the Lists/Search split in ListBuilderPage). Every add goes through
// AddResultsToListButton's picker so the destination is always explicit.
export function SearchResultsTable({ results, columns, onColumnsChange }) {
  const { enabled: infiniteFusionEnabled } = useInfiniteFusion();
  const activeColumns = getOrderedActiveColumns(infiniteFusionEnabled, columns);
  const [selected, setSelected] = useState(new Set());
  const [a11yContainer, setA11yContainer] = useState(null);
  const columnSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    setSelected(new Set());
  }, [results]);

  function handleColumnDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = columns.indexOf(active.id);
    const newIndex = columns.indexOf(over.id);
    onColumnsChange(arrayMove(columns, oldIndex, newIndex));
  }

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
    <div className="list-table-wrap" ref={setA11yContainer}>
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
        <p className="text-muted">Check some criteria above to see matching Pokémon here.</p>
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
            <DndContext
              sensors={columnSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleColumnDragEnd}
              accessibility={{ container: a11yContainer || undefined }}
            >
              <SortableContext items={activeColumns.map((c) => c.key)} strategy={horizontalListSortingStrategy}>
                <tr>
                  <th className="list-table-checkbox-header">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all matches" />
                  </th>
                  <th className="list-table-index-header">#</th>
                  <th className="list-table-name-sticky">Pokémon</th>
                  {activeColumns.map((c) => (
                    <SortableColumnTh key={c.key} column={c} />
                  ))}
                </tr>
              </SortableContext>
            </DndContext>
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
