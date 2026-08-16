import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';

export function PokemonSearchSelect({ placeholder, onSelect, autoFocus = false, limit = 8 }) {
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
        .get(`/api/pokemon?q=${encodeURIComponent(query.trim().toLowerCase())}&limit=${limit}`)
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

  function selectPokemon(name) {
    setQuery('');
    setResults([]);
    setOpen(false);
    onSelect(name);
  }

  function handleKeyDown(e) {
    if ((e.key === 'Enter' || e.key === 'Tab') && open && results.length > 0) {
      e.preventDefault();
      selectPokemon(results[0].name);
    }
  }

  return (
    <div className="topbar-search" ref={containerRef}>
      <Search size={16} className="topbar-search-icon" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
      />
      {open && results.length > 0 && (
        <ul className="topbar-search-results">
          {results.map((r) => (
            <li key={r.name} onClick={() => selectPokemon(r.name)}>
              <img src={r.sprite} alt="" width={28} height={28} />
              <span>{toDisplayName(r.name)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
