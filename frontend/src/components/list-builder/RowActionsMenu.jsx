import { useEffect, useRef, useState } from 'react';
import { MoreVertical, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';

export function RowActionsMenu({ pokemon, onRemove, onSwap }) {
  const [open, setOpen] = useState(false);
  const [family, setFamily] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    api
      .get(`/api/pokemon/${pokemon.name}/evolution-family`)
      .then(setFamily)
      .catch(() => setFamily({ previous: null, next: [] }));
  }, [open, pokemon.name]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSwap(target) {
    onSwap(pokemon.name, target);
    setOpen(false);
  }

  return (
    <div className="row-actions-menu" ref={containerRef}>
      <button
        type="button"
        className="row-actions-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Row actions"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="row-actions-panel">
          <button type="button" className="row-actions-item" onClick={() => onRemove(pokemon.name)}>
            <X size={14} />
            Remove from List
          </button>

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
        </div>
      )}
    </div>
  );
}
