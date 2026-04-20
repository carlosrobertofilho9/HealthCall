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

import { motion } from 'framer-motion';

export const AnatomicalMiniMap: React.FC<AnatomicalMiniMapProps> = ({ code, className, size = 48 }) => {
  const coord = useMemo(() => ANATOMICAL_COORDINATES[code] || null, [code]);

  if (!coord) return null;

  return (
    <div 
      className={cn("relative inline-flex items-center justify-center bg-secondary/10 rounded-2xl p-1.5 border border-primary/10 backdrop-blur-sm shadow-sm overflow-hidden", className)}
      style={{ width: size, height: size * 1.5 }}
      title={`Localização: ${code}`}
    >
      <svg
        viewBox="0 0 100 150"
        className="w-full h-full fill-foreground/20 stroke-foreground/30"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow-inner" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Silhueta Humana Estática */}
        <g transform="translate(0, 10) scale(0.9, 0.9) translate(5, 0)">
          <circle cx="50" cy="15" r="12" />
          <path d="M35 30 Q50 25 65 30 L68 75 Q50 80 32 75 Z" />
          <path d="M32 35 L15 75 L25 80 L35 45" />
          <path d="M68 35 L85 75 L75 80 L65 45" />
          <path d="M35 75 L30 140 L45 140 L48 80" />
          <path d="M65 75 L70 140 L55 140 L52 80" />
        </g>

        {/* Ponto da Ferida com Pulsação Orgânica */}
        <g>
          {/* Outer Ripple */}
          <motion.circle
            cx={coord.x}
            cy={coord.y * 1.15 + 15}
            r="12"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: [0.8, 1.8], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="fill-primary/30"
          />
          {/* Inner Pulse */}
          <motion.circle
            cx={coord.x}
            cy={coord.y * 1.15 + 15}
            r="7"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="fill-primary/40"
          />
          {/* Core */}
          <circle
            cx={coord.x}
            cy={coord.y * 1.15 + 15}
            r="4.5"
            className="fill-primary shadow-lg"
          />
          {/* Highlight */}
          <circle
            cx={coord.x}
            cy={coord.y * 1.15 + 15}
            r="1.5"
            className="fill-white"
          />
        </g>
      </svg>
      
      {/* Indicador de Lado (Frente/Costas) */}
      {coord.side === 'back' && (
        <div className="absolute top-1 right-1 bg-primary/90 text-primary-foreground text-[7px] font-black px-1 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
          Post
        </div>
      )}
    </div>
  );
};

export default AnatomicalMiniMap;
