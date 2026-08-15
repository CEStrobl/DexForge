import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const FusionListsContext = createContext(null);

export function FusionListsProvider({ children }) {
  const [fusionLists, setFusionLists] = useState([]);
  const { session } = useAuth();

  function refresh() {
    return api
      .get('/api/fusion-lists')
      .then(setFusionLists)
      .catch(() => setFusionLists([]));
  }

  useEffect(() => {
    if (!session) {
      setFusionLists([]);
      return;
    }
    refresh();
  }, [session]);

  return (
    <FusionListsContext.Provider value={{ fusionLists, refresh }}>
      {children}
    </FusionListsContext.Provider>
  );
}

export function useFusionLists() {
  const ctx = useContext(FusionListsContext);
  if (!ctx) throw new Error('useFusionLists must be used within a FusionListsProvider');
  return ctx;
}
