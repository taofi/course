// src/contexts/useTheme.ts
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

/**
 * Кастомный хук для управления светлой/темной темой.
 * Он управляет классом 'dark' на <html> элементе.
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Получаем тему из localStorage или устанавливаем 'system' по умолчанию
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });

  // Эффект, который применяет класс 'dark' к элементу <html>
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    const isSystemDark = theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Удаляем предыдущие классы
    root.classList.remove('light', 'dark');

    if (isDark || isSystemDark) {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.add('light');
    }
    
    // Сохраняем выбор пользователя (исключая 'system', чтобы сбрасывать его)
    if (theme !== 'system') {
      localStorage.setItem('theme', theme);
    } else {
      localStorage.removeItem('theme');
    }
  }, [theme]);
  
  return { theme, setTheme };
};