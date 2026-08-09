import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FusionArtSprite } from '../fusion/FusionArtSprite';
import { FusionRowActionsMenu } from './FusionRowActionsMenu';
import { LabelPill } from '../list-builder/LabelPill';
import { FusionListEmptyState } from './FusionListEmptyState';
import { useFusionRows } from './useFusionRows';
import { getOrderedActiveFusionColumns, STAT_DATA_KEY } from './fusionColumns';
import { fusionCellValue } from './fusionCellFormatters';
import { StatBar } from '../common/StatBar';
import { TypeBadge } from '../common/TypeBadge';
import { toDisplayName, STAT_FULL_LABELS } from '../../utils/format';

function entryKey(entry) {
  return `${entry.head_slug}|${entry.body_slug}`;
}

// Mirrors GalleryCard (list-builder) but for a computed fusion row instead of a single
// Pokémon — same column-driven info panel, fed by the same fusionCellValue() formatting
// the table already uses, with the fused sprite (community art, falling back to a
// head+body sprite pair) standing in for the single sprite.
function FusionGalleryCard({
  row,
  activeColumns,
  labelsById,
  labels,
  onRemove,
  onChangeHead,
  onChangeBody,
  onSwapOrientation,
  onToggleLabel,
  onSelectVariant,
}) {
  const key = entryKey(row);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const cardLabels = (row.label_ids || []).map((id) => labelsById.get(id)).filter(Boolean);
  const fusion = row.fusion;

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
      </div>

      {fusion ? (
        <FusionArtSprite
          headSlug={row.head_slug}
          bodySlug={row.body_slug}
          size={88}
          fusionLabel={fusion.name}
          selectedVariant={row.selected_variant}
          onSelectVariant={(variantId) => onSelectVariant(key, variantId)}
        >
          <div className="fusion-gallery-sprite-pair">
            <img src={fusion.head.sprite} alt="" width={56} height={56} />
            <img src={fusion.body.sprite} alt="" width={56} height={56} />
          </div>
        </FusionArtSprite>
      ) : (
        <div className="gallery-card-sprite-wrap" />
      )}

      <div className="gallery-card-name gallery-card-fusion-name">
        <Link to={`/lookup/${row.head_slug}`}>{toDisplayName(row.head_slug)}</Link>
        <span>/</span>
        <Link to={`/lookup/${row.body_slug}`}>{toDisplayName(row.body_slug)}</Link>
      </div>

      {cardLabels.length > 0 && (
        <div className="gallery-card-label-pills">
          {cardLabels.map((label) => (
            <LabelPill key={label.id} label={label} className="label-pill-sm" />
          ))}
        </div>
      )}

      {typesActive && fusion && (
        <div className="gallery-card-types">
          {fusion.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      )}

      {totalActive && fusion && (
        <div className="gallery-card-total">
          <span className="text-muted">Total</span> {fusion.base_stat_total}
        </div>
      )}

      {statColumns.length > 0 && fusion && (
        <div className="gallery-card-stats">
          {statColumns.map((c) => {
            const statKey = STAT_DATA_KEY[c.key];
            return <StatBar key={c.key} label={STAT_FULL_LABELS[statKey]} value={fusion.stats?.[statKey] ?? 0} />;
          })}
        </div>
      )}

      {extraColumns.length > 0 && (
        <div className="gallery-card-extra">
          {extraColumns.map((c) => (
            <div key={c.key} className="gallery-card-extra-row">
              <span className="gallery-card-extra-label">{c.label}</span>
              <span className="gallery-card-extra-value">{fusionCellValue(fusion, c.key)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FusionGalleryView({
  entries,
  columns,
  labels = [],
  onRemove,
  onReorder,
  onChangeHead,
  onChangeBody,
  onSwapOrientation,
  onToggleLabel,
  onSelectVariant,
}) {
  const rows = useFusionRows(entries);
  const activeColumns = getOrderedActiveFusionColumns(columns);
  const labelsById = useMemo(() => new Map(labels.map((l) => [l.id, l])), [labels]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (entries.length === 0) {
    return <FusionListEmptyState />;
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex((e) => entryKey(e) === active.id);
    const newIndex = entries.findIndex((e) => entryKey(e) === over.id);
    onReorder(arrayMove(entries, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={rows.map((r) => entryKey(r))} strategy={rectSortingStrategy}>
        <div className="gallery-grid">
          {rows.map((row) => (
            <FusionGalleryCard
              key={entryKey(row)}
              row={row}
              activeColumns={activeColumns}
              labelsById={labelsById}
              labels={labels}
              onRemove={onRemove}
              onChangeHead={onChangeHead}
              onChangeBody={onChangeBody}
              onSwapOrientation={onSwapOrientation}
              onToggleLabel={onToggleLabel}
              onSelectVariant={onSelectVariant}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
