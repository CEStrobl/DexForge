import { useEffect, useRef, useState } from 'react';
import { GitMerge } from 'lucide-react';
import { PokemonSearchSelect } from '../compare/PokemonSearchSelect';

// Entry point into the fused Lookup view — only rendered when Infinite Fusion Mode is on.
export function FuseButton({ onFuse }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleSelect(slug) {
    setOpen(false);
    onFuse(slug);
  }

  return (
    <div className="fuse-button-wrap" ref={containerRef}>
      <button type="button" className="action-btn" onClick={() => setOpen((prev) => !prev)}>
        <GitMerge size={14} />
        Fuse
      </button>
      {open && (
        <div className="fuse-button-popover">
          <PokemonSearchSelect placeholder="Fuse with..." onSelect={handleSelect} autoFocus />
        </div>
      )}
    </div>
  );
}
