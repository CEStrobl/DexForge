import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { TypeBadge } from './TypeBadge';
import { TYPE_ORDER } from './typeIcons';
import { computeMenuPosition } from '../../utils/floatingMenuPosition';

// Colored, iconed multi-select dropdown for picking type(s) — same trigger/portal-panel
// pattern as RowActionsMenu/ListOptionsMenu, used instead of a native <select> because a
// native select can't render TypeBadge's icon+color inside its closed box. The trigger and
// each option row just wrap a TypeBadge (the colored icon+text pill used everywhere else for
// types), so there's no separate color styling to keep in sync with it.
//
// `value` is always an array (possibly empty). `max`, when set, caps how many can be
// selected at once — clicking an unselected option past the cap is a no-op and that option
// renders disabled. Picking an option toggles it and leaves the panel open, so several types
// can be picked in one visit; it closes on an outside click.
export function TypeDropdown({ value, onChange, placeholder = 'Choose...', max = null }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const selected = value || [];

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ ...computeMenuPosition(rect, { menuWidth: rect.width, estimatedHeight: 280 }), width: rect.width });
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

  function toggle(type) {
    const isSelected = selected.includes(type);
    if (!isSelected && max != null && selected.length >= max) return;
    onChange(isSelected ? selected.filter((t) => t !== type) : [...selected, type]);
  }

  return (
    <div className="type-dropdown">
      <button
        ref={triggerRef}
        type="button"
        className="type-dropdown-trigger"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected.length > 0 ? (
          <span className="type-dropdown-trigger-badges">
            {selected.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </span>
        ) : (
          <span className="type-dropdown-placeholder">{placeholder}</span>
        )}
        <ChevronDown size={14} />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            aria-multiselectable="true"
            className="type-dropdown-panel row-actions-panel row-actions-panel-portal"
            style={{ top: position.top, bottom: position.bottom, left: position.left, width: position.width }}
          >
            {selected.length > 0 && (
              <button type="button" className="type-dropdown-option type-dropdown-option-none" onClick={() => onChange([])}>
                Clear selection
              </button>
            )}
            {max != null && (
              <div className="type-dropdown-max-hint">
                {selected.length}/{max} selected
              </div>
            )}
            {TYPE_ORDER.map((t) => {
              const isSelected = selected.includes(t);
              const atCap = max != null && selected.length >= max;
              return (
                <button
                  key={t}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`type-dropdown-option${isSelected ? ' selected' : ''}`}
                  disabled={!isSelected && atCap}
                  onClick={() => toggle(t)}
                >
                  <TypeBadge type={t} />
                  {isSelected && <Check size={14} className="type-dropdown-option-check" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
