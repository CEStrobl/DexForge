import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RowActionsMenu } from './RowActionsMenu';
import { LabelPill } from './LabelPill';
import { ListEmptyState } from './ListEmptyState';
import { getOrderedActiveColumns, STAT_DATA_KEY } from './columns';
import { cellValue } from './cellFormatters';
import { StatBar } from '../common/StatBar';
import { TypeBadge } from '../common/TypeBadge';
import { toDisplayName, STAT_FULL_LABELS } from '../../utils/format';
import { useInfiniteFusion } from '../../context/InfiniteFusionContext';

// Cards render the same columns the user picked in ColumnPicker (shared with
// ListTable) — types and stats get dedicated visual treatment, everything
// else falls back to the table's own cellValue() formatting as a label/value row.
function GalleryCard({ pokemon, activeColumns, labelsById, labels, onRemove, onSwap, onToggleLabel }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pokemon.name,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const cardLabels = (pokemon.label_ids || []).map((id) => labelsById.get(id)).filter(Boolean);

  const typesActive = activeColumns.some((c) => c.key === 'types');
  const totalActive = activeColumns.some((c) => c.key === 'base_stat_total');
  const statColumns = activeColumns.filter((c) => STAT_DATA_KEY[c.key]);
  const extraColumns = activeColumns.filter(
    (c) => c.key !== 'types' && c.key !== 'base_stat_total' && !STAT_DATA_KEY[c.key]
  );

  return (
    <div ref={setNodeRef} style={style} className="card gallery-card">
      <div className="gallery-card-top">
        <button
          type="button"
          className="gallery-card-drag-handle"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <RowActionsMenu pokemon={pokemon} onRemove={onRemove} onSwap={onSwap} labels={labels} onToggleLabel={onToggleLabel} />
      </div>

      <Link to={`/lookup/${pokemon.name}`} className="gallery-card-sprite-wrap">
        <img src={pokemon.sprite} alt="" width={72} height={72} />
      </Link>

      <Link to={`/lookup/${pokemon.name}`} className="gallery-card-name">
        {toDisplayName(pokemon.name)}
      </Link>

      {cardLabels.length > 0 && (
        <div className="gallery-card-label-pills">
          {cardLabels.map((label) => (
            <LabelPill key={label.id} label={label} className="label-pill-sm" />
          ))}
        </div>
      )}

      {typesActive && (
        <div className="gallery-card-types">
          {pokemon.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      )}

      {totalActive && (
        <div className="gallery-card-total">
          <span className="text-muted">Total</span> {pokemon.base_stat_total}
        </div>
      )}

      {statColumns.length > 0 && (
        <div className="gallery-card-stats">
          {statColumns.map((c) => {
            const statKey = STAT_DATA_KEY[c.key];
            return <StatBar key={c.key} label={STAT_FULL_LABELS[statKey]} value={pokemon.stats?.[statKey] ?? 0} />;
          })}
        </div>
      )}

      {extraColumns.length > 0 && (
        <div className="gallery-card-extra">
          {extraColumns.map((c) => (
            <div key={c.key} className="gallery-card-extra-row">
              <span className="gallery-card-extra-label">{c.label}</span>
              <span className="gallery-card-extra-value">{cellValue(pokemon, c.key)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GalleryView({ entries, columns, labels = [], onRemove, onReorder, onSwap, onToggleLabel }) {
  const { enabled: infiniteFusionEnabled } = useInfiniteFusion();
  const activeColumns = getOrderedActiveColumns(infiniteFusionEnabled, columns);
  const labelsById = useMemo(() => new Map(labels.map((l) => [l.id, l])), [labels]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (entries.length === 0) {
    return <ListEmptyState />;
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex((e) => e.name === active.id);
    const newIndex = entries.findIndex((e) => e.name === over.id);
    onReorder(arrayMove(entries, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={entries.map((e) => e.name)} strategy={rectSortingStrategy}>
        <div className="gallery-grid">
          {entries.map((pokemon) => (
            <GalleryCard
              key={pokemon.name}
              pokemon={pokemon}
              activeColumns={activeColumns}
              labelsById={labelsById}
              labels={labels}
              onRemove={onRemove}
              onSwap={onSwap}
              onToggleLabel={onToggleLabel}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
