import React from 'react';

export interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const ControleGlicemicoIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="5" y="3" width="10" height="18" rx="2" />
    <rect x="7" y="6" width="6" height="5" rx="1" />
    <path d="M7 14h6" />
    <path d="M7 17h4" />
    <path d="M21 16.5c0 1.38-1.12 2.5-2.5 2.5s-2.5-1.12-2.5-2.5c0-1.88 2.5-4.5 2.5-4.5s2.5 2.62 2.5 4.5Z" />
  </svg>
);

export const ControlePressaoIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="6" width="12" height="12" rx="2" />
    <path d="M7 6v12" />
    <path d="M11 6v12" />
    <path d="M15 12h2a2 2 0 0 1 2 2v2" />
    <circle cx="19" cy="18" r="3" />
    <path d="M19 18l1-1" />
  </svg>
);

export const FichaCurativosIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <path d="M14 2v6h6" />
    <path transform="rotate(-45 12 14)" d="M8 12h8v4H8z" />
    <path transform="rotate(-45 12 14)" d="M10 12v4" />
    <path transform="rotate(-45 12 14)" d="M14 12v4" />
  </svg>
);

export const LavagemOuvidoIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a1 1 0 0 1-2 0c0-5 6-5 6-10a4.5 4.5 0 1 0-9 0c0 1.63-.6 3.09-1.72 4.12l-1.58 1.58A2.5 2.5 0 0 0 6 18.5V20"/>
    <path d="M11 12c-1.5 0-2-1-2-2s1-2 3-2 3 1 3 2-1 2-2 2z" />
    <path d="M2.5 10A1.5 1.5 0 1 0 4 8.5C4 7 2.5 5 2.5 5S1 7 1 8.5A1.5 1.5 0 1 0 2.5 10z" />
  </svg>
);

export const ProtocoloProcedimentoIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 3H5a2 2 0 0 0-2 2v4m4 12H5a2 2 0 0 1-2-2v-4"/>
    <path d="M21 9V5a2 2 0 0 0-2-2h-4"/>
    <path d="M9 21h4"/>
    <path d="M8 12h8" />
    <path d="M10 10v4" />
    <path d="M14 10v4" />
    <circle cx="12" cy="12" r="8" opacity="0.2" />
  </svg>
);

export const ReacaoAdversaIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <rect x="9" y="10" width="6" height="8" rx="3" transform="rotate(-45 12 14)" />
    <path d="M9.5 11.5l5 5" transform="rotate(-45 12 14)" />
  </svg>
);

export const MedicacaoInjetavelIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 21l3-3" />
    <path d="M15 6l-9 9" />
    <path d="M18 9l-9 9" />
    <path d="M6 15l3 3" />
    <path d="M15 6l3 3" />
    <path d="M17 4l3 3" />
    <path d="M19 6l2-2" />
    <path d="M10 10l1.5 1.5" />
    <path d="M12 12l1.5 1.5" />
    <path d="M14 14l1.5 1.5" />
  </svg>
);

export const FormulaLacteaIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 5c0-1.5.5-3 2-3s2 1.5 2 3" />
    <path d="M8 7h8v2H8z" />
    <path d="M8 9v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9" />
    <path d="M10 13h4" />
    <path d="M10 17h4" />
    <path d="M4 12a1.5 1.5 0 1 0 3 0c0-1.5-1.5-3-1.5-3S4 10.5 4 12z" />
  </svg>
);

export const SolicitacaoCurativoIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 8H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2z" />
    <path d="M15 8V6a2 2 0 0 0-2-2H11a2 2 0 0 0-2 2v2" />
    <path d="M12 12v6" />
    <path d="M9 15h6" />
  </svg>
);

export const FolhaPendenciasIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10l-4-4z" />
    <rect x="8" y="10" width="3" height="3" />
    <path d="M13 11.5h3" />
    <rect x="8" y="15" width="3" height="3" />
    <path d="M13 16.5h3" />
    <path d="M14 2v6h6" />
  </svg>
);

export const CapaCadernetaIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M14 2v8l2-2 2 2V2" />
    <path d="M8 12h4" />
    <path d="M10 10v4" />
  </svg>
);

export const HasLifestyleIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19.5 12.572l-7.5 7.428l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566z" />
    <path d="M8 13h2l1-3 2 6 1-3h2" />
  </svg>
);

export const DmLifestyleIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20.5c4 0 7-3 7-7 0-3.5-2.5-6-5-7-1.5-.5-3-.5-4.5 0-2.5 1-5 3.5-5 7 0 4 3 7 7 7z" />
    <path d="M12 4v3" />
    <path d="M4 14c2-2 6-2 10 0s6 2 8 0" />
    <path d="M14 14v2" />
    <path d="M10 12.5v2" />
  </svg>
);

export const DlpLifestyleIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2C8 2 6 7 6 13a6 6 0 0 0 12 0c0-6-2-11-6-11z" />
    <circle cx="12" cy="14" r="3" />
    <path d="M12 5v2" />
    <path d="M12 2c1.5-1.5 3.5-.5 3.5 1.5 0 2-2 2.5-3.5 2.5" />
  </svg>
);

export const SleepLifestyleIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    <path d="M16 6h3l-3 3h3" />
    <path d="M12 10h2l-2 2h2" opacity="0.6" />
    <path d="M7 18a3 3 0 0 0 3-3c0-1.7 1.5-3 3-3a3 3 0 0 1 3 3 3 3 0 0 0 3 3H7z" />
  </svg>
);
