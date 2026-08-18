import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';
import { TopNavIcon } from './TopNavIcon';
import { PinButton } from './PinButton';
import { NAV_ITEMS } from './navItems';

// `onMenuClick` opens the Sidebar drawer (App.jsx owns that state) — the button itself only
// renders (via CSS) below the tablet breakpoint, where the sidebar isn't inline anymore.
export function TopBar({ onMenuClick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);

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

  useEffect(() => {
    function handleShortcut(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current.blur();
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  function selectPokemon(name) {
    setQuery('');
    setResults([]);
    setOpen(false);
    navigate(`/lookup/${name}`);
  }

  function handleKeyDown(e) {
    if ((e.key === 'Enter' || e.key === 'Tab') && open && results.length > 0) {
      e.preventDefault();
      selectPokemon(results[0].name);
    }
  }

  return (
    <header className="topbar">
      <button type="button" className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="topbar-search" ref={containerRef}>
        <Search size={16} className="topbar-search-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search Pokémon..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {!query && <kbd className="topbar-search-kbd">Ctrl K</kbd>}
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
      <PinButton />
      <nav className="topbar-nav">
        {NAV_ITEMS.map((item) => (
          <TopNavIcon key={item.to} {...item} />
        ))}
      </nav>
    </header>
  );
}
