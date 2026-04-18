export const DS_RADIUS = {
  surface: 'rounded-2xl',
  surfaceTop: 'rounded-t-2xl',
  section: 'rounded-xl',
  control: 'rounded-lg',
  pill: 'rounded-full',
} as const;

export const DS_RADIUS_VARIANT = {
  smSurface: 'sm:rounded-2xl',
  xlSurface: 'xl:rounded-2xl',
  toasterSurface: 'group-[.toaster]:!rounded-2xl',
  toastSection: 'group-[.toast]:!rounded-xl',
} as const;

export const DS_COLOR = {
  action: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/85',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:brightness-110',
    ghost: 'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
  },
  badge: {
    default: 'border-transparent bg-primary/20 text-primary',
    secondary: 'border-border bg-secondary text-secondary-foreground',
    outline: 'border-border bg-transparent text-foreground',
    success: 'border-success/30 bg-success/10 text-success',
    warning: 'border-warning/30 bg-warning/10 text-warning',
    destructive: 'border-destructive/40 bg-destructive/10 text-destructive',
    muted: 'border-border bg-background text-muted-foreground',
  },
  border: {
    default: 'border-border',
    input: 'border-input',
    transparent: 'border-transparent',
  },
  field: {
    default: 'border-input bg-input text-foreground placeholder:text-muted-foreground',
  },
  focus: {
    field: 'focus:ring-ring',
    visible: 'focus-visible:ring-ring/70 focus-visible:ring-offset-background',
  },
  overlay: {
    default: 'bg-black/50',
    strong: 'bg-black/60',
    handle: 'bg-white/20',
  },
  surface: {
    card: 'border-border bg-card text-card-foreground',
    section: 'border-border bg-secondary/20 text-foreground',
    popover: 'border-border bg-popover text-popover-foreground',
    tableFooter: 'bg-secondary/50',
  },
  text: {
    foreground: 'text-foreground',
    muted: 'text-muted-foreground',
    popover: 'text-popover-foreground',
  },
  interactive: {
    active: 'bg-primary text-primary-foreground',
    option: 'text-popover-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
    inactive: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
    row: 'hover:bg-secondary/40',
  },
  utility: {
    separator: 'bg-border',
    switchChecked: 'bg-primary',
    switchUnchecked: 'bg-secondary',
    switchThumb: 'bg-white',
  },
} as const;

export const DS_COLOR_VARIANT = {
  toasterSurface:
    'group-[.toaster]:!bg-background group-[.toaster]:!text-foreground group-[.toaster]:!border-primary',
  toastDescription: 'group-[.toast]:!text-muted-foreground',
  toastAction:
    'group-[.toast]:!bg-primary group-[.toast]:!text-primary-foreground',
  toastCancel:
    'group-[.toast]:!bg-secondary group-[.toast]:!text-secondary-foreground',
} as const;

export type DsRadiusKey = keyof typeof DS_RADIUS;
export type DsRadiusVariantKey = keyof typeof DS_RADIUS_VARIANT;
export type DsColorKey = keyof typeof DS_COLOR;
export type DsColorVariantKey = keyof typeof DS_COLOR_VARIANT;
