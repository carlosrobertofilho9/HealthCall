import type { CSSProperties } from 'react';

export const APPOINTMENTS_CHART_COLORS = {
  grid: 'var(--border)',
  axis: 'var(--muted-foreground)',
  primary: 'var(--chart-1)',
  info: 'var(--chart-2)',
  neutral: 'var(--chart-3)',
  warning: 'var(--chart-4)',
  danger: 'var(--chart-5)',
} as const;

export const APPOINTMENTS_CHART_TOOLTIP_CONTENT_STYLE: CSSProperties = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '0.75rem',
  color: 'var(--card-foreground)',
};

export const APPOINTMENTS_CHART_TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: 'var(--muted-foreground)',
  fontWeight: 600,
};

export const APPOINTMENTS_CHART_TOOLTIP_ITEM_STYLE: CSSProperties = {
  color: 'var(--card-foreground)',
};

export const APPOINTMENTS_CHART_LEGEND_WRAPPER_STYLE: CSSProperties = {
  color: 'var(--muted-foreground)',
  fontSize: '0.75rem',
  paddingTop: '0.5rem',
};
