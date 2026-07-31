import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Trash2, ArrowUpCircle, ArrowDownCircle, Repeat, ChevronLeft, Tag, Check } from 'lucide-react';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';

export function FusionRowActionsMenu({
  entry,
  entryKey,
  onRemove,
  onChangeHead,
  onChangeBody,
  onSwapOrientation,
  labels = [],
  onToggleLabel,
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('main');
  const [headFamily, setHeadFamily] = useState(null);
  const [bodyFamily, setBodyFamily] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    api
      .get(`/api/pokemon/${entry.head_slug}/evolution-family`)
      .then(setHeadFamily)
      .catch(() => setHeadFamily({ previous: null, next: [] }));
    api
      .get(`/api/pokemon/${entry.body_slug}/evolution-family`)
      .then(setBodyFamily)
      .catch(() => setBodyFamily({ previous: null, next: [] }));
  }, [open, entry.head_slug, entry.body_slug]);

  useEffect(() => {
    if (!open) {
      setView('main');
      return;
    }
    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ top: rect.bottom + 4, left: rect.right - 220 });
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

  function handleChangeHead(slug) {
    onChangeHead(entryKey, slug);
    setOpen(false);
  }

  function handleChangeBody(slug) {
    onChangeBody(entryKey, slug);
    setOpen(false);
  }

  function handleSwap() {
    onSwapOrientation(entryKey);
    setOpen(false);
  }

  const activeLabelIds = entry.label_ids || [];

  return (
    <div className="row-actions-menu">
      <button
        ref={triggerRef}
        type="button"
        className="row-actions-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Row actions"
      >
        <MoreVertical size={16} />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="row-actions-panel row-actions-panel-portal"
            style={{ top: position.top, left: position.left }}
          >
            {view === 'main' && (
              <>
                {headFamily && (headFamily.previous || headFamily.next.length > 0) && (
                  <button type="button" className="row-actions-item" onClick={() => setView('head')}>
                    <Repeat size={14} />
                    Evolve/Devolve Head
                  </button>
                )}

                {bodyFamily && (bodyFamily.previous || bodyFamily.next.length > 0) && (
                  <button type="button" className="row-actions-item" onClick={() => setView('body')}>
                    <Repeat size={14} />
                    Evolve/Devolve Body
                  </button>
                )}

                <button type="button" className="row-actions-item" onClick={handleSwap}>
                  <ArrowUpCircle size={14} style={{ transform: 'rotate(90deg)' }} />
                  Swap Head ⇄ Body
                </button>

                {labels.length > 0 && (
                  <button type="button" className="row-actions-item" onClick={() => setView('labels')}>
                    <Tag size={14} />
                    Labels
                  </button>
                )}

                <div className="row-actions-divider" />
                <button
                  type="button"
                  className="row-actions-item row-actions-item-danger"
                  onClick={() => onRemove(entryKey)}
                >
                  <Trash2 size={14} />
                  Remove from List
                </button>
              </>
            )}

            {view === 'head' && (
              <>
                <button type="button" className="row-actions-item row-actions-back" onClick={() => setView('main')}>
                  <ChevronLeft size={14} />
                  Head: {toDisplayName(entry.head_slug)}
                </button>
                <div className="row-actions-divider" />
                {headFamily?.previous && (
                  <button type="button" className="row-actions-item" onClick={() => handleChangeHead(headFamily.previous.name)}>
                    <ArrowDownCircle size={14} />
                    Devolve → {toDisplayName(headFamily.previous.name)}
                  </button>
                )}
                {headFamily?.next.map((target) => (
                  <button key={target.name} type="button" className="row-actions-item" onClick={() => handleChangeHead(target.name)}>
                    <ArrowUpCircle size={14} />
                    Evolve → {toDisplayName(target.name)}
                  </button>
                ))}
              </>
            )}

            {view === 'body' && (
              <>
                <button type="button" className="row-actions-item row-actions-back" onClick={() => setView('main')}>
                  <ChevronLeft size={14} />
                  Body: {toDisplayName(entry.body_slug)}
                </button>
                <div className="row-actions-divider" />
                {bodyFamily?.previous && (
                  <button type="button" className="row-actions-item" onClick={() => handleChangeBody(bodyFamily.previous.name)}>
                    <ArrowDownCircle size={14} />
                    Devolve → {toDisplayName(bodyFamily.previous.name)}
                  </button>
                )}
                {bodyFamily?.next.map((target) => (
                  <button key={target.name} type="button" className="row-actions-item" onClick={() => handleChangeBody(target.name)}>
                    <ArrowUpCircle size={14} />
                    Evolve → {toDisplayName(target.name)}
                  </button>
                ))}
              </>
            )}

            {view === 'labels' && (
              <>
                <button type="button" className="row-actions-item row-actions-back" onClick={() => setView('main')}>
                  <ChevronLeft size={14} />
                  Labels
                </button>
                <div className="row-actions-divider" />
                {labels.map((label) => {
                  const active = activeLabelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      className="row-actions-item row-actions-label"
                      onClick={() => onToggleLabel(entryKey, label.id)}
                    >
                      <span className="row-actions-label-checkbox">{active && <Check size={12} />}</span>
                      <span className="row-actions-label-swatch" style={{ background: label.color }} />
                      {label.name}
                    </button>
                  );
                })}
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
