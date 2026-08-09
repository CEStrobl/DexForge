import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../../api/client';
import { useQuickLinks } from '../../context/QuickLinksContext';

function QuickLinkRowMenu({ onRename, onRemove }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ top: rect.bottom + 4, left: rect.right - 160 });
    }
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e) {
      const inTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const inPanel = panelRef.current && panelRef.current.contains(e.target);
      if (!inTrigger && !inPanel) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="row-actions-menu">
      <button
        ref={triggerRef}
        type="button"
        className="row-actions-trigger sidebar-quick-link-menu-trigger"
        onClick={(e) => {
          e.preventDefault();
          setOpen((prev) => !prev);
        }}
        aria-label="Quick link options"
      >
        <MoreHorizontal size={14} />
      </button>
      {open &&
        createPortal(
          <div ref={panelRef} className="row-actions-panel row-actions-panel-portal" style={{ top: position.top, left: position.left }}>
            <button
              type="button"
              className="row-actions-item"
              onClick={() => {
                setOpen(false);
                onRename();
              }}
            >
              <Pencil size={14} />
              Rename
            </button>
            <button
              type="button"
              className="row-actions-item row-actions-item-danger"
              onClick={() => {
                setOpen(false);
                onRemove();
              }}
            >
              <Trash2 size={14} />
              Remove
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}

function QuickLinkRow({ link, onRename, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(link.label);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function startRename() {
    setDraft(link.label);
    setEditing(true);
  }

  function commitRename() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== link.label) onRename(trimmed);
  }

  if (editing) {
    return (
      <div ref={setNodeRef} style={style} className="sidebar-quick-link-row">
        <input
          className="sidebar-quick-link-input"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') setEditing(false);
          }}
          onBlur={commitRename}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="sidebar-quick-link-row">
      <button type="button" className="sidebar-quick-link-handle" aria-label="Drag to reorder" {...attributes} {...listeners}>
        <GripVertical size={12} />
      </button>
      <NavLink to={link.path} className={({ isActive }) => `sidebar-quick-link-name${isActive ? ' active' : ''}`}>
        {link.label}
      </NavLink>
      <QuickLinkRowMenu onRename={startRename} onRemove={onRemove} />
    </div>
  );
}

// New QUICK LINKS section (see Notes/QuickLinks.md) — pinned via the top bar's
// PinButton, managed here: drag to reorder, per-row menu for rename/remove.
export function QuickLinksSection() {
  const { quickLinks, setQuickLinks, refresh } = useQuickLinks();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = quickLinks.findIndex((l) => l.id === active.id);
    const newIndex = quickLinks.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(quickLinks, oldIndex, newIndex);
    setQuickLinks(reordered);
    try {
      await api.put('/api/quick-links/reorder', { ids: reordered.map((l) => l.id) });
    } finally {
      refresh();
    }
  }

  async function renameLink(id, label) {
    setQuickLinks((prev) => prev.map((l) => (l.id === id ? { ...l, label } : l)));
    await api.put(`/api/quick-links/${id}`, { label });
    refresh();
  }

  async function removeLink(id) {
    setQuickLinks((prev) => prev.filter((l) => l.id !== id));
    await api.delete(`/api/quick-links/${id}`);
    refresh();
  }

  return (
    <div className="sidebar-lists">
      <div className="sidebar-lists-header">
        <span>Quick Links</span>
      </div>
      {quickLinks.length === 0 ? (
        <p className="sidebar-lists-empty">Pin a page to see it here.</p>
      ) : (
        <div className="sidebar-lists-scroll">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={quickLinks.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              {quickLinks.map((link) => (
                <QuickLinkRow
                  key={link.id}
                  link={link}
                  onRename={(label) => renameLink(link.id, label)}
                  onRemove={() => removeLink(link.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
