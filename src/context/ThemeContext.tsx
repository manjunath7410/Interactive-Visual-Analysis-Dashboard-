import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeConfig, ThemeId, THEMES } from '../types/theme';

interface ThemeContextType {
  themeId: ThemeId;
  theme: ThemeConfig;
  setThemeId: (id: ThemeId) => void;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('insightflow_theme') as ThemeId;
      if (saved && THEMES[saved]) return saved;
    } catch (e) {
      // ignore localStorage errors in sandboxes
    }
    return 'multicolor';
  });

  const setThemeId = (id: ThemeId) => {
    if (THEMES[id]) {
      setThemeIdState(id);
      try {
        localStorage.setItem('insightflow_theme', id);
      } catch (e) {
        // ignore
      }
    }
  };

  const theme = THEMES[themeId] || THEMES.midnight;

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme,
        setThemeId,
        availableThemes: Object.values(THEMES),
      }}
    >
      <div className={`min-h-screen ${theme.classes.bgCanvas} text-slate-100 transition-colors duration-300`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
