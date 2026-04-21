import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronDown, RotateCcw, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BODY_DIAGRAM_REGIONS,
  type BodyDiagramSide,
  type BodyRegion,
  type BodySubregion,
} from '@/features/wounds/utils/bodyDiagramMapping';

// Importando o componente criado anteriormente
import AnatomicalMiniMap from '@/components/clinical/AnatomicalMiniMap';

const sideLabels: Record<BodyDiagramSide, string> = { 
  front: 'Frente', 
  back: 'Costas' 
};

interface BodyDiagramProps {
  value?: string;
  onChange?: (anatomicalCode: string, selection: { region: BodyRegion; subregion: BodySubregion }) => void;
  selectedCodes?: string[];
  disabled?: boolean;
}

export const BodyDiagram: React.FC<BodyDiagramProps> = ({ 
  value, 
  onChange, 
  selectedCodes = [],
  disabled = false 
}) => {
  const [activeSide, setActiveSide] = useState<BodyDiagramSide>('front');
  const [expandedRegions, setExpandedRegions] = useState<string[]>(['torso_front']);

  const toggleRegion = (key: string) => {
    setExpandedRegions(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const regionsBySide = useMemo(
    () => BODY_DIAGRAM_REGIONS.filter((region) => region.side === activeSide),
    [activeSide]
  );

  return (
    <div className="w-full max-w-5xl mx-auto bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row">
      
      {/* LADO ESQUERDO: Visualizador Anatômico (Importado) */}
      <div className="w-full md:w-2/5 bg-secondary/20 p-6 flex flex-col items-center justify-start relative border-b md:border-b-0 md:border-r border-border min-h-[350px]">
        
        {/* Toggle Frente/Costas flutuante */}
        <div className="absolute top-4 left-0 w-full flex justify-center z-10">
          <div className="flex bg-background/80 backdrop-blur-md p-1 rounded-full border border-border shadow-sm">
            {(Object.keys(sideLabels) as BodyDiagramSide[]).map((side) => (
              <button
                key={side}
                type="button"
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-2",
                  activeSide === side 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveSide(side)}
              >
                {side === 'front' ? <UserRound size={14} /> : <RotateCcw size={14} />}
                {sideLabels[side]}
              </button>
            ))}
          </div>
        </div>

        {/* Renderização do Componente AnatomicalMiniMap */}
        <div className="flex-1 w-full flex items-center justify-center mt-12">
          {value ? (
            <AnatomicalMiniMap code={value} size={200} className="shadow-none border-transparent bg-transparent" />
          ) : (
            <div className="text-center p-6 border border-dashed border-foreground/15 rounded-2xl flex flex-col items-center justify-center bg-background/40">
              <UserRound size={36} className="text-muted-foreground/30 mb-3" />
              <p className="text-xs text-muted-foreground font-medium">Selecione uma região na lista para visualizar no mapa anatômico.</p>
            </div>
          )}
        </div>

        {/* Indicador de outras feridas mapeadas */}
        {selectedCodes.length > 0 && (
          <div className="mt-4 w-full text-center">
             <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
               Feridas Mapeadas
             </p>
             <div className="flex flex-wrap justify-center gap-1.5">
               {selectedCodes.map(code => (
                 <span 
                   key={code} 
                   className={cn(
                     "text-[10px] border px-2 py-0.5 rounded-md font-medium transition-colors",
                     code === value 
                       ? "bg-primary text-primary-foreground border-primary" 
                       : "bg-background text-muted-foreground hover:bg-secondary"
                   )}
                 >
                   {code}
                 </span>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* LADO DIREITO: Menu de Seleção em Acordeão */}
      <div className="w-full md:w-3/5 p-6 bg-background flex flex-col md:max-h-[550px]">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Localização da Ferida</h2>
          <p className="text-sm text-muted-foreground mt-1">Selecione a região e sub-região correspondente.</p>
        </div>

        <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar flex-1 pb-4">
          {regionsBySide.map((region) => {
            const isExpanded = expandedRegions.includes(region.key);
            const hasSelectedChild = region.subregions.some(sub => sub.code === value);

            return (
              <div 
                key={region.key} 
                className={cn(
                  "border rounded-xl transition-all duration-200 overflow-hidden",
                  isExpanded ? "border-primary/30 bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/20",
                  hasSelectedChild && !isExpanded && "border-primary/50"
                )}
              >
                {/* Header do Acordeão */}
                <button
                  type="button"
                  className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none"
                  onClick={() => toggleRegion(region.key)}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "font-semibold text-sm",
                      isExpanded || hasSelectedChild ? "text-primary" : "text-foreground"
                    )}>
                      {region.label}
                    </span>
                    {hasSelectedChild && !isExpanded && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={cn(
                      "text-muted-foreground transition-transform duration-300", 
                      isExpanded && "rotate-180 text-primary"
                    )} 
                  />
                </button>

                {/* Conteúdo do Acordeão */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2">
                        {region.subregions.map((sub) => {
                          const isSelected = value === sub.code;
                          return (
                            <button
                              key={sub.key}
                              type="button"
                              disabled={disabled}
                              className={cn(
                                'relative rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 flex items-center gap-2',
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]'
                                  : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5',
                                disabled && 'opacity-50 cursor-not-allowed'
                              )}
                              onClick={() => {
                                if (onChange) onChange(sub.code, { region, subregion: sub });
                              }}
                            >
                              {isSelected && <CheckCircle2 size={14} className="text-primary-foreground" />}
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          
          {regionsBySide.length === 0 && (
            <div className="text-center p-8 text-muted-foreground text-sm border border-dashed rounded-xl">
              Nenhuma região encontrada para esta visualização.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BodyDiagram;
