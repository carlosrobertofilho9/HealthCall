import { DS_COLOR, DS_RADIUS } from '@/components/ui/design-system';

export const DISPLAY_CLASS = {
  page: 'relative min-h-screen overflow-hidden bg-background text-foreground',
  pageCentered: 'flex min-h-screen flex-col items-center justify-center bg-background text-foreground',
  header: `flex items-center justify-between border-b ${DS_COLOR.border.default} bg-background/90 px-6 py-4 backdrop-blur`,
  panel: `${DS_RADIUS.surface} border ${DS_COLOR.surface.card} shadow-sm`,
  panelItem: `${DS_RADIUS.section} border ${DS_COLOR.border.default} bg-secondary/60`,
  panelItemInteractive: 'transition-colors hover:bg-secondary/80',
  panelItemActive: 'border-primary/50 bg-primary/15 shadow-lg',
  destinationPill: `inline-flex max-w-full items-center justify-center gap-4 ${DS_RADIUS.pill} border px-8 py-4`,
  iconPrimary: 'text-primary',
  textMuted: DS_COLOR.text.muted,
  textSoft: 'text-muted-foreground',
  callOverlayBackdrop: 'bg-background/95',
  warningBackdrop: 'bg-gradient-to-br from-background via-card to-background',
  warningMedia: `${DS_RADIUS.surface} overflow-hidden border ${DS_COLOR.border.default} bg-background/70 shadow-2xl`,
  warningMessagePanel: `${DS_RADIUS.surface} border ${DS_COLOR.border.default} bg-background/70 px-10 py-12 text-center shadow-2xl`,
  warningCaption: `${DS_RADIUS.section} border ${DS_COLOR.border.default} bg-card/90 p-5 backdrop-blur-md md:p-6`,
} as const;

export const DISPLAY_DESTINATION_COLOR = {
  triagem: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-warning',
    accentBgClassName: 'bg-warning/15',
    borderClassName: 'border-warning/50',
  },
  medico: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-chart-3',
    accentBgClassName: 'bg-chart-3/15',
    borderClassName: 'border-chart-3/50',
  },
  enfermagem: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-chart-2',
    accentBgClassName: 'bg-chart-2/15',
    borderClassName: 'border-chart-2/50',
  },
  vacina: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-chart-5',
    accentBgClassName: 'bg-chart-5/15',
    borderClassName: 'border-chart-5/50',
  },
  odonto: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-chart-1',
    accentBgClassName: 'bg-chart-1/15',
    borderClassName: 'border-chart-1/50',
  },
  administrativo: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-chart-4',
    accentBgClassName: 'bg-chart-4/15',
    borderClassName: 'border-chart-4/50',
  },
  padrao: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-primary',
    accentBgClassName: 'bg-primary/15',
    borderClassName: 'border-primary/40',
  },
} as const;
