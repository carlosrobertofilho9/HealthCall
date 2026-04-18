import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type ThemeId =
  | 'floresta'
  | 'oceano'
  | 'eclipse'
  | 'aurora'
  | 'sakura'
  | 'indigo';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  /** Cor de preview (primary) */
  previewPrimary: string;
  /** Cor de preview (background) */
  previewBackground: string;
  /** Cor de preview (accent/secondary) */
  previewAccent: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'floresta',
    name: 'Floresta',
    description: 'Verde profundo e natural',
    previewPrimary: '#38e07b',
    previewBackground: '#122118',
    previewAccent: '#264532',
  },
  {
    id: 'oceano',
    name: 'Oceano',
    description: 'Azul sereno e profundo',
    previewPrimary: '#38bdf8',
    previewBackground: '#0c1a2e',
    previewAccent: '#1e3a5f',
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    description: 'Roxo noturno e sofisticado',
    previewPrimary: '#a78bfa',
    previewBackground: '#0f0e17',
    previewAccent: '#2d2645',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Teal vibrante com toques quentes',
    previewPrimary: '#2dd4bf',
    previewBackground: '#0d1f1c',
    previewAccent: '#1a3d38',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    description: 'Rosa elegante e delicado',
    previewPrimary: '#f472b6',
    previewBackground: '#1a0d14',
    previewAccent: '#3d1a2d',
  },
  {
    id: 'indigo',
    name: 'Índigo',
    description: 'Azul índigo moderno',
    previewPrimary: '#818cf8',
    previewBackground: '#0e0f1c',
    previewAccent: '#1e2040',
  },
];

const STORAGE_KEY = 'healthcall-theme';
const DEFAULT_THEME: ThemeId = 'floresta';
const THEME_IDS = THEMES.map(theme => theme.id);

// ─── Contexto ─────────────────────────────────────────────────────────────────

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeDefinition[];
  currentThemeDef: ThemeDefinition;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

function applyTheme(themeId: ThemeId) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const themeDef = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  root.dataset.theme = themeDef.id;
  root.style.colorScheme = 'dark';
  document.body?.classList.remove('dark');

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.content = themeDef.previewBackground;
  }
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && THEME_IDS.includes(stored as ThemeId)) {
        return stored as ThemeId;
      }
    } catch (_) { /* ignore */ }
    return DEFAULT_THEME;
  });

  // Aplica o tema ao montar e sempre que mudar
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeId) => {
    if (!THEME_IDS.includes(newTheme)) return;

    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (_) { /* ignore */ }
    applyTheme(newTheme);
  };

  const currentThemeDef = THEMES.find(t => t.id === theme) ?? THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, currentThemeDef }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
};
