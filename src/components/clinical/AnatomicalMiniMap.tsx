import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

// Coordenadas aproximadas (x, y) em porcentagem para cada código anatômico
// Baseado em uma silhueta de 100x100
const ANATOMICAL_COORDINATES: Record<string, { x: number; y: number; side: 'front' | 'back' }> = {
  // Cabeça
  'Frontal': { x: 50, y: 5, side: 'front' },
  'ParietalD': { x: 44, y: 4, side: 'front' },
  'ParietalE': { x: 56, y: 4, side: 'front' },
  // Pescoço
  'CervicalAnt': { x: 50, y: 12, side: 'front' },
  'CervicalLatD': { x: 45, y: 12, side: 'front' },
  'CervicalLatE': { x: 55, y: 12, side: 'front' },
  // Tórax
  'ToraxD': { x: 40, y: 22, side: 'front' },
  'ToraxE': { x: 60, y: 22, side: 'front' },
  'Esternal': { x: 50, y: 22, side: 'front' },
  // Abdomen
  'QSD': { x: 43, y: 35, side: 'front' },
  'QSE': { x: 57, y: 35, side: 'front' },
  'QID': { x: 43, y: 42, side: 'front' },
  'QIE': { x: 57, y: 42, side: 'front' },
  // Membros Superiores
  'BracoD': { x: 28, y: 28, side: 'front' },
  'AntebracoD': { x: 20, y: 40, side: 'front' },
  'MaoD': { x: 14, y: 52, side: 'front' },
  'BracoE': { x: 72, y: 28, side: 'front' },
  'AntebracoE': { x: 80, y: 40, side: 'front' },
  'MaoE': { x: 86, y: 52, side: 'front' },
  // Membros Inferiores
  'CoxaD': { x: 42, y: 65, side: 'front' },
  'PernaD': { x: 40, y: 80, side: 'front' },
  'MaleoloLD': { x: 42, y: 92, side: 'front' },
  'PeD': { x: 40, y: 96, side: 'front' },
  'CoxaE': { x: 58, y: 65, side: 'front' },
  'PernaE': { x: 60, y: 80, side: 'front' },
  'MaleoloLE': { x: 58, y: 92, side: 'front' },
  'PeE': { x: 60, y: 96, side: 'front' },
  // Dorso
  'EscapularD': { x: 40, y: 22, side: 'back' },
  'EscapularE': { x: 60, y: 22, side: 'back' },
  'Lombar': { x: 50, y: 42, side: 'back' },
  'Sacral': { x: 50, y: 52, side: 'back' },
};

interface AnatomicalMiniMapProps {
  code: string;
  className?: string;
  size?: number;
}

export const AnatomicalMiniMap: React.FC<AnatomicalMiniMapProps> = ({ code, className, size = 48 }) => {
  const coord = useMemo(() => ANATOMICAL_COORDINATES[code] || null, [code]);

  if (!coord) return null;

  return (
    <div 
      className={cn("relative inline-flex items-center justify-center bg-secondary/20 rounded-xl p-1 border border-primary/10", className)}
      style={{ width: size, height: size * 1.5 }}
      title={`Localização: ${code}`}
    >
      <svg
        viewBox="0 0 100 150"
        className="w-full h-full fill-slate-300 dark:fill-slate-700 stroke-slate-400/50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Silhueta Humana Simplificada */}
        <g transform="translate(0, 10) scale(0.9, 0.9) translate(5, 0)">
          {/* Cabeça */}
          <circle cx="50" cy="15" r="12" />
          {/* Tronco */}
          <path d="M35 30 Q50 25 65 30 L68 75 Q50 80 32 75 Z" />
          {/* Braços */}
          <path d="M32 35 L15 75 L25 80 L35 45" />
          <path d="M68 35 L85 75 L75 80 L65 45" />
          {/* Pernas */}
          <path d="M35 75 L30 140 L45 140 L48 80" />
          <path d="M65 75 L70 140 L55 140 L52 80" />
        </g>

        {/* Ponto da Ferida com Glow */}
        <g filter="url(#glow)">
          <circle
            cx={coord.x}
            cy={coord.y * 1.15 + 15}
            r="7"
            className="fill-primary/40 animate-pulse"
          />
          <circle
            cx={coord.x}
            cy={coord.y * 1.15 + 15}
            r="3.5"
            className="fill-primary"
          />
          <circle
            cx={coord.x}
            cy={coord.y * 1.15 + 15}
            r="1.5"
            className="fill-white"
          />
        </g>
      </svg>
      
      {/* Indicador de Lado (Frente/Costas) se for diferente do padrão */}
      {coord.side === 'back' && (
        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold px-1 rounded-sm uppercase">
          Post
        </div>
      )}
    </div>
  );
};

export default AnatomicalMiniMap;
