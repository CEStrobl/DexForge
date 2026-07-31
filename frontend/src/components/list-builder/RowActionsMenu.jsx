import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MoreVertical,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Repeat,
  ChevronLeft,
  Tag,
  Check,
} from 'lucide-react';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';

export function RowActionsMenu({ pokemon, onRemove, onSwap, labels = [], onToggleLabel }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('main');
  const [family, setFamily] = useState(null);
  const [variants, setVariants] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    api
      .get(`/api/pokemon/${pokemon.name}/evolution-family`)
      .then(setFamily)
      .catch(() => setFamily({ previous: null, next: [] }));
    api
      .get(`/api/pokemon/${pokemon.name}/variants`)
      .then(setVariants)
      .catch(() => setVariants([]));
  }, [open, pokemon.name]);

  useEffect(() => {
    if (!open) {
      setView('main');
      return;
    }
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

  function handleSwap(target) {
    onSwap(pokemon.name, target);
    setOpen(false);
  }

  function handleSelectVariant(variantSlug) {
    api.get(`/api/pokemon/${variantSlug}`).then((data) => {
      onSwap(pokemon.name, data);
      setOpen(false);
    });
  }

  const currentVariantSlug = pokemon.selected_variant || pokemon.name;
  const activeLabelIds = pokemon.label_ids || [];

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
                {family?.previous && (
                  <button type="button" className="row-actions-item" onClick={() => handleSwap(family.previous)}>
                    <ArrowDownCircle size={14} />
                    Devolve → {toDisplayName(family.previous.name)}
                  </button>
                )}

                {family?.next.map((target) => (
                  <button
                    key={target.name}
                    type="button"
                    className="row-actions-item"
                    onClick={() => handleSwap(target)}
                  >
                    <ArrowUpCircle size={14} />
                    Evolve → {toDisplayName(target.name)}
                  </button>
                ))}

                {family && !family.previous && family.next.length === 0 && (
                  <span className="row-actions-item row-actions-empty">No evolutions</span>
                )}

                {variants && variants.length > 1 && (
                  <button type="button" className="row-actions-item" onClick={() => setView('variants')}>
                    <Repeat size={14} />
                    Change Form
                  </button>
                )}

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
                  onClick={() => onRemove(pokemon.name)}
                >
                  <Trash2 size={14} />
                  Remove from List
                </button>
              </>
            )}

            {view === 'variants' && (
              <>
                <button type="button" className="row-actions-item row-actions-back" onClick={() => setView('main')}>
                  <ChevronLeft size={14} />
                  Change Form
                </button>
                <div className="row-actions-divider" />
                {variants?.map((v) => (
                  <button
                    key={v.slug}
                    type="button"
                    className={`row-actions-item row-actions-variant${v.slug === currentVariantSlug ? ' active' : ''}`}
                    onClick={() => handleSelectVariant(v.slug)}
                  >
                    <img src={v.sprite} alt="" width={20} height={20} />
                    {toDisplayName(v.slug)}
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
                      onClick={() => onToggleLabel(currentVariantSlug, label.id)}
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
