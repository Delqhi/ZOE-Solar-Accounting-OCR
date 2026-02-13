/**
 * designOS Theme Switcher
 * Dark/Light mode toggle with designOS styling
 */

import { useState, useEffect } from 'react';
import { Button } from './Button';

export type Theme = 'dark' | 'light' | 'system';

export interface ThemeSwitcherProps {
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  className?: string;
}

// Theme icons
const Icons = {
  sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  monitor: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
};

export function ThemeSwitcher({ 
  theme: controlledTheme,
  onThemeChange,
  className = '',
}: ThemeSwitcherProps) {
  const [internalTheme, setInternalTheme] = useState<Theme>('dark');

  // Get current theme (controlled or internal)
  const currentTheme = controlledTheme || internalTheme;

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (currentTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', currentTheme);
    }

    // Update CSS variables for light mode
    if (currentTheme === 'light') {
      root.style.setProperty('--color-background', '#ffffff');
      root.style.setProperty('--color-surface', '#f8f9fa');
      root.style.setProperty('--color-surface-hover', '#e9ecef');
      root.style.setProperty('--color-border', '#dee2e6');
      root.style.setProperty('--color-text', '#212529');
      root.style.setProperty('--color-text-muted', '#6c757d');
      root.style.setProperty('--color-text-inverted', '#ffffff');
    } else {
      // Reset to dark mode defaults
      root.style.setProperty('--color-background', '#0A0E14');
      root.style.setProperty('--color-surface', '#151A23');
      root.style.setProperty('--color-surface-hover', '#1E2532');
      root.style.setProperty('--color-border', '#2A3142');
      root.style.setProperty('--color-text', '#E6EDF3');
      root.style.setProperty('--color-text-muted', '#8B949E');
      root.style.setProperty('--color-text-inverted', '#0A0E14');
    }

    // Notify parent
    onThemeChange?.(currentTheme);

    // Listen for system theme changes
    if (currentTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        root.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Return empty cleanup function for non-system themes
    return undefined;
  }, [currentTheme, onThemeChange]);

  const handleThemeChange = (theme: Theme) => {
    if (!controlledTheme) {
      setInternalTheme(theme);
    }
    onThemeChange?.(theme);
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: 'var(--spacing-xs)',
        backgroundColor: 'var(--color-surface)',
        padding: 'var(--spacing-xs)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid var(--color-border)`,
      }}
    >
      <Button
        variant={currentTheme === 'light' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => handleThemeChange('light')}
        aria-label="Light mode"
        style={{ padding: 'var(--spacing-sm)' }}
      >
        <Icons.sun />
      </Button>
      
      <Button
        variant={currentTheme === 'dark' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => handleThemeChange('dark')}
        aria-label="Dark mode"
        style={{ padding: 'var(--spacing-sm)' }}
      >
        <Icons.moon />
      </Button>
      
      <Button
        variant={currentTheme === 'system' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => handleThemeChange('system')}
        aria-label="System preference"
        style={{ padding: 'var(--spacing-sm)' }}
      >
        <Icons.monitor />
      </Button>
    </div>
  );
}

// Hook for theme management
export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const getInitialTheme = (): Theme => {
    const saved = localStorage.getItem('designos-theme') as Theme | null;
    return saved || 'dark';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme());

  useEffect(() => {
    localStorage.setItem('designos-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

// Theme provider wrapper
export function ThemeProvider({ 
  children,
  initialTheme = 'dark',
}: { 
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setTheme(initialTheme);
  }, [initialTheme, setTheme]);

  return (
    <>
      <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
      {children}
    </>
  );
}