import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ColumnResizeHandle } from './ColumnResizeHandle';

export function widthStyle(width) {
  return width ? { width: `${width}px`, minWidth: `${width}px` } : undefined;
}

export function SortableColumnHeader({ column, width, sortIcon, onHeaderClick, onResize, alignRight }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.key,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...widthStyle(width),
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`list-table-sortable-header list-table-resizable-header${alignRight ? ' list-table-cell-right' : ''}`}
      onClick={() => onHeaderClick(column.key)}
      {...attributes}
      {...listeners}
    >
      {column.label} {sortIcon(column.key)}
      <ColumnResizeHandle columnKey={column.key} currentWidth={width} onResize={onResize} />
    </th>
  );
}
