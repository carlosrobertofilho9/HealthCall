import React from 'react';
import { Printer, Plus, RefreshCw, Ban } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AppointmentActionsProps {
  hasService: boolean;
  serviceType: 'UBS' | 'HOME_VISIT';
  availableSlotsCount: number;
  onAddClick: () => void;
  onPrintClick: () => void;
  onPrintReportClick: () => void;
  onPrintHomeVisitRouteClick: () => void;
  onRefreshClick: () => void;
  onBlockDayClick: () => void;
  isLoading: boolean;
}

/**
 * Barra de ações da página de marcações.
 */
export const AppointmentActions: React.FC<AppointmentActionsProps> = ({
  hasService,
  serviceType,
  availableSlotsCount,
  onAddClick,
  onPrintClick,
  onPrintReportClick,
  onPrintHomeVisitRouteClick,
  onRefreshClick,
  onBlockDayClick,
  isLoading,
}) => {
  if (!hasService) {
    return null;
  }

  const isHomeVisit = serviceType === 'HOME_VISIT';

  return (
    <>
      {/* =================================================================================
          LAYOUT A: MOBILE (Telas pequenas)
          Focado em toque, grid para melhor distribuição vertical.
         ================================================================================= */}
      <div className="w-full flex flex-col gap-3 md:hidden print:hidden">
        {/* Linha 1: Ações Principais */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <Button
            onClick={onAddClick}
            disabled={availableSlotsCount === 0 || isLoading}
            className="flex items-center justify-center gap-2 h-12"
          >
            <Plus className="w-5 h-5" />
            <span className="truncate">Novo</span>
          </Button>

          <button
            onClick={onBlockDayClick}
            disabled={isLoading}
            className="w-12 h-12 rounded-lg bg-secondary hover:bg-secondary/90 active:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center"
            title="Bloquear Dia"
          >
            <Ban className="w-5 h-5 text-red-500" />
          </button>

          <button
            onClick={onRefreshClick}
            disabled={isLoading}
            className="w-12 h-12 rounded-lg bg-secondary hover:bg-secondary/90 active:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center"
            title="Atualizar"
          >
            <RefreshCw className={`w-5 h-5 text-secondary-foreground ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Linha 2: Ações Secundárias (Impressão) */}
        <div className={isHomeVisit ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-2 gap-2'}>
          {isHomeVisit ? (
            <button
              onClick={() => onPrintHomeVisitRouteClick()}
              className="flex items-center justify-center gap-2 h-12 rounded-lg bg-card border border-border hover:bg-secondary active:bg-card transition-colors text-card-foreground font-semibold text-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Roteiro</span>
            </button>
          ) : (
            <button
              onClick={() => onPrintReportClick()}
              className="flex items-center justify-center gap-2 h-12 rounded-lg bg-card border border-border hover:bg-secondary active:bg-card transition-colors text-card-foreground font-semibold text-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Relatório</span>
            </button>
          )}

          {!isHomeVisit && (
          <button
            onClick={() => onPrintClick()}
            className="flex items-center justify-center gap-2 h-12 rounded-lg bg-secondary hover:bg-secondary/90 active:bg-secondary transition-colors text-secondary-foreground font-semibold text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Ficha</span>
          </button>
          )}
        </div>
      </div>

      {/* =================================================================================
          LAYOUT B: DESKTOP (Telas médias e grandes)
          Layout horizontal limpo, sem quebra de linha.
         ================================================================================= */}
      <div className="hidden md:flex items-center gap-3 print:hidden">
         {/* Grupo 1: Ações Operacionais */}
         <div className="flex items-center gap-2">
            <Button
              onClick={onAddClick}
              disabled={availableSlotsCount === 0 || isLoading}
              className="w-auto px-8"
            >
              <Plus className="w-5 h-5" />
              <span>Nova Marcação</span>
            </Button>

            <div className="flex items-center gap-2">
              <button
                onClick={onBlockDayClick}
                disabled={isLoading}
                className="h-14 px-6 rounded-full bg-secondary hover:bg-secondary/90 transition-colors disabled:opacity-50 text-secondary-foreground font-bold flex items-center gap-2"
                title="Bloquear Dia"
              >
                <Ban className="w-5 h-5 text-red-500" />
                <span>Bloquear</span>
              </button>

              <button
                onClick={onRefreshClick}
                disabled={isLoading}
                className="h-14 px-6 rounded-full bg-secondary hover:bg-secondary/90 transition-colors disabled:opacity-50 text-secondary-foreground font-bold flex items-center gap-2"
                title="Atualizar"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
         </div>

         {/* Divisor Vertical */}
         <div className="w-px h-8 bg-border mx-2" />

         {/* Grupo 2: Ações de Impressão */}
         <div className="flex items-center gap-2">
            {isHomeVisit ? (
              <button
                onClick={() => onPrintHomeVisitRouteClick()}
                className="h-14 px-6 rounded-full bg-card border border-border hover:bg-secondary transition-colors text-card-foreground font-bold flex items-center gap-2 whitespace-nowrap"
              >
                <Printer className="w-5 h-5" />
                <span>Roteiro</span>
              </button>
            ) : (
              <button
                onClick={() => onPrintReportClick()}
                className="h-14 px-6 rounded-full bg-card border border-border hover:bg-secondary transition-colors text-card-foreground font-bold flex items-center gap-2 whitespace-nowrap"
              >
                <Printer className="w-5 h-5" />
                <span>Relatório</span>
              </button>
            )}

            {!isHomeVisit && (
            <button
              onClick={() => onPrintClick()}
              className="h-14 px-6 rounded-full bg-secondary hover:bg-secondary/90 transition-colors text-secondary-foreground font-bold flex items-center gap-2 whitespace-nowrap"
            >
              <Printer className="w-5 h-5" />
              <span>Ficha</span>
            </button>
            )}
         </div>
      </div>
    </>
  );
};

export default AppointmentActions;
