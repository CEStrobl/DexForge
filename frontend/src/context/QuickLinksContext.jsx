import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const QuickLinksContext = createContext(null);

export function QuickLinksProvider({ children }) {
  const [quickLinks, setQuickLinks] = useState([]);
  const { session } = useAuth();

  function refresh() {
    return api
      .get('/api/quick-links')
      .then(setQuickLinks)
      .catch(() => setQuickLinks([]));
  }

  useEffect(() => {
    if (!session) {
      setQuickLinks([]);
      return;
    }
    refresh();
  }, [session]);

  return (
    <QuickLinksContext.Provider value={{ quickLinks, setQuickLinks, refresh }}>
      {children}
    </QuickLinksContext.Provider>
  );
}

export function useQuickLinks() {
  const ctx = useContext(QuickLinksContext);
  if (!ctx) throw new Error('useQuickLinks must be used within a QuickLinksProvider');
  return ctx;
}
