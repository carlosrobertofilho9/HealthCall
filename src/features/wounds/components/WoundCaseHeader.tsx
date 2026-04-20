import React from 'react';
import type { WoundCase } from '../types';
import { Badge, Button } from '@/components/ui';
import { FileText, History, RotateCcw } from 'lucide-react';

interface WoundCaseHeaderProps {
  wound: WoundCase | null;
  onCloseCase: () => void;
  onReopenCase: () => void;
  onGenerateUbsDocument: () => void;
}

const WoundCaseHeader: React.FC<WoundCaseHeaderProps> = ({
  wound,
  onCloseCase,
  onReopenCase,
  onGenerateUbsDocument,
}) => {
  if (!wound) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Selecione uma ferida para visualizar os detalhes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{wound.anatomical_code}</h2>
          <p className="text-sm text-muted-foreground">Etiologia: {wound.etiology}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={wound.status === 'encerrada' ? 'muted' : 'warning'}>{wound.status}</Badge>
          {wound.closure_type && <Badge variant="outline">Fechamento: {wound.closure_type}</Badge>}
          <Badge variant="secondary">Versão {wound.version}</Badge>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>Início da lesão: {new Date(wound.started_at).toLocaleDateString('pt-BR')}</p>
        {wound.last_entry_at && <p>Última evolução: {new Date(wound.last_entry_at).toLocaleString('pt-BR')}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {wound.status !== 'encerrada' ? (
          <Button type="button" size="sm" onClick={onCloseCase}>
            <History className="h-4 w-4" />
            Encerrar acompanhamento
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" size="sm" onClick={onReopenCase}>
              <RotateCcw className="h-4 w-4" />
              Reabrir ferida
            </Button>
            {wound.closure_type === 'ubs' && (
              <Button type="button" size="sm" onClick={onGenerateUbsDocument}>
                <FileText className="h-4 w-4" />
                Gerar referência UBS
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WoundCaseHeader;
