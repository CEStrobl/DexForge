import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RowActionsMenu } from './RowActionsMenu';
import { LabelPill } from './LabelPill';
import { ListEmptyState } from './ListEmptyState';
import { getOrderedActiveColumns, STAT_DATA_KEY, ALIGN_RIGHT_KEYS } from './columns';
import { cellValue } from './cellFormatters';
import { toDisplayName } from '../../utils/format';
import { useInfiniteFusion } from '../../context/InfiniteFusionContext';
import { HEAD_STAT_KEYS, BODY_STAT_KEYS, sumStats } from '../../utils/fusion';
import { SortableColumnHeader, widthStyle } from '../common/SortableColumnHeader';

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
  if (key === 'head_total') return sumStats(pokemon.stats, HEAD_STAT_KEYS);
  if (key === 'body_total') return sumStats(pokemon.stats, BODY_STAT_KEYS);
  if (key === 'head_type') return pokemon.types?.[0] || '';
  if (key === 'body_type') return pokemon.types?.[1] || pokemon.types?.[0] || '';
  return 0;
}

function compareValues(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

function SortableRow({ pokemon, index, activeColumns, columnWidths, labelsById, onRemove, onSwap, onToggleLabel, labels, dragDisabled, readOnly }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pokemon.name,
    disabled: dragDisabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const rowLabels = (pokemon.label_ids || []).map((id) => labelsById.get(id)).filter(Boolean);

  return (
    <tr ref={setNodeRef} style={style}>
      <td className="list-table-index">{index + 1}</td>
      <td className="list-table-handle-cell">
        {!dragDisabled && !readOnly && (
          <button type="button" className="list-table-drag-handle" aria-label="Drag to reorder" {...attributes} {...listeners}>
            <GripVertical size={14} />
          </button>
        )}
      </td>
      <td className="list-table-name-sticky">
        <Link to={`/lookup/${pokemon.name}`} className="list-table-pokemon">
          <img src={pokemon.sprite} alt="" width={32} height={32} />
          <span>{toDisplayName(pokemon.name)}</span>
        </Link>
        {rowLabels.length > 0 && (
          <div className="list-table-label-pills">
            {rowLabels.map((label) => (
              <LabelPill key={label.id} label={label} className="label-pill-sm" />
            ))}
          </div>
        )}
      </td>
      {activeColumns.map((c) => (
        <td key={c.key} style={widthStyle(columnWidths[c.key])} className={ALIGN_RIGHT_KEYS.has(c.key) ? 'list-table-cell-right' : undefined}>
          {cellValue(pokemon, c.key)}
        </td>
      ))}
      <td>
        {!readOnly && (
          <RowActionsMenu pokemon={pokemon} onRemove={onRemove} onSwap={onSwap} labels={labels} onToggleLabel={onToggleLabel} />
        )}
      </td>
    </tr>
  );
}

export function ListTable({
  entries,
  columns,
  columnWidths = {},
  labels = [],
  onRemove,
  onReorder,
  onSwap,
  onReorderColumns,
  onResizeColumn,
  onToggleLabel,
  readOnly = false,
}) {
  const [sort, setSort] = useState(null);
  const [a11yContainer, setA11yContainer] = useState(null);
  const rowSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const columnSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const { enabled: infiniteFusionEnabled } = useInfiniteFusion();
  const activeColumns = getOrderedActiveColumns(infiniteFusionEnabled, columns);
  const labelsById = useMemo(() => new Map(labels.map((l) => [l.id, l])), [labels]);

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

  function handleRowDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex((e) => e.name === active.id);
    const newIndex = entries.findIndex((e) => e.name === over.id);
    onReorder(arrayMove(entries, oldIndex, newIndex));
  }

  function handleColumnDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = columns.indexOf(active.id);
    const newIndex = columns.indexOf(over.id);
    onReorderColumns(arrayMove(columns, oldIndex, newIndex));
  }

  if (entries.length === 0) {
    return <ListEmptyState />;
  }

  function sortIcon(key) {
    if (!sort || sort.key !== key) return null;
    return sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  }

  return (
    <div className="list-table-wrap" ref={setA11yContainer}>
      <DndContext sensors={rowSensors} collisionDetection={closestCenter} onDragEnd={handleRowDragEnd}>
        <table className="list-table list-table--builder">
          <thead>
            {/* Scoped tightly to just the header row so useSortable() here resolves to
                THIS context, not the row DndContext above — nesting them around the same
                subtree would make every draggable (rows included) resolve to whichever is
                innermost. dnd-kit renders a hidden a11y <div> whereever DndContext sits,
                which <thead> can't legally contain, so it's portaled out to the wrap div above. */}
            <DndContext
              sensors={columnSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleColumnDragEnd}
              accessibility={{ container: a11yContainer || undefined }}
            >
              <SortableContext items={activeColumns.map((c) => c.key)} strategy={horizontalListSortingStrategy}>
                <tr>
                  <th className="list-table-index-header">#</th>
                  <th aria-label="Drag handle" />
                  <th
                    className="list-table-sortable-header list-table-name-sticky"
                    onClick={() => handleHeaderClick('name')}
                  >
                    Pokémon {sortIcon('name')}
                  </th>
                  {activeColumns.map((c) => (
                    <SortableColumnHeader
                      key={c.key}
                      column={c}
                      width={columnWidths[c.key]}
                      sortIcon={sortIcon}
                      onHeaderClick={handleHeaderClick}
                      onResize={onResizeColumn}
                      alignRight={ALIGN_RIGHT_KEYS.has(c.key)}
                    />
                  ))}
                  <th aria-label="Actions" />
                </tr>
              </SortableContext>
            </DndContext>
          </thead>
          <SortableContext items={displayEntries.map((e) => e.name)} strategy={verticalListSortingStrategy}>
            <tbody>
              {displayEntries.map((p, i) => (
                <SortableRow
                  key={p.name}
                  pokemon={p}
                  index={i}
                  activeColumns={activeColumns}
                  columnWidths={columnWidths}
                  labelsById={labelsById}
                  labels={labels}
                  onRemove={onRemove}
                  onSwap={onSwap}
                  onToggleLabel={onToggleLabel}
                  dragDisabled={sort !== null || readOnly}
                  readOnly={readOnly}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </div>
  );
}
