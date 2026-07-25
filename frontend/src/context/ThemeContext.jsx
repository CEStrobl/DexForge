import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

// Themes are applied via a `data-theme` attribute read by src/styles/variables.css.
// Adding a new theme later just means adding a matching :root[data-theme='x'] block there.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('go');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
