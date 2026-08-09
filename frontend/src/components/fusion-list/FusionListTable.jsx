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
import { FusionArtSprite } from '../fusion/FusionArtSprite';
import { FusionRowActionsMenu } from './FusionRowActionsMenu';
import { LabelPill } from '../list-builder/LabelPill';
import { FusionListEmptyState } from './FusionListEmptyState';
import { useFusionRows } from './useFusionRows';
import { getOrderedActiveFusionColumns, STAT_DATA_KEY, ALIGN_RIGHT_KEYS } from './fusionColumns';
import { fusionCellValue } from './fusionCellFormatters';
import { toDisplayName } from '../../utils/format';
import { SortableColumnHeader, widthStyle } from '../common/SortableColumnHeader';

function entryKey(entry) {
  return `${entry.head_slug}|${entry.body_slug}`;
}

function sortValue(row, key) {
  const fusion = row.fusion;
  if (key === 'name') return fusion ? fusion.name : `${row.head_slug}/${row.body_slug}`;
  if (!fusion) return 0;
  if (STAT_DATA_KEY[key]) return fusion.stats?.[STAT_DATA_KEY[key]] ?? 0;
  if (key === 'base_stat_total') return fusion.base_stat_total ?? 0;
  if (key === 'types') return (fusion.types || []).join(',');
  if (key === 'weaknesses') {
    return Object.entries(fusion.type_effectiveness || {}).filter(([, m]) => m > 1).length;
  }
  if (key === 'ability') {
    return [...fusion.abilities.head.regular, ...fusion.abilities.body.regular].join(',');
  }
  return 0;
}

function compareValues(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

function SortableFusionRow({ row, index, activeColumns, columnWidths, labelsById, labels, onRemove, onChangeHead, onChangeBody, onSwapOrientation, onToggleLabel, onSelectVariant, dragDisabled }) {
  const key = entryKey(row);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: key,
    disabled: dragDisabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const rowLabels = (row.label_ids || []).map((id) => labelsById.get(id)).filter(Boolean);
  const fusion = row.fusion;

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
      <td className="list-table-name-sticky">
        <div className="fusion-list-identity">
          {fusion ? (
            <FusionArtSprite
              headSlug={row.head_slug}
              bodySlug={row.body_slug}
              size={26}
              fusionLabel={fusion.name}
              selectedVariant={row.selected_variant}
              onSelectVariant={(variantId) => onSelectVariant(key, variantId)}
            >
              <div className="fusion-sprite-pair-sm">
                <img src={fusion.head.sprite} alt="" width={26} height={26} />
                <img src={fusion.body.sprite} alt="" width={26} height={26} />
              </div>
            </FusionArtSprite>
          ) : (
            <div className="fusion-sprite-pair-sm" />
          )}
          <span className="fusion-list-identity-name">
            <Link to={`/lookup/${row.head_slug}`}>{toDisplayName(row.head_slug)}</Link>
            {' / '}
            <Link to={`/lookup/${row.body_slug}`}>{toDisplayName(row.body_slug)}</Link>
          </span>
        </div>
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
          {fusionCellValue(fusion, c.key)}
        </td>
      ))}
      <td>
        <FusionRowActionsMenu
          entry={row}
          entryKey={key}
          onRemove={onRemove}
          onChangeHead={onChangeHead}
          onChangeBody={onChangeBody}
          onSwapOrientation={onSwapOrientation}
          labels={labels}
          onToggleLabel={onToggleLabel}
        />
      </td>
    </tr>
  );
}

export function FusionListTable({
  entries,
  columns,
  columnWidths = {},
  labels = [],
  onRemove,
  onReorder,
  onChangeHead,
  onChangeBody,
  onSwapOrientation,
  onReorderColumns,
  onResizeColumn,
  onToggleLabel,
  onSelectVariant,
}) {
  const [sort, setSort] = useState(null);
  const [a11yContainer, setA11yContainer] = useState(null);
  const rowSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const columnSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const rows = useFusionRows(entries);
  const activeColumns = getOrderedActiveFusionColumns(columns);
  const labelsById = useMemo(() => new Map(labels.map((l) => [l.id, l])), [labels]);

  const displayRows = useMemo(() => {
    if (!sort) return rows;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => dir * compareValues(sortValue(a, sort.key), sortValue(b, sort.key)));
  }, [rows, sort]);

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
    const oldIndex = entries.findIndex((e) => entryKey(e) === active.id);
    const newIndex = entries.findIndex((e) => entryKey(e) === over.id);
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
    return <FusionListEmptyState />;
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
                    Fusion {sortIcon('name')}
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
          <SortableContext items={displayRows.map((r) => entryKey(r))} strategy={verticalListSortingStrategy}>
            <tbody>
              {displayRows.map((row, i) => (
                <SortableFusionRow
                  key={entryKey(row)}
                  row={row}
                  index={i}
                  activeColumns={activeColumns}
                  columnWidths={columnWidths}
                  labelsById={labelsById}
                  labels={labels}
                  onRemove={onRemove}
                  onChangeHead={onChangeHead}
                  onChangeBody={onChangeBody}
                  onSwapOrientation={onSwapOrientation}
                  onToggleLabel={onToggleLabel}
                  onSelectVariant={onSelectVariant}
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
