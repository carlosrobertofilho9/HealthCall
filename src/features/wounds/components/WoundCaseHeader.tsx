import React from 'react';
import type { WoundCase } from '../types';
import { Badge, Button } from '@/components/ui';
import { PencilLine, RefreshCw, CheckCircle2 } from 'lucide-react';
import AnatomicalMiniMap from '@/components/clinical/AnatomicalMiniMap';

import { cn } from '@/lib/utils';

interface WoundCaseHeaderProps {
  wound: WoundCase | null;
  onEditCase: () => void;
  onCloseCase: () => void;
  onReopenCase: () => void;
}

const WoundCaseHeader: React.FC<WoundCaseHeaderProps> = ({
  wound,
  onEditCase,
  onCloseCase,
  onReopenCase,
}) => {
  if (!wound) return null;

  return (
    <div className="space-y-4 rounded-3xl border border-border/40 bg-card/40 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <AnatomicalMiniMap code={wound.anatomical_code} size={42} className="shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground leading-tight">{wound.anatomical_code}</h2>
              {wound.status !== 'encerrada' && (
                <button 
                  onClick={onEditCase}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  title="Editar dados da ferida"
                >
                  <PencilLine className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
              Etiologia: <span className="text-foreground">{wound.etiology}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={wound.status === 'encerrada' ? 'muted' : 'warning'}
            className={cn(
               wound.status === 'ativa' && "animate-pulse"
            )}
          >
            {wound.status}
          </Badge>
          {wound.closure_type && <Badge variant="outline">Fechamento: {wound.closure_type}</Badge>}
          <Badge variant="secondary">Versão {wound.version}</Badge>
        </div>
      </div>

      {wound.comorbidities && wound.comorbidities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 py-1">
          {wound.comorbidities.map(c => (
            <Badge key={c} variant="secondary" className="text-[9px] h-5 py-0 px-2 bg-secondary/30 text-muted-foreground border-none">
              {c}
            </Badge>
          ))}
        </div>
      )}

      <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 flex gap-4">
        <p>Início: {new Date(wound.started_at).toLocaleDateString('pt-BR')}</p>
        {wound.last_entry_at && <p>Última: {new Date(wound.last_entry_at).toLocaleDateString('pt-BR')}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
        <div className="flex flex-wrap gap-2">
          {wound.status === 'encerrada' && (
            <Button type="button" variant="secondary" size="sm" onClick={onReopenCase} className="h-8 text-xs font-semibold">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Reabrir ferida
            </Button>
          )}
        </div>

        {wound.status !== 'encerrada' && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onCloseCase}
            className="h-8 px-2 text-xs text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Encerrar acompanhamento
          </Button>
        )}
      </div>
    </div>
  );
};

export default WoundCaseHeader;
