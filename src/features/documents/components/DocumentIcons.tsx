import React from 'react';
import {
  Candy,
  Heart,
  Bandage,
  Ear,
  ClipboardList,
  AlertTriangle,
  Syringe,
  Baby,
  ShoppingCart,
  ListChecks,
  Book,
  Activity,
  Apple,
  TrendingDown,
  Moon,
} from 'lucide-react';

export interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const ControleGlicemicoIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <Candy size={size} {...props} />
);

export const ControlePressaoIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <Heart size={size} {...props} />
);

export const FichaCurativosIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <Bandage size={size} {...props} />
);

export const LavagemOuvidoIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <Ear size={size} {...props} />
);

export const ProtocoloProcedimentoIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <ClipboardList size={size} {...props} />
);

export const ReacaoAdversaIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <AlertTriangle size={size} {...props} />
);

export const MedicacaoInjetavelIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <Syringe size={size} {...props} />
);

export const FormulaLacteaIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <Baby size={size} {...props} />
);

export const SolicitacaoCurativoIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <ShoppingCart size={size} {...props} />
);

export const FolhaPendenciasIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <ListChecks size={size} {...props} />
);

export const CapaCadernetaIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <Book size={size} {...props} />
);

export const HasLifestyleIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <Activity size={size} {...props} />
);

export const DmLifestyleIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <Apple size={size} {...props} />
);

export const DlpLifestyleIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <TrendingDown size={size} {...props} />
);

export const SleepLifestyleIcon: React.FC<CustomIconProps> = ({ size = 24, ...props }) => (
  <Moon size={size} {...props} />
);
