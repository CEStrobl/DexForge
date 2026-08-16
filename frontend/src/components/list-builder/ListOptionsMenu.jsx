import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Link2, Lock, MoreHorizontal, Trash2 } from 'lucide-react';

// Same trigger/portal-panel dropdown pattern as QuickLinksSection's row menu.
export function ListOptionsMenu({ isPublic, shareUrl, onTogglePublic, onDelete, deleteLabel }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ top: rect.bottom + 4, left: rect.right - 200 });
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

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard permission denied — no-op, link is still visible in the address bar option
    }
  }

  return (
    <div className="row-actions-menu">
      <button
        ref={triggerRef}
        type="button"
        className="row-actions-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="List options"
      >
        <MoreHorizontal size={16} />
      </button>
      {open &&
        createPortal(
          <div ref={panelRef} className="row-actions-panel row-actions-panel-portal" style={{ top: position.top, left: position.left }}>
            <button
              type="button"
              className="row-actions-item"
              onClick={() => {
                onTogglePublic(!isPublic);
              }}
            >
              {isPublic ? <Lock size={14} /> : <Globe size={14} />}
              {isPublic ? 'Make Private' : 'Make Public'}
            </button>
            {isPublic && (
              <button type="button" className="row-actions-item" onClick={copyShareLink}>
                <Link2 size={14} />
                {copied ? 'Link Copied!' : 'Copy Share Link'}
              </button>
            )}
            <button
              type="button"
              className="row-actions-item row-actions-item-danger"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <Trash2 size={14} />
              {deleteLabel || 'Delete'}
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
