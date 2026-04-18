import { useTheme, THEMES, type ThemeDefinition } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

// ─── Mini preview card de um tema ────────────────────────────────────────────

function ThemePreview({ theme, active, onClick }: {
  theme: ThemeDefinition;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Selecionar tema ${theme.name}`}
      className={cn(
        'relative flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all duration-200 cursor-pointer',
        'hover:scale-[1.03] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        active
          ? 'border-primary shadow-[0_0_0_3px] shadow-primary/30'
          : 'border-border hover:border-primary/40',
      )}
      style={{ background: theme.previewBackground }}
    >
      {/* Paleta de cores */}
      <div className="flex items-center gap-1.5">
        <span
          className="block size-5 rounded-full shadow-sm ring-1 ring-white/10"
          style={{ background: theme.previewPrimary }}
        />
        <span
          className="block h-5 flex-1 rounded-md opacity-80"
          style={{ background: theme.previewAccent }}
        />
      </div>

      {/* Simulação de UI */}
      <div
        className="rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide opacity-90"
        style={{
          background: theme.previewAccent,
          color: theme.previewPrimary,
        }}
      >
        HealthCall
      </div>

      {/* Nome do tema */}
      <div className="mt-0.5">
        <p className="text-xs font-semibold" style={{ color: theme.previewPrimary }}>
          {theme.name}
        </p>
        <p className="text-[10px] opacity-60" style={{ color: theme.previewPrimary }}>
          {theme.description}
        </p>
      </div>

      {/* Indicador de ativo */}
      {active && (
        <span
          className="absolute right-2 top-2 text-primary"
          style={{ color: theme.previewPrimary }}
          aria-hidden="true"
        >
          <CheckCircle2 size={16} strokeWidth={2.5} />
        </span>
      )}
    </button>
  );
}

// ─── Seletor de temas ─────────────────────────────────────────────────────────

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {THEMES.map(t => (
        <ThemePreview
          key={t.id}
          theme={t}
          active={theme === t.id}
          onClick={() => setTheme(t.id)}
        />
      ))}
    </div>
  );
}
