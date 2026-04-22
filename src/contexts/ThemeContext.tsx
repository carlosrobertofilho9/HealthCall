import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type ThemeId =
  | 'healthcall'
  | 'floresta'
  | 'oceano'
  | 'eclipse'
  | 'aurora'
  | 'sakura'
  | 'indigo'
  | 'neve'
  | 'sol'
  | 'menta'
  | 'lavanda'
  | 'coral'
  | 'safira';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  type: 'light' | 'dark';
  /** Cor de preview (primary) */
  previewPrimary: string;
  /** Cor de preview (background) */
  previewBackground: string;
  /** Cor de preview (accent/secondary) */
  previewAccent: string;
}

export const THEMES: ThemeDefinition[] = [
  // --- Marca HealthCall ---
  {
    id: 'healthcall',
    name: 'HealthCall',
    description: 'Clínico, claro e institucional',
    type: 'light',
    previewPrimary: '#001B3D',
    previewBackground: '#F4F6F8',
    previewAccent: '#00BB94',
  },
  // --- Escuros ---
  {
    id: 'floresta',
    name: 'Floresta',
    description: 'Verde profundo e natural',
    type: 'dark',
    previewPrimary: '#38e07b',
    previewBackground: '#122118',
    previewAccent: '#264532',
  },
  {
    id: 'oceano',
    name: 'Oceano',
    description: 'Azul sereno e profundo',
    type: 'dark',
    previewPrimary: '#38bdf8',
    previewBackground: '#0c1a2e',
    previewAccent: '#1e3a5f',
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    description: 'Roxo noturno e sofisticado',
    type: 'dark',
    previewPrimary: '#a78bfa',
    previewBackground: '#0f0e17',
    previewAccent: '#2d2645',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Teal vibrante com toques quentes',
    type: 'dark',
    previewPrimary: '#2dd4bf',
    previewBackground: '#0d1f1c',
    previewAccent: '#1a3d38',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    description: 'Rosa elegante e delicado',
    type: 'dark',
    previewPrimary: '#f472b6',
    previewBackground: '#1a0d14',
    previewAccent: '#3d1a2d',
  },
  {
    id: 'indigo',
    name: 'Índigo',
    description: 'Azul índigo moderno',
    type: 'dark',
    previewPrimary: '#818cf8',
    previewBackground: '#0e0f1c',
    previewAccent: '#1e2040',
  },
  // --- Claros ---
  {
    id: 'neve',
    name: 'Neve',
    description: 'Limpo, moderno e profissional',
    type: 'light',
    previewPrimary: '#0ea5e9',
    previewBackground: '#f8fafc',
    previewAccent: '#e2e8f0',
  },
  {
    id: 'sol',
    name: 'Sol',
    description: 'Quente, acolhedor e vibrante',
    type: 'light',
    previewPrimary: '#d97706',
    previewBackground: '#fffdf5',
    previewAccent: '#fde68a',
  },
  {
    id: 'menta',
    name: 'Menta',
    description: 'Fresco, natural e calmo',
    type: 'light',
    previewPrimary: '#059669',
    previewBackground: '#f7fee7',
    previewAccent: '#bbf7d0',
  },
  {
    id: 'lavanda',
    name: 'Lavanda',
    description: 'Suave, elegante e relaxante',
    type: 'light',
    previewPrimary: '#7c3aed',
    previewBackground: '#faf5ff',
    previewAccent: '#ddd6fe',
  },
  {
    id: 'coral',
    name: 'Coral',
    description: 'Energético, amigável e moderno',
    type: 'light',
    previewPrimary: '#ea580c',
    previewBackground: '#fffaf0',
    previewAccent: '#fed7aa',
  },
  {
    id: 'safira',
    name: 'Safira',
    description: 'Sóbrio, confiável e sereno',
    type: 'light',
    previewPrimary: '#0284c7',
    previewBackground: '#f0f9ff',
    previewAccent: '#7dd3fc',
  },
];

const STORAGE_KEY = 'healthcall-theme';
const DEFAULT_THEME: ThemeId = 'healthcall';
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
  root.style.colorScheme = themeDef.type;
  
  if (themeDef.type === 'dark') {
    document.body?.classList.add('dark');
  } else {
    document.body?.classList.remove('dark');
  }

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
