import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RowActionsMenu } from './RowActionsMenu';
import { COLUMN_OPTIONS, STAT_DATA_KEY } from './columns';
import { cellValue } from './cellFormatters';
import { toDisplayName } from '../../utils/format';

function sortValue(pokemon, key) {
  if (key === 'name') return pokemon.name;
  if (STAT_DATA_KEY[key]) return pokemon.stats?.[STAT_DATA_KEY[key]] ?? 0;
  if (key === 'base_stat_total') return pokemon.base_stat_total ?? 0;
  if (key === 'capture_rate') return pokemon.capture_rate ?? 0;
  if (key === 'base_happiness') return pokemon.base_happiness ?? 0;
  if (key === 'hatch_counter') return pokemon.hatch_counter ?? 0;
  if (key === 'is_legendary') return pokemon.is_legendary ? 1 : 0;
  if (key === 'is_mythical') return pokemon.is_mythical ? 1 : 0;
  if (key === 'generation') return pokemon.generation || '';
  if (key === 'growth_rate') return pokemon.growth_rate || '';
  if (key === 'types') return (pokemon.types || []).join(',');
  if (key === 'weaknesses') {
    return Object.entries(pokemon.type_effectiveness || {}).filter(([, m]) => m > 1).length;
  }
  if (key === 'ability') return (pokemon.abilities || []).map((a) => a.name).join(',');
  if (key === 'egg_groups') return (pokemon.egg_groups || []).join(',');
  if (key === 'ev_yield_stats') return (pokemon.ev_yield || []).length;
  return 0;
}

function compareValues(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

function SortableRow({ pokemon, index, activeColumns, onRemove, onSwap, dragDisabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pokemon.name,
    disabled: dragDisabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td className="list-table-index">{index + 1}</td>
      <td className="list-table-handle-cell">
        {!dragDisabled && (
          <button type="button" className="list-table-drag-handle" aria-label="Drag to reorder" {...attributes} {...listeners}>
            <GripVertical size={14} />
          </button>
        )}
      </td>
      <td>
        <Link to={`/lookup/${pokemon.name}`} className="list-table-pokemon">
          <img src={pokemon.sprite} alt="" width={32} height={32} />
          <span>{toDisplayName(pokemon.name)}</span>
        </Link>
      </td>
      {activeColumns.map((c) => (
        <td key={c.key}>{cellValue(pokemon, c.key)}</td>
      ))}
      <td>
        <RowActionsMenu pokemon={pokemon} onRemove={onRemove} onSwap={onSwap} />
      </td>
    </tr>
  );
}

export function ListTable({ entries, columns, onRemove, onReorder, onSwap }) {
  const [sort, setSort] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeColumns = COLUMN_OPTIONS.filter((c) => columns.includes(c.key));

  const displayEntries = useMemo(() => {
    if (!sort) return entries;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...entries].sort(
      (a, b) => dir * compareValues(sortValue(a, sort.key), sortValue(b, sort.key))
    );
  }, [entries, sort]);

  function handleHeaderClick(key) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex((e) => e.name === active.id);
    const newIndex = entries.findIndex((e) => e.name === over.id);
    onReorder(arrayMove(entries, oldIndex, newIndex));
  }

  if (entries.length === 0) {
    return <p className="text-muted">No Pokémon in this list yet — search above or use criteria matches.</p>;
  }

  function sortIcon(key) {
    if (!sort || sort.key !== key) return null;
    return sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  }

  return (
    <div className="list-table-wrap">
      {sort && (
        <p className="list-table-sort-hint text-muted">
          Sorted — click the column a third time to clear and drag-reorder again.
        </p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="list-table">
          <thead>
            <tr>
              <th className="list-table-index-header">#</th>
              <th aria-label="Drag handle" />
              <th className="list-table-sortable-header" onClick={() => handleHeaderClick('name')}>
                Pokémon {sortIcon('name')}
              </th>
              {activeColumns.map((c) => (
                <th key={c.key} className="list-table-sortable-header" onClick={() => handleHeaderClick(c.key)}>
                  {c.label} {sortIcon(c.key)}
                </th>
              ))}
              <th aria-label="Actions" />
            </tr>
          </thead>
          <SortableContext items={displayEntries.map((e) => e.name)} strategy={verticalListSortingStrategy}>
            <tbody>
              {displayEntries.map((p, i) => (
                <SortableRow
                  key={p.name}
                  pokemon={p}
                  index={i}
                  activeColumns={activeColumns}
                  onRemove={onRemove}
                  onSwap={onSwap}
                  dragDisabled={sort !== null}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </div>
  );
}
