export const DISPLAY_CLASS = {
  page: 'relative h-dvh max-h-dvh overflow-hidden bg-[#F4F6F8] text-[#001B3D]',
  pageCentered:
    'relative flex h-dvh max-h-dvh flex-col items-center justify-center overflow-hidden bg-[#F4F6F8] px-5 text-[#001B3D]',
  header:
    'shrink-0 rounded-[1.5rem] border border-[#DCE5EE] bg-white/90 px-4 py-3 shadow-[0_18px_50px_rgba(0,27,61,0.08)] backdrop-blur-xl sm:px-5',
  panel:
    'rounded-[2rem] border border-[#DCE5EE] bg-white/90 text-[#001B3D] shadow-[0_24px_70px_rgba(0,27,61,0.08)] backdrop-blur-xl',
  heroPanel:
    'rounded-[2rem] border border-[#DCE5EE] bg-white/95 text-[#001B3D] shadow-[0_28px_80px_rgba(0,27,61,0.09)] backdrop-blur-xl',
  panelItem: 'rounded-[1.5rem] border border-[#E5ECF3] bg-[#F8FAFC]',
  panelItemInteractive:
    'transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00BB94]/40 hover:bg-white hover:shadow-[0_14px_36px_rgba(0,27,61,0.07)]',
  panelItemActive:
    'border-[#00BB94]/50 bg-[#E6F7F2] shadow-[0_18px_42px_rgba(0,187,148,0.16)]',
  destinationPill:
    'inline-flex max-w-full items-center justify-center gap-3 rounded-[1.5rem] border px-4 py-3 shadow-[0_18px_45px_rgba(0,27,61,0.08)] sm:gap-4 sm:px-5 sm:py-4',
  iconTile:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#DCE5EE] bg-white shadow-[0_10px_24px_rgba(0,27,61,0.06)] lg:h-12 lg:w-12',
  statusBadge:
    'inline-flex items-center gap-2 rounded-full border border-[#BFEFE5] bg-[#E6F7F2] px-4 py-2 text-sm font-bold text-[#007A65]',
  metricPill:
    'inline-flex items-center gap-2 rounded-full border border-[#E5ECF3] bg-white/80 px-3 py-2 text-sm font-bold text-[#001B3D]',
  iconPrimary: 'text-[#00BB94]',
  textMuted: 'text-[#64748B]',
  textSoft: 'text-[#94A3B8]',
  callOverlayBackdrop: 'bg-[#F4F6F8]/95',
  warningBackdrop:
    'bg-[linear-gradient(135deg,#F8FAFC_0%,#F4F6F8_50%,#EAF3FF_100%)]',
  warningMedia:
    'overflow-hidden rounded-[2rem] border border-[#DCE5EE] bg-white/80 shadow-[0_30px_80px_rgba(0,27,61,0.16)] backdrop-blur-xl',
  warningMessagePanel:
    'rounded-[2rem] border border-[#DCE5EE] bg-white/90 px-10 py-12 text-center shadow-[0_30px_80px_rgba(0,27,61,0.16)] backdrop-blur-xl',
  warningCaption:
    'rounded-[1.5rem] border border-[#DCE5EE] bg-white/95 p-5 shadow-[0_18px_50px_rgba(0,27,61,0.10)] backdrop-blur-md md:p-6',
} as const;

export const DISPLAY_DESTINATION_COLOR = {
  triagem: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-[#B7791F]',
    accentBgClassName: 'bg-[#FFF7E8]',
    borderClassName: 'border-[#F2C879]',
  },
  medico: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-[#001B3D]',
    accentBgClassName: 'bg-[#EAF3FF]',
    borderClassName: 'border-[#BFD6FF]',
  },
  enfermagem: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-[#1466F5]',
    accentBgClassName: 'bg-[#EAF3FF]',
    borderClassName: 'border-[#BFD6FF]',
  },
  vacina: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-[#007A65]',
    accentBgClassName: 'bg-[#E6F7F2]',
    borderClassName: 'border-[#8DDED0]',
  },
  odonto: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-[#007A65]',
    accentBgClassName: 'bg-[#F0FDFA]',
    borderClassName: 'border-[#9DE7DA]',
  },
  administrativo: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-[#A16207]',
    accentBgClassName: 'bg-[#FFF7E8]',
    borderClassName: 'border-[#F2C879]',
  },
  padrao: {
    overlayClassName: DISPLAY_CLASS.callOverlayBackdrop,
    accentTextClassName: 'text-[#007A65]',
    accentBgClassName: 'bg-[#E6F7F2]',
    borderClassName: 'border-[#8DDED0]',
  },
} as const;
