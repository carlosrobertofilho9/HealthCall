import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
      className={cn(
        "relative inline-flex items-center justify-center bg-secondary/10 rounded-2xl p-1.5 border border-primary/10 backdrop-blur-sm shadow-sm overflow-hidden", 
        className
      )}
      style={{ width: size, height: size * 1.5 }}
      title={`Localização: ${code}`}
    >
      <svg
        viewBox="0 0 100 150"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow-inner" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Silhueta Humana Realista */}
        <g className="fill-foreground/10 stroke-foreground/40" strokeWidth="1.2" strokeLinejoin="round">
          {/* Contorno Principal do Corpo */}
          <path d="
            M 50,12
            C 43,12 39,17 39,23
            C 39,28 42,31 44,32
            C 44,34 42,35 38,35
            C 30,35 24,38 20,46
            C 17,52 15,62 13,70
            C 11,76 10,81 12,83
            C 14,85 16,84 17,81
            C 19,75 21,65 24,56
            C 26,50 28,47 30,46
            C 29,54 30,64 31,72
            C 32,80 34,83 34,88
            C 34,98 36,108 37,118
            C 38,126 39,132 39,135
            C 38,137 43,138 45,136
            C 45,125 47,105 49,92
            C 49.5,88 49.5,82 50,78
            C 50.5,82 50.5,88 51,92
            C 53,105 55,125 55,136
            C 57,138 62,137 61,135
            C 61,132 62,126 63,118
            C 64,108 66,98 66,88
            C 66,83 68,80 69,72
            C 70,64 71,54 70,46
            C 72,47 74,50 76,56
            C 79,65 81,75 83,81
            C 84,84 86,85 88,83
            C 90,81 89,76 87,70
            C 85,62 83,52 80,46
            C 76,38 70,35 62,35
            C 58,35 56,34 56,32
            C 58,31 61,28 61,23
            C 61,17 57,12 50,12 Z
          " />
        </g>

        {/* Detalhes Anatômicos Internos (Renderizados baseados na visão Frente/Costas) */}
        {coord.side === 'front' && (
          <g className="stroke-foreground/25" fill="none" strokeWidth="0.75" strokeLinecap="round">
            {/* Clavículas */}
            <path d="M 38,36 Q 44,38 49,37 M 62,36 Q 56,38 51,37" />
            {/* Peitoral */}
            <path d="M 30,46 Q 40,51 50,48 Q 60,51 70,46" />
            {/* Linha Central / Abdômen */}
            <path d="M 50,48 L 50,60 M 46,55 Q 50,57 54,55 M 47,63 Q 50,65 53,63" />
            <path d="M 49,70 Q 50,71 51,70" /> {/* Umbigo */}
            {/* Virilha */}
            <path d="M 40,76 Q 50,85 60,76" />
            {/* Joelhos */}
            <path d="M 35,110 Q 37,112 39,110 M 65,110 Q 63,112 61,110" />
          </g>
        )}

        {coord.side === 'back' && (
          <g className="stroke-foreground/25" fill="none" strokeWidth="0.75" strokeLinecap="round">
            {/* Coluna Vertebral */}
            <path d="M 50,35 Q 51,55 50,75" />
            {/* Escápulas (Omoplatas) */}
            <path d="M 36,42 Q 41,47 37,55 M 64,42 Q 59,47 63,55" />
            {/* Glúteos */}
            <path d="M 35,76 Q 45,86 50,76 Q 55,86 65,76" />
            {/* Dobra posterior do Joelho */}
            <path d="M 35,112 Q 37,110 39,112 M 65,112 Q 63,110 61,112" />
          </g>
        )}

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
        <div className="absolute top-1 right-1 bg-primary/90 text-primary-foreground text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
          Post
        </div>
      )}
    </div>
  );
};

export default AnatomicalMiniMap;