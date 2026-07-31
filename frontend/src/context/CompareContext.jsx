import { createContext, useContext, useState } from 'react';

const CompareContext = createContext(null);

// In-memory only (not localStorage), same convention as LastPokemonContext — resets on a
// full page refresh, but survives navigating between DexForge's own pages within a session.
export function CompareProvider({ children }) {
  const [pokemonPair, setPokemonPair] = useState({ left: null, right: null });
  const [fusionPair, setFusionPair] = useState({ headA: null, bodyA: null, headB: null, bodyB: null });

  return (
    <CompareContext.Provider value={{ pokemonPair, setPokemonPair, fusionPair, setFusionPair }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within a CompareProvider');
  return ctx;
}
