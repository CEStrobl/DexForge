import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const SavedListsContext = createContext(null);

export function SavedListsProvider({ children }) {
  const [savedLists, setSavedLists] = useState([]);
  const { session } = useAuth();

  function refresh() {
    return api
      .get('/api/lists')
      .then(setSavedLists)
      .catch(() => setSavedLists([]));
  }

  useEffect(() => {
    if (!session) {
      setSavedLists([]);
      return;
    }
    refresh();
  }, [session]);

  return (
    <SavedListsContext.Provider value={{ savedLists, refresh }}>
      {children}
    </SavedListsContext.Provider>
  );
}

export function useSavedLists() {
  const ctx = useContext(SavedListsContext);
  if (!ctx) throw new Error('useSavedLists must be used within a SavedListsProvider');
  return ctx;
}
