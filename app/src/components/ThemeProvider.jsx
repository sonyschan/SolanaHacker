import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'default', setTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('default');

  const setTheme = (name) => {
    if (name && name !== 'default') {
      document.documentElement.setAttribute('data-theme', name);
      localStorage.setItem('memeforge-theme', name);
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('memeforge-theme');
    }
    setThemeState(name || 'default');
  };

  useEffect(() => {
    // URL param > localStorage > default
    const params = new URLSearchParams(window.location.search);
    const urlTheme = params.get('theme');
    const stored = localStorage.getItem('memeforge-theme');
    const resolved = urlTheme || stored || 'default';
    setTheme(resolved);

    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      setTheme(p.get('theme') || stored || 'default');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
