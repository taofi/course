// src/contexts/ThemeProvider.tsx

import React, { type ReactNode } from 'react';
import { useTheme } from './useTheme'; // Ваш хук управления классом 'dark'
import { ThemeContext, type ThemeContextType } from './themeTypes'; // Импорт типов и объекта контекста

interface ThemeProviderProps {
  children: ReactNode;
}

// ЭТО КОМПОНЕНТ
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, setTheme } = useTheme(); 

  // Логика определения темного режима
  const isSystemDark = theme === 'system' && 
                       (typeof window !== 'undefined') && 
                       window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDarkMode = theme === 'dark' || isSystemDark;

  const value: ThemeContextType = {
    theme,
    setTheme,
    isDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};