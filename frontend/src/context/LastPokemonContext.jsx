import { createContext, useContext, useState } from 'react';

const LastPokemonContext = createContext(null);

// In-memory only (not localStorage) — resets on a full page refresh, but survives
// navigating between DexForge's own pages within the same session.
export function LastPokemonProvider({ children }) {
  const [lastSlug, setLastSlug] = useState(null);

  return (
    <LastPokemonContext.Provider value={{ lastSlug, setLastSlug }}>
      {children}
    </LastPokemonContext.Provider>
  );
}

export function useLastPokemon() {
  const ctx = useContext(LastPokemonContext);
  if (!ctx) throw new Error('useLastPokemon must be used within a LastPokemonProvider');
  return ctx;
}
