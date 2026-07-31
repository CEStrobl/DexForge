import { useEffect, useRef, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';

export function PokemonSearchAdd({ onAdd }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get(`/api/pokemon?q=${encodeURIComponent(query.trim().toLowerCase())}&limit=8`)
        .then((data) => {
          setResults(data);
          setOpen(true);
        })
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(pokemon) {
    onAdd(pokemon);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelect(results[0]);
    }
  }

  return (
    <div className="topbar-search list-builder-search" ref={containerRef}>
      <Search size={16} className="topbar-search-icon" />
      <input
        type="text"
        placeholder="Add a Pokémon by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {results.length > 0 && (
        <button
          type="button"
          className="list-builder-search-add-btn"
          onClick={() => handleSelect(results[0])}
          aria-label={`Add ${toDisplayName(results[0].name)}`}
        >
          <Plus size={14} />
          Add
        </button>
      )}
      {open && results.length > 0 && (
        <ul className="topbar-search-results">
          {results.map((r) => (
            <li key={r.name} onClick={() => handleSelect(r)}>
              <img src={r.sprite} alt="" width={28} height={28} />
              <span>{toDisplayName(r.name)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
