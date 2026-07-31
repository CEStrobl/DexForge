import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toDisplayName } from '../../utils/format';

export function FusionEvoMenu({ family, onSelect }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ top: rect.bottom + 4, left: rect.right - 190 });
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

  const hasOptions = family && (family.previous || family.next.length > 0);
  if (!hasOptions) return null;

  function handleSelect(name) {
    setOpen(false);
    onSelect(name);
  }

  return (
    <div className="fusion-evo-menu">
      <button
        ref={triggerRef}
        type="button"
        className="fusion-evo-menu-trigger"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label="Evolution options"
      >
        <MoreHorizontal size={15} />
      </button>
      {open &&
        createPortal(
          <div ref={panelRef} className="row-actions-panel row-actions-panel-portal" style={{ top: position.top, left: position.left }}>
            {family.previous && (
              <button type="button" className="row-actions-item" onClick={() => handleSelect(family.previous.name)}>
                <ArrowDownCircle size={14} />
                Devolve → {toDisplayName(family.previous.name)}
              </button>
            )}
            {family.next.map((n) => (
              <button key={n.name} type="button" className="row-actions-item" onClick={() => handleSelect(n.name)}>
                <ArrowUpCircle size={14} />
                Evolve → {toDisplayName(n.name)}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
