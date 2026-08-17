import { useState } from 'react';
import { X } from 'lucide-react';
import { toDisplayName } from '../../utils/format';

// Generic type-to-filter, click-to-add combobox for fields with too many values for a chip
// grid (Ability ~300, Move ~800+). Selected values render as removable chips underneath —
// same chip visual language as everything else. Shared by Search's Ability filter and
// Advanced Search's Ability/Move value inputs.
export function SearchCombobox({ options, selected, onChange, placeholder = 'Search...' }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const q = query.trim().toLowerCase();
  const suggestions = q
    ? options
        .filter((a) => !selected.includes(a) && a.toLowerCase().includes(q))
        // Prefix matches ("Levitate" for "lev") read as more relevant than an incidental
        // substring hit buried mid-name ("Eelevate") — surface those first, then alphabetize.
        .sort((a, b) => {
          const aStarts = a.toLowerCase().startsWith(q) ? 0 : 1;
          const bStarts = b.toLowerCase().startsWith(q) ? 0 : 1;
          return aStarts - bStarts || a.localeCompare(b);
        })
        .slice(0, 8)
    : [];

  function addValue(value) {
    onChange([...selected, value]);
    setQuery('');
  }

  function removeValue(value) {
    onChange(selected.filter((v) => v !== value));
  }

  return (
    <div className="ability-combobox">
      <div className="ability-combobox-input-wrap">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
        />
        {focused && suggestions.length > 0 && (
          <ul className="ability-combobox-suggestions">
            {suggestions.map((a) => (
              <li key={a}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addValue(a)}>
                  {toDisplayName(a)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected.length > 0 && (
        <div className="ability-combobox-chips">
          {selected.map((a) => (
            <button
              key={a}
              type="button"
              className="criteria-pill-toggle active"
              onClick={() => removeValue(a)}
            >
              {toDisplayName(a)}
              <X size={11} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
